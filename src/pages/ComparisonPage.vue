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
          <div class="engines">
            <q-checkbox color="orange" v-model="engine.enabled" :label="engine.name" v-for="engine in engines" v-bind:key="engine.name"/>
          </div>
          <dynamsoft-button label="Get comparison statistics" v-on:click="getStatistics()" />
        </div>
        <div>
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
                  <th class="text-left" v-for="engine in engines" v-bind:key="engine.name">{{ engine.name }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in tableRows" v-bind:key="row.number">
                  <td>{{ row.number }}</td>
                  <td><a href="javascript:void();" @click="goToDetailsPage(row.filename)"> {{ row.filename }} </a></td>
                  <td class="text-left" v-for="engine in engines" v-bind:key="'detected-'+engine.name">
                    {{ (row.detectedEngines.indexOf(engine.name) != -1) ? '✓' : '✗' }}
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </div>
        </div>        
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { BarcodeReader } from "src/barcodeReader/BarcodeReader";
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
import { calculateEngineStatistics } from "src/utils";
import { useMeta } from "quasar";
import DynamsoftButton from "src/components/DynamsoftButton.vue";

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

const projectName = ref("");
const engines = ref([] as {name:string,enabled:boolean}[])
const router = useRouter();
const tableRows = ref([] as tableRow[]);
let project:Project;

interface tableRow {
  number:number;
  filename:string;
  detectedEngines:string[];
  failedEngines:string[];
}

onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  const supportedEngines = BarcodeReader.getEngines();
  const enginesList = [];
  for (let index = 0; index < supportedEngines.length; index++) {
    const engine = supportedEngines[index];
    const item = {name:engine,enabled:true};
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
        return;
      }
    }
  }
});

const getStatistics = async () => {
  const selectedEngines = getSelectedEngines();
  const statisticsOfEngines:EngineStatistics[] = [];
  for (let index = 0; index < selectedEngines.length; index++) {
    const engine = selectedEngines[index];
    const statistics = await calculateEngineStatistics(project,engine);
    statisticsOfEngines.push(statistics);
  }
  statisticsOfEngines.sort((a, b) => b.metrics.accuracy - a.metrics.accuracy);

  calculateTableRows(statisticsOfEngines);

  const sortedEngineNames = getEngineNames(statisticsOfEngines);
  const readRates = getData(statisticsOfEngines,"accuracy");
  
  const percentLabelOption = {
    show: true,
    position: 'top',
    formatter: '{c}%',
    fontSize: 12,
    rich: {
      name: {}
    }
  };
  
  const optionForReadingRate = {
    title: {
      text: 'Reading Rate',
      x: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    toolbox: {
      show: true,
      orient: 'vertical',
      left: 'right',
      top: 'center',
      feature: {
        saveAsImage: { show: true }
      }
    },
    xAxis: { type: 'category', data: sortedEngineNames },
    yAxis: { type: 'value' },
    series: [{ label: percentLabelOption, data: readRates, type: 'bar' }]
  };
  readingRateOption.value = optionForReadingRate;

  const averageTimes = getData(statisticsOfEngines,"averageTime");
  
  const averageTimeLabelOption = {
    show: true,
    position: 'top',
    formatter: '{c}ms',
    fontSize: 12,
    rich: {
      name: {}
    }
  };

  const optionForAverageTime = {
    title: {
      text: 'Average Time',
      x: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    toolbox: {
      show: true,
      orient: 'vertical',
      left: 'right',
      top: 'center',
      feature: {
        saveAsImage: { show: true }
      }
    },
    xAxis: { type: 'category', data: sortedEngineNames },
    yAxis: { type: 'value' },
    series: [{ label: averageTimeLabelOption, data: averageTimes, type: 'bar' }]
  };
  averageTimeOption.value = optionForAverageTime;

  const precisions = getData(statisticsOfEngines,"precision");
  const optionForPrecision = {
    title: {
      text: 'Precision',
      x: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    toolbox: {
      show: true,
      orient: 'vertical',
      left: 'right',
      top: 'center',
      feature: {
        saveAsImage: { show: true }
      }
    },
    xAxis: { type: 'category', data: sortedEngineNames },
    yAxis: { type: 'value' },
    series: [{ label: percentLabelOption, data: precisions, type: 'bar' }]
  };
  precisionOption.value = optionForPrecision
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

const getSelectedEngines = () => {
  const selectedEngines:string[] = [];
  for (let index = 0; index < engines.value.length; index++) {
    const engine = engines.value[index];
    if (engine.enabled) {
      selectedEngines.push(engine.name);
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
  max-width: 1280px;
  padding-left: 30px;
  padding-right: 30px;
  padding-bottom: 30px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.engines {
  background: #f5f5f5;
  padding: 5px 15px;
  margin-right: 5px;
}

.charts {
  display:flex;
  flex-wrap: wrap;
}

.chart {
  height: 400px;
}

.chart-container {
  flex-grow: 1;
  flex-basis: 33%;
}

@media screen and (max-device-width: 600px){
  .chart-container {
    flex-basis: 100%;
  }
}

</style>