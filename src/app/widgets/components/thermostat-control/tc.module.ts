///
/// Copyright © 2023 ThingsBoard, Inc.
///

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/public-api';
import { ThermostatControlComponent } from './tc.component';
import { Fan, File, LucideAngularModule, Minus, Plus, Power, Settings, Wifi } from 'lucide-angular';

@NgModule({
  declarations: [
   ThermostatControlComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    LucideAngularModule.pick({Power,Plus,Minus, Fan,Settings, Wifi})
  ],
  exports: [
   ThermostatControlComponent
  ]
})
export class ThermostatControlModule {
}
