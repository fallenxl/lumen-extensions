///
/// Copyright © 2023 ThingsBoard, Inc.
///

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/public-api';
import { WaterMeterAlarm } from './wma.component';

@NgModule({
  declarations: [
    WaterMeterAlarm
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    WaterMeterAlarm
  ]
})
export class WaterMeterAlarmModule {
}
