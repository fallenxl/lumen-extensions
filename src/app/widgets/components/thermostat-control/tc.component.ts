import { Component, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
import { WidgetContext } from '@home/models/widget-component.models';
import { sendCommand } from './encoder';
import { timeout } from 'rxjs';

@Component({
  selector: 'thermostat-control',
  templateUrl: './tc.component.html',
  styleUrls: ['./tc.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ThermostatControlComponent implements OnInit {

  constructor(
  ) { }

  @Input() ctx: WidgetContext;
  appName: string;
  deviceId: string;

  thermostatData: any = {}
  temperature: number = 0;
  timeout: number;
  isLoaded: boolean = false;
  isValid = false;

  ngOnInit() {  
    this.ctx.$scope.isValid = this.isValid;
    this.appName = this.ctx.settings.appName
    if (this.ctx.datasources[0].entityType === 'DEVICE' && this.ctx.datasources[0].type === 'entity' && this.appName) {
      this.ctx.$scope.isValid = true;
      this.isValid = true;
     
      this.deviceId = this.ctx.datasources[0].name
      this.ctx.$scope.data = this.ctx.defaultSubscription.data;
      this.ctx.$scope.isLoaded = this.isLoaded;
      this.ctx.$scope.isOn = this.ctx.defaultSubscription.data[0].data[0][1] == "on";
      this.timeout = this.ctx.settings.timeout || 2000;
      this.thermostatData = this.parseData();
      this.ctx.detectChanges();
    }
  }

  parseData() {
    let thermostatData = {};
    let data = this.ctx.defaultSubscription.data
    if (this.ctx.defaultSubscription) {
      data?.forEach((data) => {
        thermostatData[data.dataKey.label] = {
          label: data.dataKey.label,
          name: data.dataKey.name,
          value: data.data[0][1],
          ts: data.data[0][0],
          units: data.dataKey.units,
          isOn: data.data[0][1] == "on"
        }
      });
    }
    return thermostatData;
  }


  async increaseTemperature() {
    this.timeoutFunction();
    const temperatureTarget = this.ctx.$scope.data.find((data) => data.dataKey.label == "temperatureTarget")?.data[0][1];
    sendCommand(this.appName, this.deviceId, {
      temperature_control_mode: 2,
      temperature_unit: 0,
      temperature_target: temperatureTarget + 1
    });

  }

  async decreaseTemperature() {
    this.timeoutFunction();
    this.ctx.$scope.isLoaded = true;
    const temperatureTarget = this.ctx.$scope.data.find((data) => data.dataKey.label == "temperatureTarget")?.data[0][1];
    sendCommand(this.appName, this.deviceId, {
      temperature_control_mode: 2,
      temperature_unit: 0,
      temperature_target: temperatureTarget - 1
    });
  }

  async togglePower() {
    this.timeoutFunction();

    sendCommand(this.appName, this.deviceId, {
      temperature_control_enable: this.ctx.$scope.data[0].data[0][1] == "on" ? 0 : 1
    });
  }


  timeoutFunction() {
    document.getElementById("is-loaded").classList.remove('hidden')
    document.getElementById("is-loaded-bg").classList.remove('hidden')
    this.ctx.$scope.isLoaded = true;

  }
}
