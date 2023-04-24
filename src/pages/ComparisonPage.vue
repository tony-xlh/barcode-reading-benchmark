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
        <div class="row" style="padding-top:1em;">
          <div class="col">
            <v-chart class="chart" :option="readRateOption" />
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
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from "echarts/components";
import VChart from "vue-echarts";

use([
  SVGRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
]);

const readRateOption = ref({});
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

const getStatistics = () => {
  const selectedEngines = getSelectedEngines()
  const optionForReadRate = {
    xAxis: { type: 'category', data: selectedEngines },
    yAxis: { type: 'value' },
    series: [{ data: [120, 200, 150, 80, 70, 110, 130], type: 'bar' }]
  };
}

const getSelectedEngines = () => {
  const selectedEngines = [];
  for (let index = 0; index < engines.value.length; index++) {
    const engine = engines.value[index];
    if (engine.enabled) {
      selectedEngines.push(engine);
    }
  }
  return selectedEngines;
}

const getReadRate = (engine:string) => {
  console.log(engine);
}


</script>
<style scoped>
.chart {
  height: 400px;
}
</style>