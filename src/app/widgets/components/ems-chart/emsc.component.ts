import { Component, Input, OnDestroy, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { WidgetContext } from '@home/models/widget-component.models';
import { Series } from './interfaces/chart.interfaces';
import { DataField, EntityRelation } from './interfaces/data.interfaces';
import { AggregationType, EntityId, EntityType } from 'thingsboard/src/app/shared/public-api';
import * as am5 from "@amcharts/amcharts5/index";
import * as am5xy from "@amcharts/amcharts5/xy";
import { INTERVALS, RESOLUTIONS } from './constants/timestamps';
import { TimeUnit } from '@amcharts/amcharts5/.internal/core/util/Time';
import { fillData, getTypeChart } from './utils/aggregation';
import * as XLSX from 'xlsx';
// amchart themes
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

import am5themes_Responsive from "@amcharts/amcharts5/themes/Responsive";

import { customColors } from './constants/colors';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';



@Component({
  selector: 'ems-chart',
  templateUrl: './emsc.component.html',
  styleUrls: ['./emsc.component.scss', '../../../../../node_modules/ng-zorro-antd/ng-zorro-antd.min.css'],
  encapsulation: ViewEncapsulation.None
})
export class EMSChartComponent implements OnInit, OnDestroy {
  @Input() ctx: WidgetContext;
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    const date = cellDate.getDate();
    //selected range start date
    if (this.customStartDate) {
      const startDate = new Date(this.customStartDate);
      if (cellDate.toDateString() === startDate.toDateString()) {
        return 'bg-gray-200';
      }
    }

    return '';
  };

  private root: am5.Root | null = null;
  private legendRoot: am5.Root | null = null;
  private destroy$ = new Subject<void>();
  summaryTableType: "summary" | "individual" = "summary";

  summaryData = []
  isConfigChange: boolean = false;

  isExpanded: boolean = true;
  isError: string = '';
  isAlert: string = '';
  series: Series[] = [];
  fields: DataField[] = [];
  dataFields = { system: [], "3 phase": [] };
  entityRelations: EntityRelation[] = [];
  selectedAssets: EntityRelation[] = [];
  assetDevices: { [key: string]: EntityRelation[] } = {};
  phaseTypeSelected: string = "System";
  phaseTypes: string[] = ["System", "3 phase"];
  pendingRequests: number = 0;
  expandedStates: { [id: string]: boolean } = {};
  selectedDeviceIds: EntityRelation[] = [];
  updateSelectedDeviceIds: EntityRelation[] = [];
  toggleFilter: boolean = true;

  graph = null

  expandedSections: { [id: string]: boolean } = {
    devices: true,
    phaseType: true,
    fields: true,
    resolution: true,
  };

  customStartDate: Date
  customEndDate: Date

  fieldsSelected: string[] = [];
  updateFieldsSelected: string[] = [];

  toggleChart: boolean = false;

  resolutions = RESOLUTIONS;


  intervals = INTERVALS;
  intervalSelected = this.intervals.find((interval) => interval.id === 1);
  isUpdated: boolean = false;
  resolutionSelected = this.resolutions.find((resolution) => resolution.id === this.intervalSelected.defaultResolution);

  selectedKeys: {
    name: string,
    keys: string[],
    unit: string,
    agg: AggregationType,
    usePostProcessing: boolean,
    postFuncBody: string,
    chartType: string,
    color?: string
    getTotal?: boolean
  }[] = [];
  updateSelectedKeys = [];

  loadingProgress: number = 0;
  isLoading: boolean = false;

  isEnergySelected: boolean = false;
  intervalModalIsOpen: boolean = false;
  subscriptions;

  constructor() { }

  ngOnInit() {
    this.initialize();
  }

  ngOnDestroy(): void {
    if (this.root) {
      this.root.dispose();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  initialize() {
    this.ctx.datasources.forEach((datasource) => {
      const parentRelation: EntityRelation = {
        to: {
          entityType: datasource.entityType,
          id: datasource.entityId
        },
        toName: datasource.entityName,
        label: datasource.entityName,
        relations: []
      };
      this.entityRelations.push(parentRelation);
      this.getEntityRelations(datasource.entity.id, parentRelation.relations);
    });

    this.ctx.datasources[0].dataKeys.forEach((dataKey) => {
      let keys = dataKey.name?.split(",");
      if (keys.length > 1) {
        this.dataFields['3 phase'].push({
          name: dataKey.label?.split(',')[0],
          keys,
          unit: dataKey.units,
          agg: dataKey.aggregationType ?? 'NONE',
          usePostProcessing: dataKey.usePostProcessing,
          postFuncBody: dataKey.postFuncBody,
          chartType: getTypeChart(dataKey.label),
          color: null,
        });
      } else {
        this.dataFields.system.push({
          name: dataKey.label?.split(',')[0],
          keys,
          unit: dataKey.units,
          agg: dataKey.aggregationType ?? 'NONE',
          usePostProcessing: dataKey.usePostProcessing,
          postFuncBody: dataKey.postFuncBody,
          chartType: getTypeChart(dataKey.label),
          color: dataKey.color,
        });
      }
    });

    this.fields = this.dataFields.system;
    this.selectedKeys = [{
      name: this.dataFields.system[0].name,
      keys: this.dataFields.system[0].keys,
      unit: this.dataFields.system[0].unit,
      agg: this.dataFields.system[0].agg ?? 'NONE',
      usePostProcessing: this.dataFields.system[0].usePostProcessing,
      postFuncBody: this.dataFields.system[0].postFuncBody,
      chartType: this.dataFields.system[0].chartType,
      color: this.dataFields.system[0].color ?? null,
    }]

    if (this.selectedKeys[0].name === 'Energy') {
      this.isEnergySelected = true;
    }

    this.updateSelectedKeys = this.selectedKeys;


  }

  exportData() {
    const workbook = XLSX.utils.book_new(); // Crea un nuevo libro de trabajo
  
    this.summaryData.forEach((item) => {
      // Formatea los datos para la hoja de cálculo
      const data = item.data.map((entry) => {
        const date = new Date(entry.date).toISOString().replace('T', ' ').substring(0, 19); // Formatea la fecha en un formato compatible con Excel
        const valueWithUnit = entry.value !== null ? `${entry.value}` : 'N/A'; // Concatenar valor con unidad o 'N/A' si es null
        return {
          Date: date,
          Value: valueWithUnit,
        };
      });
  
      // Calcular el promedio y el total (si el field es 'Enegy')
      const values = item.data
        .filter((entry) => entry.value !== null)
        .map((entry) => entry.value);
  
      const average = values.length > 0 ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2) : 0;
      const total = item.field === 'Enegy' ? values.reduce((sum, val) => sum + val, 0).toFixed(2) : null;
  
      // Agregar el promedio al final
      data.push({ Date: 'Average', Value: `${average} ${item.unit}` });
  
      // Agregar el total al final (si aplica)
      if (total !== null) {
        data.push({ Date: 'Total', Value: `${total} ${item.unit}` });
      }
  
      // Crear la hoja de cálculo para este ítem
      const worksheet = XLSX.utils.json_to_sheet(data);
  
      // Añadir estilo de colores a los encabezados
      const range = XLSX.utils.decode_range(worksheet['!ref']); 
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cell_ref]) continue;
        worksheet[cell_ref].s = {
          fill: { fgColor: { rgb: "FFFF00" } }, // Color de fondo amarillo
          font: { bold: true }, // Texto en negrita
        };
      }
  
      // Formatear tamaño de las celdas de fecha para que sean más grandes
      const colWidths = [
        { wch: 20 }, // Ancho para la columna de fecha
        { wch: 15 }  // Ancho para la columna de valores
      ];
  
      worksheet['!cols'] = colWidths;
  
      // Agregar la hoja al libro de trabajo
      XLSX.utils.book_append_sheet(workbook, worksheet, item.name);
    });
  
    // Generar el archivo Excel
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
    // Crear un Blob para descargar el archivo
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
  
    // Crear un enlace para la descarga
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems-chart-data-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
  
    // Liberar la URL
    window.URL.revokeObjectURL(url);
  }

  toggle(item: EntityRelation) {
    item.expanded = !item.expanded;
  }

  toggleIntervalModal() {
    this.intervalModalIsOpen = !this.intervalModalIsOpen;
  }

  toggleSelection(event: Event, device: EntityRelation) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedDeviceIds.push(device);
    } else {
      const index = this.selectedDeviceIds.indexOf(device);
      if (index > -1) {
        this.selectedDeviceIds.splice(index, 1);
      }
    }

  }

  selectAsset(asset: EntityRelation, event: MouseEvent) {
    if (!this.selectedAssets.includes(asset)) {
      this.selectedAssets.push(asset);
      this.assetDevices[asset.to.id] = asset.relations;
      // add default devices to selectedDeviceIds
      const defaultDevices = asset.relations.filter((relation) => relation.isDefault);
      this.selectedDeviceIds = this.selectedDeviceIds.concat(defaultDevices);

      asset.expanded = true;
      if (defaultDevices.length > 0) {
        this.updateChart();
      }
    } else {
      this.selectedAssets = this.selectedAssets.filter((selectedAsset) => selectedAsset !== asset);

    }
    console.log('selectedAssets', this.selectedAssets)
  }


  changeResolution(resolution: any) {
    this.resolutionSelected = resolution;
  }

  changePhaseType(type: string) {
    this.phaseTypeSelected = type;
    this.fields = this.dataFields[type.toLowerCase()];
    this.selectedKeys = [{
      name: this.dataFields[type.toLowerCase()][0].name,
      keys: this.dataFields[type.toLowerCase()][0].keys,
      unit: this.dataFields[type.toLowerCase()][0].unit,
      agg: this.dataFields[type.toLowerCase()][0].agg ?? 'NONE',
      usePostProcessing: this.dataFields[type.toLowerCase()][0].usePostProcessing,
      postFuncBody: this.dataFields[type.toLowerCase()][0].postFuncBody,
      chartType: this.dataFields[type.toLowerCase()][0].chartType,
      color: this.dataFields[type.toLowerCase()][0].color ?? null,
    }]
  }

  toggleExpand(asset: EntityRelation) {
    this.expandedStates[asset.to.id] = !this.expandedStates[asset.to.id];

    if (asset.expanded) {
      asset.expanded = false;
      this.selectedDeviceIds = [];
    }
  }

  toggleExpandedSection(id: string) {
    this.expandedSections[id] = !this.expandedSections[id];
  }

  getEntityRelations(entityId: EntityId, parentRelation: EntityRelation[] = this.entityRelations) {
    this.subscriptions = this.ctx.entityRelationService.findInfoByFrom(entityId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((entityRelations) => {
        if (entityRelations.length > 0) {
          entityRelations.forEach((relation) => {
            const name = relation.toName.split(" ");
            const fromEntityType = relation.from.entityType;
            if (name.includes('EMS') || fromEntityType !== 'CUSTOMER') {
              this.ctx.entityService.getEntity(relation.to.entityType as EntityType, relation.to.id)
                .pipe(
                  takeUntil(this.destroy$)
                )
                .subscribe((device) => {
                  let newRelation: EntityRelation = {
                    to: {
                      entityType: relation.to.entityType,
                      id: relation.to.id
                    },
                    toName: name.filter((item) => item !== 'EMS').join(" "),
                    label: device.label?.split(",")[0],
                    isDefault: device.label?.split(",")[1] === 'default' ? true : false,
                    relations: [],
                    expanded: false
                  };
                  parentRelation.push(newRelation);
                  this.getEntityRelations(relation.to, newRelation.relations);
                })
            }
          });
        }

      })
  }

  isSelected(id: EntityId) {
    return this.selectedDeviceIds.find((device) => device.to.id === id.id);
  }

  toggleSidebar(set?: string) {
    if (set === 'close') {
      this.isExpanded = false;
    } else {

      this.isExpanded = !this.isExpanded;
    }
  }


  ChartXY(data: any, summaryData = this.summaryData) {

    try {
      this.root = am5.Root.new("chartdiv");
      this.legendRoot = am5.Root.new("legenddiv");

      am5.ready(() => {
        try {
          var root = this.root;
          let tempSummaryData = [];
          var legendRoot = this.legendRoot;
          legendRoot.setThemes([
            am5themes_Animated.new(legendRoot),
            am5xy.DefaultTheme.new(legendRoot)
          ]);
          var chart = root.container.children.push(
            am5xy.XYChart.new(root, {
              panY: false,
              wheelY: "zoomX",
              layout: root.verticalLayout,

            })
          );

          chart.get('colors').set("colors", customColors)
          var xAxis = chart.xAxes.push(
            am5xy.GaplessDateAxis.new(root, {

              baseInterval: { timeUnit: this.resolutionSelected.agg as TimeUnit, count: 1 },
              minZoomCount: this.intervalSelected.minZoom,
              renderer: am5xy.AxisRendererX.new(root, {
                // minGridDistance: this.intervalSelected.minGrid,
                strokeOpacity: 1,
                opacity: 1,
              }),
              tooltip: am5.Tooltip.new(root, {
              })
            })
          );


          xAxis.get("renderer").ticks.template.setAll({
            inside: false,
            visible: true,

          });


          var startEndChangeTimeout;
          xAxis.on("end", handleStartEndChange);
          xAxis.on("start", handleStartEndChange);

          function handleStartEndChange() {

            clearTimeout(startEndChangeTimeout);

            startEndChangeTimeout = setTimeout(function () {
              zoomEnded();
            }, 200);
          }

          const updateChart = this.updateSummaryTable.bind(this);
          function zoomEnded() {
            summaryData = tempSummaryData.map((item) => {
              let data = item.data.filter((item) => new Date(item.date).getTime() >= new Date(xAxis.getPrivate("selectionMin")).getTime() && new Date(item.date).getTime() <= new Date(xAxis.getPrivate("selectionMax")).getTime());
              return { ...item, intervalData: data }
            });


            updateChart(summaryData);
          }
          xAxis.get("dateFormats")["day"] = "MM/dd";
          xAxis.get("periodChangeDateFormats")["day"] = "MMMM";


          var scrollbarX = am5xy.XYChartScrollbar.new(root, {
            orientation: "horizontal",
            height: 30
          });
          var sbxAxis = scrollbarX.chart.xAxes.push(
            am5xy.DateAxis.new(root, {

              baseInterval: { timeUnit: this.resolutionSelected.agg as TimeUnit, count: 1 },
              renderer: am5xy.AxisRendererX.new(root, {
                opposite: false,
                strokeOpacity: 0,
                opacity: 0,
              })
            })
          );

          sbxAxis.hide();

          var sbyAxis = scrollbarX.chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
              renderer: am5xy.AxisRendererY.new(root, {})
            })
          );


          let yAxisUnit = [];
          let phaseSelected = this.phaseTypeSelected;
          let currentColor;
          // Encontrar el número negativo más alto
          const findLowestNegative = (arr) => {
            return arr.reduce((lowest, item) => {
              if (item.value < 0 && (lowest === null || item.value < lowest)) {
                return item.value;
              }
              return lowest;
            }, null);
          };

          // Encontrar el valor negativo más bajo en todos los conjuntos de datos
          let overallLowestNegative = null;

          data.forEach(dataset => {
            // Encontrar las keys que contienen datos
            const dataKey = Object.keys(dataset).find(key => Array.isArray(dataset[key]));

            if (dataKey) {
              const lowestNegative = findLowestNegative(dataset[dataKey]);
              if (lowestNegative !== null && (overallLowestNegative === null || lowestNegative < overallLowestNegative)) {
                overallLowestNegative = lowestNegative;
              }
            }
          });
          const syncAxis = this.isEnergySelected
          // Configurar el eje Y basado en el valor negativo más bajo encontrado
          const yAxisMin = overallLowestNegative !== null ? overallLowestNegative * 2 : 0;
          function createSeries(name, field, data, t, unit, key) {
            try {
              if (!unit) {
                unit = '';
              }
              // Verificar si el eje para la unidad ya existe
              let yAxisIndex = yAxisUnit.indexOf(unit);
              let yAxis;

              if (yAxisIndex === -1) {
                // Si no existe, crear uno nuevo
                yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {

                  numberFormat: unit === '%' ? '# .0%' : '##.## ' + unit,
                  strictMinMax: false,
                  renderer: am5xy.AxisRendererY.new(root, {
                    opposite: t === 'line',
                    strokeOpacity: 1,
                    opacity: 1,
                    stroke: am5.color("rgba(0,0,0,0.1)"),
                  }),
                }))
                yAxisUnit.push(unit);
              } else {
                // Si ya existe, reutilizar el existente
                yAxis = chart.yAxes.getIndex(yAxisIndex);
              }



              var tooltip = am5.Tooltip.new(root, {
                getFillFromSprite: false,
                getStrokeFromSprite: true,
                autoTextColor: false,
                getLabelFillFromSprite: true,
                labelText: phaseSelected === "System" ? "[bold]{name}[/]:[thin] {valueY}" + unit + "[/]" : "[bold]{name}: [thin] {valueY}" + unit + "[/]",
                draggable: true,
                animationDuration: 100,
                pointerOrientation: "horizontal",
                animationEasing: am5.ease.linear,

              });

              tooltip.get("background").setAll({
                fill: am5.color(0xffffff),
                fillOpacity: 0.8
              });
              // sincronizar el 

              if (syncAxis) {
                yAxis.set("syncWithAxis", chart.yAxes.getIndex(0));
              }


              if (t.toLowerCase() === 'line') {

                yAxis.set('min', yAxisMin);
                var series = chart.series.push(
                  am5xy.LineSeries.new(root, {
                    name: phaseSelected === "System" ? name : name + '-' + key.slice(0, 2),
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: field,
                    valueXField: "date",
                    layer: 10,
                    tooltip: tooltip,
                  })
                );



                let sbSeries = scrollbarX.chart.series.push(
                  am5xy.LineSeries.new(root, {
                    xAxis: sbxAxis,
                    yAxis: sbyAxis,
                    valueYField: field,
                    valueXField: "date",

                  })
                );


                sbSeries.data.setAll(data);
                yAxis.get("renderer").labels.template.set("text", "{value} " + unit);
                yAxis.get("renderer").labels.template.set("fontSize", 10);
                // yAxis.get("renderer").labels.template.set("fill", 'rgba(0,0,0,0.8)');
                yAxis.get("renderer").grid.template.set("forceHidden", true);
                yAxis.get("renderer").grid.template.set("strokeOpacity", 0.07);
                yAxis.get("renderer").ticks.template.setAll({
                  inside: false,
                  visible: true,
                  fill: am5.color("rgba(0,0,0,0.5)"),

                })


                series.strokes.template.set("strokeWidth", 1.5);
                series.data.setAll(data);
                currentColor = series.get("fill").toCSS();
              } else if (t.toLowerCase() === 'bar') {
                yAxis.set('min', 0);
                var barSeries = chart.series.push(
                  am5xy.ColumnSeries.new(root, {
                    name: phaseSelected === "System" ? name : name + '-' + key.slice(0, 2),
                    xAxis: xAxis,
                    stacked: true,
                    yAxis: yAxis,
                    valueYField: "value",
                    valueXField: "date",
                    tooltip: tooltip
                  })
                );

                let sbSeries = scrollbarX.chart.series.push(
                  am5xy.ColumnSeries.new(root, {
                    xAxis: sbxAxis,
                    yAxis: sbyAxis,
                    valueYField: "value",
                    valueXField: "date",
                    stacked: true,
                  })
                );



                sbSeries.data.setAll(data);


                yAxis.get("renderer").grid.template.set("forceHidden", true);
                yAxis.get("renderer").labels.template.set("text", "{value} " + unit);
                yAxis.get("renderer").labels.template.set("fontSize", 10);
                yAxis.get("renderer").ticks.template.setAll({
                  inside: false,
                  visible: true,

                })
                console.log('data', data)
                barSeries.data.setAll(data);
                currentColor = barSeries.get("fill").toCSS();
              }
            } catch (error) {
              console.log(error)
              this.isAlert = 'Error fetching data, please try again';
              this.toggleIsLoading(false);

            }

          }





          let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
            behavior: "zoomX",
            xAxis: xAxis,
          }));

          cursor.lineY.set("visible", false);

          chart.set("scrollbarX", scrollbarX);

          const legend = chart.children.push(am5.Legend.new(root, {
            paddingTop: 20,
          }));


          data.forEach((key) => {

            Object.keys(key).forEach((item) => {
              if (item === 'chartType' || item === 'unit' || item === 'name' || item === 'color' || item === 'getTotal') return
              let parsedData = key[item]?.map((item) => {
                return {
                  date: new Date(item.ts).getTime(),
                  value: Math.round(parseFloat(item.value) * 100) / 100
                }
              })

              console.log(item)

              if (this.resolutionSelected.name === '1 minute') {
                parsedData = parsedData.reverse()
              } else if (this.resolutionSelected.name === '2 minutes') {
                parsedData = parsedData.reverse()
              }
              if (this.intervalSelected.fillData) {
                parsedData = fillData(parsedData, this.intervalSelected.startDate, this.intervalSelected.endDate, this.resolutionSelected.ts)
              }
              let keyLabel = key.name?.split(" ")

              createSeries(key.name, 'value', parsedData, key.chartType, key.unit, item);
              tempSummaryData.push({ name: key.name, data: parsedData, key: item, field: keyLabel[keyLabel.length - 1], intervalData: parsedData, unit: key.unit, color: currentColor, getTotal: key.chartType === 'bar' ? true : false })
            });

          });

          try {
            // let legend = legendRoot.container.children.push(am5.Legend.new(legendRoot, {
            //   layout: legendRoot.gridLayout,
            // }))

            legend.data.setAll(chart.series.values);
            legend.events.on("boundschanged", function () {
              document.getElementById("legenddiv").style.height = legend.height() + "px"
            });
          }
          catch (error) {
            console.log(error)
          }
          summaryData = tempSummaryData;
          this.updateSummaryTable(summaryData);
          this.graph = root;
          this.legendRoot = legendRoot;

          this.toggleIsLoading(false);
        } catch (error) {
          console.log(error)
          this.isAlert = 'Error fetching data, please try again';
          this.toggleIsLoading(false);
        }



      });

      this.summaryData = summaryData;
    } catch (error) {
      this.isAlert = 'Error fetching data, please try again';
      this.toggleIsLoading(false);
    }
  }

  addDeviceId(device: EntityRelation) {
    this.selectedDeviceIds.push(device);
  }

  toggleIsLoading(value: boolean) {
    this.isLoading = value;
    this.ctx.detectChanges();

  }

  updateChart() {
    try {
      if (this.selectedKeys.length === 0) {
        this.isError = 'No field selected';
        return;
      }
      if (this.selectedDeviceIds.length === 0) {
        this.isError = 'No device selected';
        return;
      }
      this.isAlert = '';
      this.toggleSidebar('close');
      this.isError = '';
      this.isUpdated = true;
      const totalRequests = this.selectedDeviceIds.length * this.selectedKeys.length;
      let completedRequests = 0;
      const telemetryData = []; // Reinicia telemetryData antes de comenzar
      this.toggleIsLoading(true);
      if (this.isEnergySelected && (this.resolutionSelected.name === '1 minute' || this.resolutionSelected.name === '2 minutes')) {
        if (this.selectedKeys.some((key) => key.name === 'Energy')) {
          this.isAlert = 'Energy field is not available for 1 minute and 2 minutes resolution';
          this.resolutionSelected = this.resolutions.find((resolution) => resolution.id === this.intervalSelected.condition);
          const radios = document.getElementsByName('resolution') as NodeListOf<HTMLInputElement>;
          const findIndex = this.resolutions.findIndex((resolution) => resolution.id === this.intervalSelected.condition);
          // disabled options below the default resolution
          for (let i = 0; i < radios.length; i++) {
            if (i < findIndex) {
              radios[i].disabled = true;
            } else {
              radios[i].disabled = false;
            }
          }

        }
      } else {

        const radios = document.getElementsByName('resolution') as NodeListOf<HTMLInputElement>;
        const findIndex = this.resolutions.findIndex((resolution) => resolution.id === this.intervalSelected.minResolution);
        // disabled options below the default resolution
        for (let i = 0; i < radios.length; i++) {
          if (i < findIndex) {
            radios[i].disabled = true;
          } else {
            radios[i].disabled = false;
          }
        }

      }

      this.selectedDeviceIds.forEach((device, index) => {
        this.selectedKeys.forEach((key) => {
          this.ctx.attributeService.getEntityTimeseries(device.to as EntityId, key.keys, this.intervalSelected.startDate, this.intervalSelected.endDate, 50000, this.resolutionSelected.aggType as AggregationType ?? key.agg as AggregationType, this.resolutionSelected.ts)
            .pipe(
              takeUntil(this.destroy$)
            )
            .subscribe((telemetry) => {
              if (key.usePostProcessing) {
                Object.keys(telemetry).forEach((item) => {
                  telemetry[item] = telemetry[item].map((data) => {

                    const postProcessing = new Function('value', key.postFuncBody);
                    return {
                      ts: data.ts,
                      value: parseFloat(postProcessing(data.value)).toFixed(2)
                    };
                  });
                });
              }
              telemetryData.push({ ...telemetry, chartType: key.chartType, unit: key.unit, name: device.label + ' ' + key.name, color: key.color })
              completedRequests++;
              // Verifica si todas las solicitudes se han completado
              if (completedRequests === totalRequests) {

                if (this.graph) {
                  this.graph.dispose();
                  this.root.dispose();
                  this.legendRoot.dispose();
                }


                this.ChartXY(telemetryData, this.summaryData);

                this.toggleIsLoading(false);
              }
            })
        })
      });
    } catch (error) {
      console.log(error)
      this.isAlert = 'Error fetching data, please try again';
      this.toggleIsLoading(false);
    }
  }

  toggleField(field: any) {

    if (this.selectedKeys.find((selectedField) => selectedField.name === field.name)) {
      this.selectedKeys = this.selectedKeys.filter((selectedField) => selectedField.name !== field.name);
    } else {
      this.selectedKeys.push(field);
    }
    if (this.selectedKeys.find((selectedField) => selectedField.name === 'Energy')) {
      this.isEnergySelected = true;
    } else {
      this.isEnergySelected = false;
    }
  }


  setClearAll() {
    this.selectedDeviceIds = [];
    this.isConfigChange = true
  }

  /**
   * Sets the selectedKeys array to an empty array and sets the isConfigChange flag to true.
   */
  setClearAllFields(): void {
    this.selectedKeys = [];
    this.isConfigChange = true
  }


  // toggle 
  toggleFilterSidebar(): void {
    this.toggleFilter = !this.toggleFilter;
  }




  /**
   * Updates the interval and resolution selection for the chart.
   * Disables options below the default resolution.
   * Disposes the graph, root, and legendRoot if they exist.
   * Updates the chart if there are selected device IDs.
   */
  nextInterval(): void {
    this.intervals = INTERVALS;
    const currentIndex = this.intervals.indexOf(this.intervalSelected);
    const nextIndex = (currentIndex + 1) % this.intervals.length;
    this.intervalSelected = this.intervals[nextIndex];
    this.resolutionSelected = this.resolutions.find((resolution) => resolution.id === this.intervalSelected.defaultResolution);
    const radios = document.getElementsByName('resolution') as NodeListOf<HTMLInputElement>;
    const findIndex = this.resolutions.findIndex((resolution) => resolution.id === this.intervalSelected.minResolution);
    // disabled options below the default resolution
    for (let i = 0; i < radios.length; i++) {
      if (i < findIndex) {
        radios[i].disabled = true;
      } else {
        radios[i].disabled = false;
      }
    }

    if (this.graph) {
      this.graph.dispose();
      this.root.dispose();
      this.legendRoot.dispose();
    }
    if (this.selectedDeviceIds.length > 0) {
      this.updateChart();
    }


  }

  /**
   * Moves to the previous interval in the chart.
   * 
   * This function updates the intervalSelected property to the previous interval in the intervals array.
   * It also updates the resolutionSelected property based on the defaultResolution of the new interval.
   * It disables options below the default resolution in the UI.
   * If there are selectedDeviceIds, it updates the chart accordingly.
   * If there is an existing graph, it disposes it along with its associated elements.
   */
  prevInterval(): void {
    this.intervals = INTERVALS;
    const currentIndex = this.intervals.indexOf(this.intervalSelected);
    const prevIndex = (currentIndex - 1 + this.intervals.length) % this.intervals.length;

    this.intervalSelected = this.intervals[prevIndex];

    this.resolutionSelected = this.resolutions.find((resolution) => resolution.id === this.intervalSelected.defaultResolution);
    const radios = document.getElementsByName('resolution') as NodeListOf<HTMLInputElement>;
    const findIndex = this.resolutions.findIndex((resolution) => resolution.id === this.intervalSelected.minResolution);
    // disabled options below the default resolution
    for (let i = 0; i < radios.length; i++) {
      if (i < findIndex) {
        radios[i].disabled = true;
      } else {
        radios[i].disabled = false;
      }
    }

    if (this.graph) {
      this.graph.dispose();
      this.root.dispose();
      this.legendRoot.dispose();
    }
    if (this.selectedDeviceIds.length > 0) {
      this.updateChart();
    }

  }


  /**
   * Checks if a field is selected.
   * 
   * @param field - The field to check.
   * @returns A boolean indicating whether the field is selected or not.
   */
  isSelectedField({ field }: { field: { name: string; keys: string[]; unit: string; agg: AggregationType; }; }): boolean {
    return this.selectedKeys.some((selectedField) => selectedField.name === field.name);

  }


  /**
   * Sets the custom date for the specified type.
   * 
   * @param e - The event object containing the target value.
   * @param type - The type of the custom date ("start" or "end").
   */
  setCustomDate({ e, type }: { e:  { value: any; }; type: "start" | "end"; }): void {
    const { value } = e;
    if (type === 'start') {
      this.customStartDate = value;
    } else {
      this.customEndDate = value;
      this.intervalSelected = this.intervals.find((interval) => interval.id === 12);
      // agregarle un dia a la fecha final
      const startDate = new Date(new Date(this.customStartDate).setHours(0, 0, 0, 0));
      const endDate = new Date(new Date(this.customEndDate).setHours(23, 59, 59, 999));
      this.intervalSelected.startDate = startDate.setDate(startDate.getDate());
      this.intervalSelected.endDate = endDate.setDate(endDate.getDate())
      this.intervalSelected.minResolution = this.intervalSelected.getMinResolution();
      this.intervalSelected.defaultResolution = this.intervalSelected.getDefaultResolution();
      this.intervalSelected.agg = this.intervalSelected.getAgg();
      this.intervalModalIsOpen = false;
      this.selectInterval(this.intervalSelected);
    }
  }

  selectInterval(interval: any) {
    console.log('interval', interval)
    this.intervalSelected = interval;
    this.resolutionSelected = this.resolutions.find((resolution) => resolution.id === this.intervalSelected.defaultResolution);
    const radios = document.getElementsByName('resolution') as NodeListOf<HTMLInputElement>;
    const findIndex = this.resolutions.findIndex((resolution) => resolution.id === this.intervalSelected.minResolution);
    // disabled options below the default resolution
    if (this.intervalSelected.name !== 'Custom') {

      this.customStartDate = null;
      this.customEndDate = null;

      for (let i = 0; i < radios.length; i++) {
        if (i < findIndex) {
          radios[i].disabled = true;
        } else {
          radios[i].disabled = false;
        }
      }


      if (this.graph) {
        this.graph.dispose();
        this.root.dispose();
        this.legendRoot.dispose();
      }
      this.intervalModalIsOpen = false;
      if (this.selectedDeviceIds.length > 0) {

        this.updateChart();
      }
    } else {
      if (this.customStartDate && this.customEndDate) {
        for (let i = 0; i < radios.length; i++) {
          if (i < findIndex) {
            radios[i].disabled = true;
          } else {
            radios[i].disabled = false;
          }
        }


        if (this.graph) {
          this.graph.dispose();
          this.root.dispose();
          this.legendRoot.dispose();
        }
        this.intervalModalIsOpen = false;
        if (this.selectedDeviceIds.length > 0) {

          this.updateChart();
        }
      } else {
        this.isAlert = 'Please select a start and end date';
      }
    }
  }
  groupDataByInterval(data, interval, type = 'NONE') {
    const groupedData = data.reduce((acc, item) => {
      const roundedTime = Math.floor(item.date / interval) * interval;
      if (!acc[roundedTime]) {
        acc[roundedTime] = { date: roundedTime, value: 0 };
      }
      acc[roundedTime].value += item.value;
      return acc;
    }, {});

    if (type === 'SUM') {
      let cumulativeValue = 0;
      return Object.values(groupedData).map((item: { date: number, value: number }) => {
        cumulativeValue += item.value
        return { ...item, value: cumulativeValue };
      });

    }

    return Object.values(groupedData);
  };

  updateSummaryTable(data) {
    const summaryTable = document.getElementById('summary-grid');
    summaryTable.innerHTML = `  <div class="summary-grid-header">METER</div>
    <div class="summary-grid-header">TOTAL</div>
    <div class="summary-grid-header">AVERAGE</div>
    <div class="summary-grid-header">MAX</div>
    <div class="summary-grid-header">MIN</div>`;
    if (this.summaryTableType === 'individual') {
      data.sort((a, b) => a.name.localeCompare(b.name)).forEach((item) => {
        let total = item.intervalData.reduce((acc, item) => acc + item.value, 0).toFixed(2);
        let avg = (total / item.intervalData.length).toFixed(2);
        let max = Math.max(...item.intervalData.map((item) => item.value)).toFixed(2);
        let min = Math.min(...item.intervalData.map((item) => item.value)).toFixed(2);
        let unit = item.unit ?? '';
        summaryTable.innerHTML += `
          <div class="summary-grid-item border-l-4" style="border-left-color:${item.color}">
            ${item.name}
          </div>
          ${item.getTotal ? `<div class="summary-grid-item">${total} ${unit}</div>` : `<div class="summary-grid-item"></div>`}
          <div class="summary-grid-item">${avg ?? 0} ${unit}</div>
          <div class="summary-grid-item">${max ?? 0} ${unit}</div>
          <div class="summary-grid-item">${min ?? 0} ${unit}</div>`;
      });
    } else if (this.summaryTableType === 'summary') {
      // Agrupar los datos por el campo deseado (por ejemplo, 'field')
      const groupedData = data.reduce((acc, item) => {
        if (!acc[item.field]) {
          acc[item.field] = [];
        }
        acc[item.field].push(item);
        return acc;
      }, {});

      // Procesar cada grupo
      Object.keys(groupedData).forEach((field) => {
        const items = groupedData[field];

        // Calcular el total, avg, max, min para cada grupo
        let total = items.flatMap(item => item.intervalData).reduce((acc, item) => acc + item.value, 0).toFixed(2);
        let count = items.flatMap(item => item.intervalData).length;
        let avg = (total / count).toFixed(2);
        let max = Math.max(...items.flatMap(item => item.intervalData.map(data => data.value))).toFixed(2);
        let min = Math.min(...items.flatMap(item => item.intervalData.map(data => data.value))).toFixed(2);
        // Agregar el resultado al HTML
        summaryTable.innerHTML += `
          <div class="summary-grid-item border-l-4" style="border-left-color:rgba(255,255,255,0.4);">
            ${field}
          </div>
        ${items.find(item => item.getTotal) ? `<div class="summary-grid-item">${total} ${items.find(item => item.field === field).unit ?? ""}</div>` : `<div class="summary-grid-item"></div>`}
          <div class="summary-grid-item">${avg ?? 0} ${items.find(item => item.field === field).unit ?? ""}</div>
          <div class="summary-grid-item">${max ?? 0} ${items.find(item => item.field === field).unit ?? ""}</div>
          <div class="summary-grid-item">${min ?? 0} ${items.find(item => item.field === field).unit ?? ""}</div>`;
      });
    }

    // this.ctx.detectChanges();



  }

  setSummaryTableType(type: "summary" | "individual") {
    this.summaryTableType = type;
    this.updateSummaryTable(this.summaryData);
  }

}


