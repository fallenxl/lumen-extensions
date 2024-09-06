import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { WidgetContext } from '@home/models/widget-component.models';
import { FanMode, sendCommand, TemperatureControlMode } from './encoder';
import { Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'thermostat-control',
  templateUrl: './tc.component.html',
  styleUrls: ['./tc.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ThermostatControlComponent implements OnInit, OnDestroy {

  constructor() { }

  @Input() ctx: WidgetContext;
  appName: string;
  deviceId: string;

  thermostatData: any = {};
  temperature: number = 0;
  timeout: number;
  isLoaded: boolean = false;
  isValid = false;
  interval: any;
  isModalOpen: boolean = false;
  updateData: any = {};
  blockedButtons = false;
  isError = false
  errorMessage = "";
  private timeoutHandle: any;

  private increaseTempSubject = new Subject<number>();
  private decreaseTempSubject = new Subject<number>();
  private increaseTempSubscription;
  private decreaseTempSubscription;

  private increaseClickCount = 0;
  private decreaseClickCount = 0;
  increment = 0;

  ngOnInit() {
    this.ctx.$scope.isValid = this.isValid;
    this.appName = this.ctx.settings.appName;
    this.ctx.$scope.onDataUpdated = this.onDataUpdated.bind(this);
    this.ctx.$scope.parseData = this.parseData.bind(this);

    this.increaseTempSubscription = this.increaseTempSubject.pipe(
      debounceTime(1000),
      switchMap((increment) => {
        if (!this.blockedButtons) {
          this.performIncreaseTemperature(increment);
        }
        this.blockedButtons = true;
        return [];
      })
    ).subscribe();

    this.decreaseTempSubscription = this.decreaseTempSubject.pipe(
      debounceTime(1000),
      switchMap((decrement) => {
        if (!this.blockedButtons) {
          this.performDecreaseTemperature(decrement);
        }
        this.blockedButtons = true;
        return [];
      })
    ).subscribe();

    if (this.ctx.datasources[0].entityType === 'DEVICE' && this.ctx.datasources[0].type === 'entity' && this.appName) {
      this.ctx.$scope.isValid = true;
      this.isValid = true;

      this.deviceId = this.ctx.datasources[0].name;
      this.ctx.$scope.data = this.ctx.defaultSubscription.data;
      this.ctx.$scope.isLoaded = this.isLoaded;
      this.ctx.$scope.isOn = this.ctx.defaultSubscription.data[0].data[0][1] == "on";
      this.timeout = this.ctx.settings.timeout || 2000;
      this.thermostatData = this.parseData();
      this.updateData = { ...this.thermostatData };
      this.clockInterval();
    }
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.increaseTempSubscription) {
      this.increaseTempSubscription.unsubscribe();
    }
    if (this.decreaseTempSubscription) {
      this.decreaseTempSubscription.unsubscribe();
    }
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }
  }

  parseData() {
    let thermostatData = {};
    let data = this.ctx.defaultSubscription.data;
    if (this.ctx.defaultSubscription) {
      data?.forEach((data) => {
        thermostatData[data.dataKey.label] = {
          label: data.dataKey.label,
          name: data.dataKey.name,
          value: data.data[0][1],
          ts: data.data[0][0],
          units: data.dataKey.units,
          isOn: data.data[0][1] == "on"
        };
      });
    }
    return thermostatData;
  }

  clockInterval() {
    this.ctx.detectChanges();
    const clockElement = document.getElementById('clock');
    this.interval = setInterval(() => {
      const date = new Date();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
      clockElement.innerHTML = `${formattedHours}:${formattedMinutes} ${ampm}`;
    }, 1000);
  }

  increaseTemperature() {
    if (!this.blockedButtons && this.thermostatData.temperatureTarget.value < 28) {
      this.increaseClickCount++;
      this.thermostatData.temperatureTarget.value += 1;
      this.increaseTempSubject.next(this.increaseClickCount);
    }
  }

  decreaseTemperature() {
    if (!this.blockedButtons && this.thermostatData.temperatureTarget.value > 10) {
      this.decreaseClickCount++;
      this.thermostatData.temperatureTarget.value -= 1;
      this.decreaseTempSubject.next(this.decreaseClickCount);
    }
  }

  performIncreaseTemperature(increment) {
    this.timeoutFunction();
    const temperatureTarget = this.ctx.$scope.data.find((data) => data.dataKey.label == "temperatureTarget")?.data[0][1];
    sendCommand(this.appName, this.deviceId, {
      temperature_control_mode: TemperatureControlMode[this.thermostatData.temperatureControlMode.value],
      temperature_unit: 0,
      temperature_target: temperatureTarget + increment
    });
    this.increaseClickCount = 0;
  }

  performDecreaseTemperature(decrement) {
    this.timeoutFunction();
    this.ctx.$scope.isLoaded = true;
    const temperatureTarget = this.ctx.$scope.data.find((data) => data.dataKey.label == "temperatureTarget")?.data[0][1];
    sendCommand(this.appName, this.deviceId, {
      temperature_control_mode: TemperatureControlMode[this.thermostatData.temperatureControlMode.value],
      temperature_unit: 0,
      temperature_target: temperatureTarget - decrement
    });
    this.decreaseClickCount = 0;
  }

  togglePower() {
    this.timeoutFunction();
    sendCommand(this.appName, this.deviceId, {
      temperature_control_enable: this.ctx.$scope.data[0].data[0][1] == "on" ? 0 : 1
    });
  }

  timeoutFunction() {
    document.getElementById("is-loaded").classList.remove('hidden');
    this.ctx.$scope.isLoaded = true;
    this.blockedButtons = true;
    this.isLoaded = true;
    this.isError = false;
    this.errorMessage = "";
    this.timeoutHandle = setTimeout(() => {
      if (this.isLoaded) {
        this.blockedButtons = false;
        this.isLoaded = false;
        this.isError = true;
        this.errorMessage = "Timeout error, please try again.";
        document.getElementById('is-loaded').classList.add('hidden');
        this.updateData = this.parseData();
        this.thermostatData = this.parseData();
      }
      this.ctx.detectChanges();
    }, this.timeout);
  }

  isOn(value) {
    const isOnElement = document.getElementById("is-on");
    const isOffElement = document.getElementById("is-off");
    const settingsElement = document.getElementById('settings-container');
    this.ctx.$scope.isOn = value;
    if (value) {
      isOnElement.classList.remove("hidden");
      settingsElement.classList.remove("hidden");
      isOffElement.classList.add("hidden");
    } else {
      isOnElement.classList.add("hidden");
      settingsElement.classList.add("hidden");
      isOffElement.classList.remove("hidden");
    }
  }

  onDataUpdated() {
    if (this.ctx.$scope.isValid) {
      const data = this.ctx.$scope.parseData();
      this.thermostatData = data;
      this.updateData = data;
      this.isOn(data.systemStatus.isOn);
      this.blockedButtons = false;
      this.isLoaded = false;
      this.isError = false;
      this.errorMessage = "";
      if(this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
      }
      if (this.ctx.$scope.isLoaded) {
        this.ctx.$scope.isLoaded = false;
        document.getElementById('is-loaded').classList.add('hidden');
      }
      this.ctx.detectChanges();
    }
  }

  cancel() {
    this.updateData = this.parseData();
    this.isModalOpen = false;
  }

  confirm() {
    this.timeoutFunction();
    sendCommand(this.appName, this.deviceId, {
      temperature_control_mode: TemperatureControlMode[this.updateData.temperatureControlMode.value],
      temperature_unit: 0,
      temperature_target: parseFloat(this.updateData.temperatureTarget.value),
      fan_mode: FanMode[this.updateData.fanMode.value],
    });
    this.isModalOpen = false;
  }

  toggleModal() {
    this.isModalOpen = !this.isModalOpen;
    if (!this.isModalOpen) {
      this.updateData = this.thermostatData;
    }
  }

  handleInputChange(event) {
    const { name, value } = event.target;
    this.updateData[name].value = value;
    this.thermostatData = this.parseData();
  }

  capitalizeFirstLetter(string) {
    if (typeof string !== 'string' || string.length === 0) {
      return string;
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
