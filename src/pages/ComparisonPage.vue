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
  console.log(engines.value);
}
</script>
