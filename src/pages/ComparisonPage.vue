<template>
  <q-page class="row justify-evenly">
    <q-card flat bordered class="overview-card" style="width:100%;">
      <q-card-section>
        <div class="text-h6">{{projectName}}</div>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section>
        <div>
          Engines:
          <q-checkbox v-model="engine.enabled" :label="engine.name" v-for="engine in engines" v-bind:key="engine.name"/>
        </div>
        <q-btn outline color="primary" label="Get comparison statistics" v-on:click="getStatistics()" />
        <div class="row" style="padding-top:1em;" v-if="Object.keys(readingRateOption).length > 0">
          <div class="col">
            <v-chart class="chart" :option="readingRateOption" />
          </div>
          <div class="col">
            <v-chart class="chart" :option="averageTimeOption" />
          </div>
        </div>
      </q-card-section>
    </q-card>
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

const projectName = ref("");
const engines = ref([] as {name:string,enabled:boolean}[])
const router = useRouter();
let project:Project;
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
  const sortedEngineNames = getEngineNames(statisticsOfEngines);
  const readRates = getReadingRateData(statisticsOfEngines);
  
  const labelOption = {
    show: true,
    position: 'top',
    formatter: '{c}%',
    fontSize: 16,
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
    series: [{ label: labelOption, data: readRates, type: 'bar' }]
  };
  readingRateOption.value = optionForReadingRate;
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

const getReadingRateData = (statisticsOfEngines:EngineStatistics[]) => {
  const readingRate = [];
  for (let index = 0; index < statisticsOfEngines.length; index++) {
    const statistics = statisticsOfEngines[index];
    readingRate.push(statistics.metrics.accuracy);
  }
  return readingRate;
}


</script>
<style scoped>
.chart {
  height: 400px;
}
</style>