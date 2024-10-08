import { NgModule, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/public-api';
import { PeriodValuesCardWidgetSettingsComponent } from './period-values-card-settings.component';


@NgModule({
  declarations: [
    PeriodValuesCardWidgetSettingsComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    PeriodValuesCardWidgetSettingsComponent
  ]
})


export class WidgetSettingsModule{}

