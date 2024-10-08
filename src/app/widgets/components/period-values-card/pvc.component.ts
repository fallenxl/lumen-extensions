import { Component, Input, OnInit } from '@angular/core';
import { WidgetContext } from '@home/models/widget-component.models';
import { debounceTime, forkJoin, map, Observable, of, Subject } from 'rxjs';
import { AggregationType, DataKey, DatasourceData, EntityType, JsonSettingsSchema, WidgetSettings } from 'thingsboard/src/app/shared/public-api';
import { intervalSchema } from './schema';
import { addToSchema, initSchema } from '../../utils/schema-utils';

@Component({
  selector: 'period-values-card',
  templateUrl: './pvc.component.html',
  styleUrls: ['./pvc.component.scss'],
})
export class PeriodValuesCard implements OnInit {
  intervals: string[] = [
    "Today so far",
    "This Week so far",
    "This Month so far",
  ];
  comparisonIntervals: string[] = [
    "Yesterday",
    "Last Week",
    "Last Month",
  ];

  currentIndex = 0;
  data = [];
  result: number;
  comparisonResult: number;
  percentageDifference: number;
  keys: DataKey[];
  unit: string;
  function: string;
  aggregationType: AggregationType;
  intervalUpdate: NodeJS.Timer;
  setting: WidgetSettings;
  icon: string;
  useIcon: boolean;
  iconColor: string;
  iconBackgroundColor: string;
  iconSize: number = 40; // Default size for the icon
  fontSize: number = 16; // Default size for the text
  scaleFactor: number = 1; // Default scale factor
  navigationSubject: Subject<string> = new Subject<string>(); // Subject para manejar la navegación
  debounceTimeInMs: number = 500;
  @Input() ctx: WidgetContext;

  constructor() { }

  ngOnInit() {
    // settings contain {title:string, interval:string, fixedInterval:boolean}
    this.setting = this.ctx.widgetConfig.settings;
    this.useIcon = this.setting.useIcon;
    this.icon = this.setting.icon;
    this.iconColor = this.setting.iconColor;
    this.iconBackgroundColor = this.setting.iconBackgroundColor
    this.iconSize = this.setting.iconSize;
    this.ctx.$scope.onResize = this.onResize.bind(this);
  if(this.ctx.datasources[0].type === 'function') {
    return 
  }
    // Set the default interval based on the setting
    const defaultInterval = this.intervals.indexOf(this.setting.interval);
    if (defaultInterval !== -1) {
      this.currentIndex = defaultInterval;
    }

    this.keys = this.ctx.widgetConfig.datasources[0].dataKeys;
    this.unit = this.ctx.widgetConfig.datasources[0].dataKeys[0].units ?? '';
    this.function = this.ctx.widgetConfig.datasources[0].dataKeys[0].postFuncBody;
    this.aggregationType = this.ctx.widgetConfig.datasources[0].dataKeys[0].aggregationType;
    this.navigationSubject.pipe(
      debounceTime(this.debounceTimeInMs)
    ).subscribe((direction: string) => {
      this.performNavigation(direction);
    });
    this.setDatasourcesByType(this.ctx.datasources[0].entityFilter.type).subscribe(() => {
  
      this.updateData();  // Llama a updateData después de que se procesen los datos
    });
    this.intervalUpdate = setInterval(() => {

      this.updateData();
    }, 60000);
  }

  onResize(): void {

  }

  navigate(direction: string): void {
    this.navigationSubject.next(direction); // Emite el evento de navegación
  }

