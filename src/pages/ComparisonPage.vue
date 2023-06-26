<template>
  <q-page>
    <div class="full">
      <div class="header">
        <div class="text-h6 fontOswald">{{projectName}}</div>
        <dynamsoft-button style="margin-left:15px;" secondary label="Go Back" @click="goBack"/>
      </div>
      <div class="container">
        <div class="controls">
          <div style="margin-right: 5px;">
            Engines:
          </div>
          <div class="engines options">
            <q-checkbox color="orange" v-model="engine.enabled" :label="engine.displayName" v-for="engine in engines" v-bind:key="engine.displayName"/>
          </div>
          <div style="margin-right: 5px;" v-if="categories.length>0">
            Categories:
          </div>
          <div class="categories options" v-if="categories.length>0">
            <q-checkbox color="orange" v-model="category.enabled" :label="category.displayName" v-for="category in categories" v-bind:key="category.displayName"/>
          </div>
          <dynamsoft-button label="Get comparison statistics" v-on:click="getStatistics()" />
        </div>
        <div>
          <q-tabs
            v-model="selectedTab"
            dense
            class="text-grey"
            active-color="orange"
            indicator-color="orange"
            align="justify"
            narrow-indicator
          >
            <q-tab name="general" label="General" />
            <q-tab name="category" label="Category" />
          </q-tabs>
          <q-separator />
          <q-tab-panels v-model="selectedTab" animated>
            <q-tab-panel name="general">
              <div class="statistics-in-general">
                <div class="charts" style="padding-top:1em;" v-if="Object.keys(readingRateOption).length > 0">
                  <div class="chart-container">
                    <v-chart class="chart" :option="readingRateOption" />
                  </div>
                  <div class="chart-container">
                    <v-chart class="chart" :option="precisionOption" />
                  </div>
                  <div class="chart-container">
                    <v-chart class="chart" :option="averageTimeOption" />
                  </div>
                </div>
                <div v-if="tableRows.length > 0">
                  <q-markup-table>
                    <thead>
                      <tr style="background:#eeeeee;">
                        <th class="text-left">No.</th>
                        <th class="text-left">Filename</th>
                        <th class="text-left" v-for="engine in getSelectedEngines()" v-bind:key="engine">{{ engine }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in tableRows" v-bind:key="row.number">
                        <td>{{ row.number }}</td>
                        <td><a href="javascript:void();" @click="goToDetailsPage(row.filename)"> {{ row.filename }} </a></td>
                        <td class="text-left" v-for="engine in getSelectedEngines()" v-bind:key="'detected-'+engine">
                          {{ (row.detectedEngines.indexOf(engine) != -1) ? '✓' : '✗' }}
                        </td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="category">
              <div class="statistics-in-categories">
                <div v-if="categories.length>0 && tableInCategories.length>0">
                  <div class="statistics-of-category" v-for="table in tableInCategories" v-bind:key="'table-'+table.metrics">
                    <h3>{{table.displayName}}</h3>
                    <q-markup-table>
                      <thead>
                        <tr style="background:#eeeeee;">
                        <th class="text-left">Category</th>
                          <th class="text-left" v-for="engine in getSelectedEngines()" v-bind:key="engine">{{ engine }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="row in table.rows" v-bind:key="row.category">
                          <td>{{ row.category }}</td>
                          <td :class="'text-left ' + ((row.highlightedIndex === index)?'highlighted':'')" v-for="(value,index) in row.statistics" v-bind:key="'value-'+row.category+'-'+index">
                            {{ value }}
                          </td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                    <dynamsoft-button style="margin-top:10px;" label="Draw charts" v-on:click="drawCharts(table);" />
                  </div>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>        
      </div>
    </div>
    <q-dialog v-model="showCalculatingDialog" persistent transition-show="scale" transition-hide="scale">
      <q-card style="width: 300px">
        <q-card-section>
          <div class="text-h6">Calculating...</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          Please wait for a while.
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showChartsDialog" :maximized="true" transition-show="scale" transition-hide="scale">
      <q-card>
        <q-bar>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>
        <q-card-section class="q-pt-none">
          Select a category:
          <div class="categories options">
            <q-checkbox color="orange" v-model="category.enabled" :label="category.displayName" v-for="category in categoriesForCharts" v-bind:key="'cat-charts-'+category.displayName"/>
          </div>
          <dynamsoft-button label="Draw" v-on:click="drawChartForSelectedCategory()" />
          <q-checkbox style="margin-left:10px;" color="orange" v-model="sorting" label="Sort"/>
          <div v-for="(option,index) in chartOptionsForCategories" v-bind:key="'cat-chart-'+index">
            <v-chart class="chart" :option="option" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { Project } from "src/project";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import localForage from "localforage";
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { PieChart,BarChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent
} from "echarts/components";
import VChart from "vue-echarts";
import { EngineStatistics } from "src/definitions/definitions";
import { calculateEngineStatistics, loadProjectBarcodeReaderConfigs } from "src/utils";
import { useMeta } from "quasar";
import DynamsoftButton from "src/components/DynamsoftButton.vue";
import { BarcodeReaderConfig } from "src/barcodeReader/BarcodeReader";

use([
  SVGRenderer,
  PieChart,
  BarChart,
  GridComponent,
  ToolboxComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent
]);


const readingRateOption = ref({});
const averageTimeOption = ref({});
const precisionOption = ref({});
const chartOptionsForCategories = ref([] as any[]);

const projectName = ref("");
const engines = ref([] as {displayName:string,enabled:boolean}[])
const router = useRouter();
const tableRows = ref([] as tableRow[]);
const tableInCategories = ref([] as {metrics:string,displayName:string,rows:categoryTableRow[]}[]);
const categories = ref([] as {displayName:string,enabled:boolean}[])
const categoriesForCharts = ref([] as {displayName:string,enabled:boolean}[])
const showCalculatingDialog = ref(false);
const showChartsDialog = ref(false);
const selectedTab = ref("general");
const sorting = ref(false);

let configs:BarcodeReaderConfig[] = [];
let project:Project;
let selectedTable:{metrics:string,displayName:string,rows:categoryTableRow[]};

interface tableRow {
  number:number;
  filename:string;
  detectedEngines:string[];
  failedEngines:string[];
}

interface categoryTableRow {
  category:string;
  statistics:number[];
  highlightedIndex:number;
}

interface highlightConfig {
  enable:boolean;
  mode:"max"|"min";
}

onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  configs = await loadProjectBarcodeReaderConfigs(router.currentRoute.value.params.name as string);
  const enginesList = [];
  for (let index = 0; index < configs.length; index++) {
    const config = configs[index];
    const item = {displayName:config.displayName,enabled:true};
    enginesList.push(item);
  }
  engines.value = enginesList;
  useMeta({
    // sets document title
    title: 'Barcode Reading Benchmark - '+ projectName.value + ' - Comparison',
  })
  const savedProjects = await localForage.getItem("projects");
  if (savedProjects) {
    const projects = JSON.parse(savedProjects as string);
    for (let index = 0; index < projects.length; index++) {
      if (projects[index].info.name === projectName.value) {
        project = projects[index];
        getCategories(true);
        return;
      }
    }
  }
});

