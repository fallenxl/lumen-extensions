///
/// Copyright © 2023 ThingsBoard, Inc.
///

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/public-api';
import { PrepaidPlans } from './ppf.component';

@NgModule({
  declarations: [
    PrepaidPlans
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    PrepaidPlans
  ]
})
export class PrepaidPlansModule {
}
