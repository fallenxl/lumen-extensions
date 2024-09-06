///
/// Copyright © 2023 ThingsBoard, Inc.
///

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/public-api';
import { LightControlComponent } from './lc.component';
import { Fan, File, Lightbulb, LightbulbOff, LucideAngularModule, Minus, Plus, Power, Settings, Wifi } from 'lucide-angular';

@NgModule({
  declarations: [
   LightControlComponent
  ],
  imports: [
    CommonModule,
    SharedModule,

    LucideAngularModule.pick({Lightbulb,LightbulbOff})
  ],
  exports: [
   LightControlComponent
  ]
})
export class LightControlModule {
}