const getCategories = (enabled:boolean) => {
  const cats:{displayName:string,enabled:boolean}[] = [];
  const addedCats:string[] = [];
  for (let index = 0; index < project.info.images.length; index++) {
    const imageName = project.info.images[index];
    if (imageName.indexOf("/") != -1) {
      const cat = imageName.split("/")[0];
      if (addedCats.indexOf(cat) === -1) {
        addedCats.push(cat);
        cats.push({displayName:cat,enabled:enabled});
      }
    }
  }
  categories.value = cats;
  return cats;
}

const getEnabledCategories = () => {
  const enabledCats = [];
  for (const cat of categories.value) {
    if (cat.enabled) {
      const copy = JSON.parse(JSON.stringify(cat));
      copy.enabled = false;
      enabledCats.push(copy);
    }
  }
  return enabledCats;
}

const getStatistics = async () => {
  showCalculatingDialog.value = true;
  const selectedEngines = getSelectedEngines();
  const statisticsOfEngines:EngineStatistics[] = [];
  for (let index = 0; index < selectedEngines.length; index++) {
    const engine = selectedEngines[index];
    const statistics = await calculateEngineStatistics(project,engine);
    statisticsOfEngines.push(statistics);
  }
  statisticsOfEngines.sort((a, b) => b.metrics.accuracy - a.metrics.accuracy);

  calculateTableRows(statisticsOfEngines);
  if (categories.value.length>0) {
    tableInCategories.value = [];
    const statisticsOfCategories = await calculateCategoryStatistics();
    addAverageStatistics(statisticsOfCategories);
    calculateCategoryTableRows("accuracy","Reading Rate",{enable:true,mode:"max"},statisticsOfCategories);
    calculateCategoryTableRows("precision","Precision",{enable:true,mode:"max"},statisticsOfCategories);
    calculateCategoryTableRows("averageTime","Average Time",{enable:true,mode:"min"},statisticsOfCategories);
  }
  
  const sortedEngineNames = getEngineNames(statisticsOfEngines);
  const accuracyData = getData(statisticsOfEngines,"accuracy");
  const averageTimeData = getData(statisticsOfEngines,"averageTime");
  const precisionData = getData(statisticsOfEngines,"precision");
  readingRateOption.value = getOptionForChart(accuracyData,"Reading Rate","{c}%",sortedEngineNames);
  averageTimeOption.value = getOptionForChart(averageTimeData,"Average Time","{c}ms",sortedEngineNames);
  precisionOption.value = getOptionForChart(precisionData,"Precision","{c}%",sortedEngineNames);
  showCalculatingDialog.value = false;
}

