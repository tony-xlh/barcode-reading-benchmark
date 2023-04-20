<template>
  <q-page class="row justify-evenly">
    <div class="q-pa-md" style="width: 100%">
      <q-list bordered separator>
        <q-item-label header>Projects:</q-item-label>
        <q-separator spaced/>
        <q-item clickable v-ripple v-for='(project,index) in projects' v-bind:key="project.info.name">
          <q-item-section v-on:click="showActionDialog(index)">
            <q-item-label>{{project.info.name}}</q-item-label>
            <q-item-label caption lines="2">
              Number of Images: {{ project.info.images?.length }} 
              Creation Time: {{ getLocalTime(project.info.creationTimestamp) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <q-dialog v-model="newProject">
      <q-card>
        <q-card-section>
          <q-input outlined v-model="projectName" label="Project Name" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Okay" color="primary" v-close-popup v-on:click="createProject" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="action">
      <q-card style="width: 300px">
        <q-card-section>
          <q-list bordered separator>
          <q-item-label header>Actions</q-item-label>
          <q-separator spaced/>
          <q-item clickable v-ripple v-close-popup>
            <q-item-section v-on:click="openSelected">
              <q-item-label>Open</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple v-close-popup>
            <q-item-section v-on:click="deleteSelected">
              <q-item-label>Delete</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="blue" v-on:click="addButtonClicked" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { Project } from "src/project";
import localForage from "localforage";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { removeProjectFiles } from "src/utils";
const newProject = ref(false);
const projectName = ref("");
const projects = ref([] as Project[]);
const action = ref(false);
const router = useRouter();
let selectedIndex = -1;
onMounted(async () => {
  const savedProjects = await localForage.getItem("projects");
  if (savedProjects) {
    projects.value = JSON.parse(savedProjects as string);
  }
});

const getLocalTime = (timestamp:number) => {
  return new Date(timestamp).toLocaleString();
}

const addButtonClicked = () => {
  projectName.value = "";
  newProject.value = true;
}

const createProject = () => {
  if (hasDuplicateName(projectName.value)) {
    alert("Project name duplicated. Please use another name.");
  }else{
    const project = new Project({name:projectName.value,creationTimestamp:Date.now(),images:[]});
    projects.value.push(project);
    saveProjects();
  }
}

const hasDuplicateName = (name:string) => {
  for (let index = 0; index < projects.value.length; index++) {
    const project = projects.value[index];
    if (project.info.name === name) {
      return true;
    }
  }
  return false;
}

const saveProjects = async () => {
  console.log(projects.value);
  let projectsToSave:Project[] = [];
  projects.value.forEach(project => {
    projectsToSave.push(project);
  });
  await localForage.setItem("projects", JSON.stringify(projectsToSave));
}

const showActionDialog = (index:number) => {
  selectedIndex = index;
  action.value = true;
}

const openSelected = () => {
  router.push("/project/"+encodeURIComponent(projects.value[selectedIndex].info.name));
}

const deleteSelected = async () => {
  let newProjects = [];
  for (let index = 0; index < projects.value.length; index++) {
    const project = projects.value[index];
    if (index != selectedIndex) {
      newProjects.push(project);
    }else{
      await removeProjectFiles(project);
    }
  }
  projects.value = newProjects;
  saveProjects();
}

</script>