  // Función interna que realiza la navegación sin debounce
  private performNavigation(direction: string): void {
    // Disable navigation if fixedInterval is true
    if (this.setting.fixedInterval) {
      return;
    }

    if (direction === 'next') {
      // Si se llega al último índice, volver al primero
      this.currentIndex = (this.currentIndex + 1) % this.intervals.length;
    } else if (direction === 'prev') {
      // Si se llega al primer índice y se retrocede, ir al último
      this.currentIndex = (this.currentIndex - 1 + this.intervals.length) % this.intervals.length;
    }

    this.updateData(); // Actualiza los datos después de la navegación
  }
  updateData() {
    const interval = this.intervals[this.currentIndex];
    let intervalTs = 3600000;
    let startTsMain: number, endTsMain: number;
    let startTsComparison: number, endTsComparison: number;

    const now = new Date(); // Fecha actual
    const endOfToday = new Date().setHours(23, 59, 59, 999); // Fin de hoy

    switch (interval) {
      case 'Today so far':
        startTsMain = new Date(now.setHours(0, 0, 0, 0)).getTime();
        endTsMain = new Date().getTime(); // Fin de hoy hasta el momento actual

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        startTsComparison = new Date(yesterday.setHours(0, 0, 0, 0)).getTime();
        endTsComparison = new Date(yesterday.setHours(23, 59, 59, 999)).getTime();
        break;

      case 'This Week so far':
        // Primer día de esta semana (Lunes)
        const currentWeekStart = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
        startTsMain = new Date(now.setDate(currentWeekStart)).setHours(0, 0, 0, 0);
        endTsMain = endOfToday;

        const lastWeekStart = currentWeekStart - 7; // Primer día de la semana pasada
        startTsComparison = new Date(now.setDate(lastWeekStart)).setHours(0, 0, 0, 0);
        endTsComparison = new Date(now.setDate(lastWeekStart + 7)).setHours(23, 59, 59, 999);
        intervalTs = 86400000 * 30; // Intervalo de 1 semana
        
        break;

      case 'This Month so far':

        const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).setHours(0, 0, 0, 0);
        startTsMain = firstDayOfThisMonth;
        endTsMain = endOfToday;

        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).setHours(0, 0, 0, 0);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).setHours(23, 59, 59, 999);
        startTsComparison = firstDayOfLastMonth;
        endTsComparison = lastDayOfLastMonth;
        intervalTs = 86400000; // Intervalo de 1 día
        break;

      default:
        startTsMain = new Date().getTime();
        endTsMain = new Date().getTime();
        startTsComparison = new Date().getTime();
        endTsComparison = new Date().getTime();
        break;

    }

    // Obtener datos del intervalo principal (Hoy, Esta semana, Este mes)
    this.getTimeseriesData(this.data, this.keys.map(key => key.name), startTsMain, endTsMain, 'main', intervalTs);

    // Obtener datos del intervalo comparativo (Ayer, Semana pasada, Mes pasado)
    this.getTimeseriesData(this.data, this.keys.map(key => key.name), startTsComparison, endTsComparison, 'comparison', intervalTs);

    this.ctx.detectChanges();
  }

  getTimeseriesData(datasources, keys: string[], startTs: number, endTs: number, type: 'main' | 'comparison', interval?: number) {
    const observables = [];
    datasources.forEach((item) => {
      const observable = this.ctx.attributeService.getEntityTimeseries(
        item, keys, startTs, endTs, 50000, this.aggregationType, interval?? Math.abs(endTs - startTs)
      ).pipe(
        map(data => {
          const total = Object.values(data).flat().reduce((acc, item) => {
            let value = parseFloat(item.value);

            if (!isNaN(value)) {
              return acc + value;
            }
            return acc;
          }, 0);
          return total;
        })
      );
      observables.push(observable);
    });

    forkJoin(observables).subscribe(results => {
      let total = results.reduce((total, current) => total + current, 0);
      if (this.function) {
        total = this.executePostFunction(total);
      }
      if (type === 'main') {
        this.result = total;
      } else {
        this.comparisonResult = total;
      }

      this.calculatePercentageDifference();
      this.ctx.detectChanges();
    });
  }

  calculatePercentageDifference() {
    if (this.result && this.comparisonResult) {
      const difference = this.result - this.comparisonResult;
      this.percentageDifference = (difference / this.comparisonResult) * 100;
    } else {
      this.percentageDifference = 0;
    }
  }

  executePostFunction(value: number): number {
    try {
      const func = new Function('value', this.function);
      return func(value);
    } catch (error) {
      return value; // En caso de error, devuelve el valor original.
    }
  }

  parseNumberWithCommas(x: number | null | undefined): string {
    if (x !== null && x !== undefined && !isNaN(x)) {
      return x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }
    return "0";
  }


  setDatasourcesByType(type: string): Observable<void> {
    switch (type) {
      case 'entityList':
        this.data = this.ctx.datasources[0].entityFilter.entityList?.map(entity => {
          return {
            id: entity,
            entityType: 'DEVICE'
          };
        });
        return of(null); // Devuelve un observable vacío ya que no hay procesamiento adicional en entityList
  
      case 'entityGroup':
        // Devuelve el observable transformado
        return this.ctx.entityService.getEntityGroupEntities(this.ctx.datasources[0].entityFilter.entityGroup, "entityGroup" as EntityType, 100).pipe(
          map(entities => {
            this.data = entities.map(entity => ({
              id: entity.id.id,
              entityType: entity.id.entityType
            }));
            // No olvides retornar algo para completar el Observable
            return null;  // Puedes retornar null o void, ya que no necesitas un valor específico aquí
          })
        );
  
      case 'singleEntity':
        this.data = [this.ctx.datasources[0].entityFilter.singleEntity];
        return of(null); // Devuelve un observable vacío para singleEntity
  
      default:
        return of(null); // En caso de que no se cumpla ninguna condición
    }
  }

  ngOnDestroy() {
    this.ctx.defaultSubscription.unsubscribe();
    clearInterval(this.intervalUpdate);
  }
}
