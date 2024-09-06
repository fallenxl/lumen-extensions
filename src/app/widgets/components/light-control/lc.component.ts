import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { WidgetContext } from '@home/models/widget-component.models';
import { sendCommand } from './encoder';
import { Subject, from } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'light-control',
  templateUrl: './lc.component.html',
  styleUrls: ['./lc.component.css']
})
export class LightControlComponent implements OnInit, OnDestroy {

  @Input() ctx: WidgetContext;

  isValid = false;
  appName: string;
  deviceId: string;
  switches: number[] = [];
  switchesCount: number;
  selectedSwitches: Set<number> = new Set();

  private toggleSwitchSubject = new Subject<{ index: number, value: string }>();
  private toggleSwitchSubscription;

  ngOnInit() {
    this.appName = this.ctx.settings.appName;
    this.deviceId = this.ctx.datasources[0].name;
    this.switchesCount = this.ctx.settings.switchesCount;
    this.ctx.$scope.onDataUpdated = this.onDataUpdated.bind(this);
    if (this.ctx.datasources[0].entityType === 'DEVICE' && this.ctx.datasources[0].type === 'entity' && this.appName) {
      this.isValid = true;
      this.ctx.$scope.isValid = true;
      this.ctx.$scope.data = this.ctx.defaultSubscription.data;
      this.switches = this.ctx.$scope.data.map(switchState => {
        return switchState.data[0][1] === 'on' ? 1 : 0;
      });
      console.log(this.ctx.$scope.data)
    }

    this.toggleSwitchSubscription = this.toggleSwitchSubject.pipe(
      debounceTime(1000),
      switchMap(() => from(sendCommand(this.appName, this.deviceId, this.switches)))
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.toggleSwitchSubscription) {
      this.toggleSwitchSubscription.unsubscribe();
    }
  }

  toggleSwitches(index: number, value: string) {
    console.log(index, value)
    console.log(this.switches)
    this.switches[index] = value === 'on' ? 1 : 0;
    this.toggleSwitchSubject.next({ index, value });
  }

  updateSelectedSwitches() {
  
    this.selectedSwitches.forEach(index => {
      const value = this.switches[index] === 1 ? 'off' : 'on';
      this.toggleSwitches(index, value);
    });
    this.selectedSwitches.clear();
  }

  turnOnAll() {
    this.switches.fill(1);
    sendCommand(this.appName, this.deviceId, this.switches);
  }

  turnOffAll() {
    this.switches.fill(0);
    sendCommand(this.appName, this.deviceId, this.switches);
  }

  getSwitchState(index: number): string {
    return this.switches[index] === 1 ? 'on' : 'off';
  }

  isSelected(index: number): boolean {
    return this.selectedSwitches.has(index);
  }

  onDataUpdated() {
    // this.switches = this.ctx.$scope.data[0].data[0].map(switchState => switchState === 'on' ? 1 : 0);
  }
}
