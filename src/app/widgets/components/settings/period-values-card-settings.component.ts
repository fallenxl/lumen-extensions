///
/// Copyright © 2016-2024 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component } from '@angular/core';
import { WidgetSettings, WidgetSettingsComponent } from '@shared/public-api';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '@core/public-api';
import { periodValuesCardWidgetDefaultSettings } from '../period-values-card/period-values-card.models';
import { formatValue } from '@core/public-api';

@Component({
  selector: 'period-values-card-widget-settings',
  templateUrl: './period-values-card-settings.component.html',
})
export class PeriodValuesCardWidgetSettingsComponent extends WidgetSettingsComponent {

  periodValuesCardWidgetSettingsForm: UntypedFormGroup;

  valuePreviewFn = this._valuePreviewFn.bind(this);

  constructor(protected store: Store<AppState>,
              private fb: UntypedFormBuilder) {
    super(store);
  }

  protected settingsForm(): UntypedFormGroup {
    return this.periodValuesCardWidgetSettingsForm;
  }

  protected defaultSettings(): WidgetSettings {
    return {...periodValuesCardWidgetDefaultSettings};
  }

  protected onSettingsSet(settings: WidgetSettings) {
    this.periodValuesCardWidgetSettingsForm = this.fb.group({
      autoScale: [settings.autoScale, []],

      showLabel: [settings.showLabel, []],
      label: [settings.label, []],
      labelFont: [settings.labelFont, []],
      labelColor: [settings.labelColor, []],

      showIcon: [settings.showIcon, []],
      iconSize: [settings.iconSize, [Validators.min(0)]],
      iconSizeUnit: [settings.iconSizeUnit, []],
      icon: [settings.icon, []],
      iconColor: [settings.iconColor, []],

      valueFont: [settings.valueFont, []],
      valueColor: [settings.valueColor, []],

      background: [settings.background, []],
      padding: [settings.padding, []]
    });
  }

  protected validatorTriggers(): string[] {
    return ['showLabel', 'showIcon'];
  }

  protected updateValidators(emitEvent: boolean) {
    const showLabel: boolean = this.periodValuesCardWidgetSettingsForm.get('showLabel').value;
    const showIcon: boolean = this.periodValuesCardWidgetSettingsForm.get('showIcon').value;

    if (showLabel) {
      this.periodValuesCardWidgetSettingsForm.get('label').enable();
      this.periodValuesCardWidgetSettingsForm.get('labelFont').enable();
      this.periodValuesCardWidgetSettingsForm.get('labelColor').enable();
    } else {
      this.periodValuesCardWidgetSettingsForm.get('label').disable();
      this.periodValuesCardWidgetSettingsForm.get('labelFont').disable();
      this.periodValuesCardWidgetSettingsForm.get('labelColor').disable();
    }

    if (showIcon) {
      this.periodValuesCardWidgetSettingsForm.get('iconSize').enable();
      this.periodValuesCardWidgetSettingsForm.get('iconSizeUnit').enable();
      this.periodValuesCardWidgetSettingsForm.get('icon').enable();
      this.periodValuesCardWidgetSettingsForm.get('iconColor').enable();
    } else {
      this.periodValuesCardWidgetSettingsForm.get('iconSize').disable();
      this.periodValuesCardWidgetSettingsForm.get('iconSizeUnit').disable();
      this.periodValuesCardWidgetSettingsForm.get('icon').disable();
      this.periodValuesCardWidgetSettingsForm.get('iconColor').disable();
    }
  }

  private _valuePreviewFn(): string {
    const units: string = this.widgetConfig.config.units;
    const decimals: number = this.widgetConfig.config.decimals;
    return formatValue(22, decimals, units, true);
  }
}