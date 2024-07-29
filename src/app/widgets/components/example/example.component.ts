import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { WidgetContext } from '@home/models/widget-component.models';

@Component({
  selector: 'tb-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExampleComponent implements OnInit {

  constructor() { }

  @Input() ctx: WidgetContext;

  actualTemperature: number = 24; // actual temperature, initial value
  setTemperature: number = 22;    // set temperature, initial value
  isOn: boolean = true;

  ngOnInit() {
    // Initialization code if needed
    this.ctx.subscriptionApi.createSubscription
  }

  increaseTemperature() {
    if (this.isOn) {
      this.setTemperature++;
    }
  }

  decreaseTemperature() {
    if (this.isOn) {
      this.setTemperature--;
    }
  }

  togglePower() {
    this.isOn = !this.isOn;
  }
}
