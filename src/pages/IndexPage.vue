<template>
  <q-page class="row justify-evenly">
    <div class="q-pa-md" style="width: 100%">
      <q-list bordered separator>
        <q-item-label header>Projects:</q-item-label>
        <q-separator spaced/>
        <q-item clickable v-ripple v-for="project in projects" v-bind:key="project.info.name">
          <q-item-section>
            <q-item-label>{{project.info.name}}</q-item-label>
            <q-item-label caption lines="2">
              Number of Images: {{ project.info.images?.length }} 
              Creation Time: {{ getLocalTime(project.info.creationTimestamp) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="blue" v-on:click="AddButtonClicked" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { timeStamp } from "console";
import { Project } from "../definitions/project";
import localForage from "localforage";
import { onMounted, ref } from "vue";
const projects = ref([] as Project[]);
onMounted(async () => {
  const savedProjects = await localForage.getItem("projects") as Project[];
  if (savedProjects) {
    projects.value = savedProjects;
  }else{
    let testProject = new Project({name:"Test",creationTimestamp:1681459465815,images:[]});
    projects.value = [testProject];
  }
});

const getLocalTime = (timestamp:number) => {
  return new Date(timestamp).toLocaleString();
}

const AddButtonClicked = () => {
  console.log("add");
}

</script>
