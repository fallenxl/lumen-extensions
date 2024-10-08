import { Component, Input, OnInit } from '@angular/core';
import { WidgetContext } from '@home/models/widget-component.models';
import { ALARMS } from './constants/alarms';
import { IAlarm } from './interfaces/alarm.interface';


@Component({
  selector: 'water-meter-alarm',
  templateUrl: './wma.component.html',
  styleUrls: ['./wma.component.scss'],
})
export class WaterMeterAlarm implements OnInit {
  data:string[];
  alarmCreatedAt: string;
  createdDate: string;
  alarms: IAlarm[];
  @Input() ctx: WidgetContext;

  constructor() { }

  ngOnInit() {
    this.initializeData();
    this.ctx.defaultSubscription.callbacks.onDataUpdated = () => {
      this.data  = JSON.parse(this.ctx.defaultSubscription.data[0].data[0][1]);
      this.createdDate = new Date(this.ctx.defaultSubscription.data[0].data[0][0]).toLocaleDateString();
      this.alarmCreatedAt = new Date(this.ctx.defaultSubscription.data[0].data[0][0]).toLocaleTimeString() + '\n' + this.createdDate;
    } 
  
  }

  initializeData() {
    if(!this.ctx.defaultSubscription.data[0].data[0][1]) {
      this.data = [];
      return;
    }
    this.data  = JSON.parse(this.ctx.defaultSubscription.data[0].data[0][1]);
    this.createdDate = new Date(this.ctx.defaultSubscription.data[0].data[0][0]).toLocaleDateString();
    this.alarmCreatedAt = new Date(this.ctx.defaultSubscription.data[0].data[0][0]).toLocaleTimeString() + '\n' + this.createdDate;
    this.alarms = this.data.map((alarm) => {
      return ALARMS[alarm];
    });
  }


}
