///
/// Copyright © 2023 ThingsBoard, Inc.
///

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/public-api';
import { PeriodValuesCard } from './pvc.component';

@NgModule({
  declarations: [
    PeriodValuesCard
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    PeriodValuesCard
  ]
})
export class PeriodValuesCardModule {
}
