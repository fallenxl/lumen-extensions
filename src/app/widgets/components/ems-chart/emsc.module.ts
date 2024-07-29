///
/// Copyright © 2023 ThingsBoard, Inc.
///

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/public-api';
import { EMSChartComponent } from './emsc.component';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';

@NgModule({
  declarations: [
    EMSChartComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ButtonModule,
    AccordionModule
  ],
  exports: [
    EMSChartComponent
  ]
})
export class EMSChartModule {
}