const getOptionForChart = (data:any[],displayName:string,labelFormatter:string,engineNames:string[],enableSort?:boolean,ascend?:boolean) => {
  if (enableSort && sorting.value === true) {
    const arrayToSort:{engine:string,data:number}[] = [];
    for (let index = 0; index < engineNames.length; index++) {
      const engine = engineNames[index];
      arrayToSort.push({engine:engine,data:data[index]});
    }
    if (ascend) {
      arrayToSort.sort((a, b) => b.data - a.data);
    }else{
      arrayToSort.sort((a, b) => a.data - b.data);
    }
    
    data = [];
    engineNames = [];
    for (const item of arrayToSort) {
      data.push(item.data);
      engineNames.push(item.engine);
    }
  }

  const app:any = {};
  app.config = {
    rotate: 0,
    align: 'center',
    verticalAlign: 'middle',
    position: 'inside',
    distance: 10
  };
  const labelOption = {
    show: true,
    position: app.config.position,
    distance: app.config.distance,
    align: app.config.align,
    verticalAlign: app.config.verticalAlign,
    rotate: app.config.rotate,
    //'{c}%', '{c}ms', etc
    formatter: labelFormatter,
    fontSize: 12,
    rich: {
      name: {}
    }
  };
  const option = {
    title:{
      text: displayName,
      show: false
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: engineNames
    },
    toolbox: {
      show: true,
      orient: 'vertical',
      left: 'right',
      top: 'center',
      feature: {
        mark: { show: true },
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ['line', 'bar', 'stack'] },
        restore: { show: true },
        saveAsImage: { show: true }
      }
    },
    xAxis: [
      {
        type: 'category',
        axisTick: { show: false },
        data: [displayName]
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: getSeries(data,engineNames,labelOption)
  };
  return option;
}

const getSeries = (data:any[],engineNames:string[],labelOption:any) => {
  const series = [];
  
  for (let index = 0; index < engineNames.length; index++) {
    const engine = engineNames[index];
    let color = "";
    for (const config of configs) {
      if (config.displayName === engine) {
        if (config.color) {
          color = config.color;
        }
        break;
      }
    }
    const seriesItem:any = 
    {
      name: engine,
      type: 'bar',
      barGap: 0,
      label: labelOption,
      emphasis: {
        focus: 'series'
      },
      data: [data[index]]
    };
    if (color) {
      seriesItem.itemStyle = {
        color: color
      }
    }
    series.push(seriesItem);
  }
  return series;
}

const calculateTableRows = (statisticsOfEngines:EngineStatistics[]) => {
  const rows:tableRow[] = [];
  if (statisticsOfEngines[0].rows) {
    for (let i = 0; i < statisticsOfEngines[0].rows.length; i++) {
      const detectedEngines = [];
      const failedEngines = [];
      for (let j = 0; j < statisticsOfEngines.length; j++) {
        const statistics = statisticsOfEngines[j];
        if (statistics.rows) {
          if (statistics.rows[i].correct === "true") {
            detectedEngines.push(statistics.name);
          }else{
            failedEngines.push(statistics.name);
          }
        }
      }
      const row:tableRow = {
        number: (i+1),
        filename: statisticsOfEngines[0].rows[i].filename,
        detectedEngines: detectedEngines,
        failedEngines: failedEngines
      }
      rows.push(row);
    }
  }
  tableRows.value = rows;
}

const calculateCategoryStatistics = async () => {
  const selectedEngines = getSelectedEngines();
  const statisticsOfCategories = [];
  for (const cat of categories.value) {
    if (cat.enabled === false) {
      continue;
    }
    const statisticsOfEngines:EngineStatistics[] = [];
    for (let index = 0; index < selectedEngines.length; index++) {
      const engine = selectedEngines[index];
      const statistics = await calculateEngineStatistics(project,engine,cat.displayName);
      statisticsOfEngines.push(statistics);
    }
    statisticsOfCategories.push({category:cat.displayName,statisticsOfEngines});
  }
  return statisticsOfCategories;
}

const addAverageStatistics = (statisticsOfCategories:{category:string,statisticsOfEngines:EngineStatistics[]}[]) => {
  const statisticsOfEngines:EngineStatistics[] = [];
  const newCategory = {category:"total average",statisticsOfEngines:statisticsOfEngines};
  const engines = getSelectedEngines();
  for (let index = 0; index < engines.length; index++) {
    const engine = engines[index];
    let totalMetrics:any = {
      fileNumber: 0,
      correctFilesNumber:0,
      barcodeNumber: 0,
      detectedFilesRate: 0,
      accuracy:0,
      precision:0,
      averageTime:0,
    };
    for (let j = 0; j < statisticsOfCategories.length; j++) {
      const statisticsOfCategory = statisticsOfCategories[j];
      for (let k = 0; k < statisticsOfCategory.statisticsOfEngines.length; k++) {
        const engineStatistics:any = statisticsOfCategory.statisticsOfEngines[k];
        if (engineStatistics.name === engine) {
          for (const key in totalMetrics) {
            totalMetrics[key] = totalMetrics[key] + engineStatistics.metrics[key];
          }
          break;
        }
      }
    }
    for (const key in totalMetrics) {
      totalMetrics[key] =  (totalMetrics[key]/statisticsOfCategories.length).toFixed(2);
    }
    const statisticsOfEngine:EngineStatistics = {
      name:engine,
      metrics:totalMetrics
    }
    statisticsOfEngines.push(statisticsOfEngine);
  }
  statisticsOfCategories.push(newCategory);
}

const calculateCategoryTableRows = (metricsName:string,displayName:string,config:highlightConfig,statisticsOfCategories:{category:string,statisticsOfEngines:EngineStatistics[]}[]) => {
  const rows:categoryTableRow[] = [];
  for (const categoryStatistics of statisticsOfCategories) {
    const statistics = categoryStatistics.statisticsOfEngines;
    const metrics:{data:number[],highlightedIndex:number} = getSpecificMetrics(statistics,metricsName,config);
    const row:categoryTableRow = {
      category:categoryStatistics.category,
      statistics:metrics.data,
      highlightedIndex:metrics.highlightedIndex
    }
    rows.push(row);
  }
  tableInCategories.value.push({metrics:metricsName,displayName:displayName,rows:rows});
}

const getSpecificMetrics = (statistics:EngineStatistics[],metricsName:string,config:highlightConfig) => {
  const dataArray = [];
  let highlightedIndex = -1;
  let minMaxValue:number|undefined = undefined;
  for (let index = 0; index < statistics.length; index++) {
    const metrics = statistics[index].metrics as any;
    const data = metrics[metricsName];
    dataArray.push(data);
    if (config.enable) {
      if (minMaxValue === undefined) {
        minMaxValue = data;
        highlightedIndex = 0;
      }else{
        if (config.mode === "max") {
          if (data>minMaxValue) {
            minMaxValue = data;
            highlightedIndex = index;
          }
        }else{
          if (data<minMaxValue) {
            minMaxValue = data;
            highlightedIndex = index;
          }
        }
      }
    }
  }
  return {highlightedIndex:highlightedIndex,data:dataArray};
}

const drawCharts = (table:{metrics:string,displayName:string,rows:categoryTableRow[]}) => {
  selectedTable = table;
  chartOptionsForCategories.value = [];
  const cats = getEnabledCategories();
  cats.push({displayName:"total average",enabled:false});
  categoriesForCharts.value  = cats;
  showChartsDialog.value = true;
}

const drawChartForSelectedCategory = () => {
  console.log("draw");
  chartOptionsForCategories.value = [];
  const engines = getSelectedEngines();
  const newOptions:any = [];
  for (const category of categoriesForCharts.value) {
    if (category.enabled) {
      for (const row of selectedTable.rows) {
        if (row.category === category.displayName) {
          const data = row.statistics;
          let formatter;
          let ascend = false;
          if (selectedTable.displayName.toLowerCase().indexOf("time") != -1) {
            formatter = "{c}ms";
            ascend = false;
          }else{
            formatter = "{c}%";
            ascend = true;
          }
          const option = getOptionForChart(data,category.displayName,formatter,engines,true,ascend);
          newOptions.push(option);
          break;
        }
      }
    }
  }
  chartOptionsForCategories.value = newOptions;
}

const getSelectedEngines = () => {
  const selectedEngines:string[] = [];
  for (let index = 0; index < engines.value.length; index++) {
    const engine = engines.value[index];
    if (engine.enabled) {
      selectedEngines.push(engine.displayName);
    }
  }
  return selectedEngines;
}

const getEngineNames = (statisticsOfEngines:EngineStatistics[]) => {
  const engineNames = [];
  for (let index = 0; index < statisticsOfEngines.length; index++) {
    const statistics = statisticsOfEngines[index];
    engineNames.push(statistics.name);
  }
  return engineNames;
}

const getData = (statisticsOfEngines:EngineStatistics[],key:string) => {
  const data = [];
  for (let index = 0; index < statisticsOfEngines.length; index++) {
    const statistics = statisticsOfEngines[index];
    data.push((statistics.metrics as any)[key]);
  }
  return data;
}

const goToDetailsPage = (name:string) => {
  const href = "/project/"+encodeURIComponent(projectName.value)+"/"+encodeURIComponent(name);
  const routeUrl = router.resolve(href);
  window.open(routeUrl.href,'_blank');
}

const goBack = () => {
  router.push("/project/"+encodeURIComponent(projectName.value));
}


</script>
<style scoped>
.full {
  width:100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.container {
  width: 100%;
  padding-left: 30px;
  padding-right: 30px;
  padding-bottom: 30px;
}

.statistics-of-category {
  margin-bottom: 2em;
}

.options {
  background: #f5f5f5;
  padding: 5px 15px;
  margin-right: 5px;
}

.charts {
  display:flex;
  flex-wrap: wrap;
}

.chart-container {
  flex-grow: 1;
  flex-basis: 100%;
}

.chart {
  height: 400px;
  max-width: 600px;
}
.highlighted {
  font-weight: bold;
}

</style>