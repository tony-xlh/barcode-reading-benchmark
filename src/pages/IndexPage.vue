<template>
  <q-page>
    <div class="full">
      <div class="container">
        <div class="main">
          <h2>Barcode Reading Benchmark</h2>
          <div v-for="(project,index) in projects" class="project-list-item" v-bind:key="project.info.name">
            <div class="project-name" >
              {{ project.info.name }}
            </div>
            <div class="flex-container">
              {{ (project.isRemote && project.info.images.length === 0) ? "remote project" : getLocalTime(project.info.creationTimestamp) }}
            </div>
            <div class="buttons">
              <dynamsoft-button label="Open" @click="openSelected(index)"/>
              <dynamsoft-button style="margin-left:5px;color:black;border-color:black;background-color: #fff;" label="Manage" @click="showManageDialog(index)"/>
            </div>
          </div>
        </div>
        <div>
          <div>
            <dynamsoft-button outline label="New Project" @click="newProjectButtonClicked"/>
          </div>
        </div>
      </div>
    </div>
  </q-page>
  <div class="dialogs">
    <q-dialog v-model="newProject">
      <q-card>
        <q-card-section>
          <div class="text-h6">New project</div>
        </q-card-section>
        <q-card-section>
          <q-input outlined v-model="projectName" label="Project Name"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Okay" color="primary" v-close-popup v-on:click="createProject" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="manageAction">
      <q-card style="min-width:300px;">
        <q-card-section>
          <div class="text-h6">Project: {{ selectedProject?.info.name }}</div>
        </q-card-section>
        <q-card-section v-if="selectedProject?.isRemote">
          <div>
            Text results<span v-if="textResultsDownloaded"> (downloaded)</span>: 
            <div>
              <q-btn outline color="primary" label="Download" v-on:click="downloadTextResults" />
            </div>
          </div>
          <div>
            Images 
            <a href="javascript:void();">
              (help)
              <q-tooltip style="font-size: 14px;">
                required if you need to checkout the images or rerun the decoding
              </q-tooltip>
            </a>:
            <q-linear-progress size="25px" :value="remoteImageFilesProgress" color="blue">
              <div class="absolute-full flex flex-center">
                <q-badge color="white" text-color="black" :label="remoteImageFilesProgressLabel" />
              </div>
            </q-linear-progress>
            <q-btn outline color="primary" label="Download" v-on:click="downloadImages" />
          </div>
          <div style="height:25px;">
            <span>{{ downloadingStatus }}</span>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat v-close-popup color="primary" label="Settings" v-on:click="goToSettingsPage"/>
          <q-btn v-if="selectedProject?.isRemote" flat v-close-popup color="primary" label="Import results" v-on:click="importTextResultsOfSelected"/>
          <q-btn flat v-close-popup color="primary" label="Delete" v-on:click="deleteSelected"/>
          <q-btn flat v-close-popup color="primary" label="Close"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showDownloadingDialog" v-if="status" persistent transition-show="scale" transition-hide="scale">
      <q-card style="width: 300px">
        <q-card-section>
          <div class="text-h6">Downloading project data...</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ status }}
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { Project } from "src/project";
import localForage from "localforage";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { removeProjectFiles, BlobtoDataURL } from "src/utils";
import DynamsoftButton from "src/components/DynamsoftButton.vue";
import { loadTextResultsFromZip, textResultsImported } from "src/projectUtils";

const newProject = ref(false);
const projectName = ref("");
const projects = ref([] as Project[]);
const manageAction = ref(false);
const showDownloadingDialog = ref(true);
const router = useRouter();
const remoteImageFilesProgress = ref(0.0);
const remoteImageFilesProgressLabel = ref("");
const textResultsDownloaded = ref(false);
const downloadingStatus = ref("");
const status = ref("");
const selectedProject = ref(null as null|Project);
let selectedIndex = -1;

onMounted(async () => {
  const savedProjects = await localForage.getItem("projects");
  if (savedProjects) {
    projects.value = JSON.parse(savedProjects as string);
  }
  loadRemoteProjects();
});

const loadRemoteProjects = async () => {
  const resp = await fetch("./dataset/projects.json");
  const text = await resp.text();
  if (text) {
    try {
      const projectNames:string[] = JSON.parse(text);
      console.log(projectNames);
      const projectList:Project[] = projects.value;
      for (let i = 0; i < projectNames.length; i++) {
        const projectName = projectNames[i];
        let alreadyAdded = false;
        for (let j = 0; j < projects.value.length; j++) {
          const project = projects.value[j];
          if (project.info.name === projectName) { //added to local projects
            alreadyAdded = true;
            project.isRemote = true;
            break;
          }
        }
        if (alreadyAdded === false) {
          let remoteProject = new Project({name:projectName,images:[],creationTimestamp:0},true);
          projectList.push(remoteProject);
        }
      }
      projects.value = projectList;
      console.log(projectList);
    } catch (error) {
      console.log(error);
    }
  }
}

const getLocalTime = (timestamp:number) => {
  return new Date(timestamp).toLocaleString();
}

const newProjectButtonClicked = () => {
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
  let projectsToSave:Project[] = [];
  projects.value.forEach(project => {
    projectsToSave.push(project);
  });
  await localForage.setItem("projects", JSON.stringify(projectsToSave));
}

const openSelected = async (index:number) => {
  if (status.value != "") {
    alert("Please wait for the current operation.");
    return;
  }
  let projectObj = projects.value[index];
  if (projectObj.isRemote) {
    const newProjectObj = await loadProjectManifestIfNeeded(projectObj);
    if (newProjectObj) {
      projectObj = newProjectObj;
    }
  }
  await importRemoteProjectIfNeeded(projectObj);
  router.push("/project/"+encodeURIComponent(projects.value[index].info.name));
}

const deleteSelected = async () => {
  let newProjects = [];
  for (let index = 0; index < projects.value.length; index++) {
    const project = projects.value[index];
    if (index != selectedIndex) {
      newProjects.push(project);
    }else{
      await removeProjectFiles(project);
      if (project.isRemote) {
        project.info.images = [];
        newProjects.push(project);
      }
    }
  }
  projects.value = newProjects;
  saveProjects();
}

const goToSettingsPage = () => {
  if (selectedProject.value) {
    const href = "/project/"+encodeURIComponent(selectedProject.value.info.name)+"/settings";
    const routeUrl = router.resolve(href);
    window.open(routeUrl.href,'_blank');
  }
}

const importTextResultsOfSelected = async () => {
  if (textResultsDownloaded.value === true) {
    if (selectedProject.value) {
      await loadTextResultsFromZip(selectedProject.value);
      alert("Imported");
    }
  }else{
    alert("Please download the text results first.");
  }
}

const showManageDialog = async (index:number) => {
  selectedIndex = index;
  let projectObj = projects.value[index];
  selectedProject.value = projectObj;
  console.log("selected:");
  console.log(selectedProject);
  if (projectObj.isRemote) {
    const newProjectObj = await loadProjectManifestIfNeeded(projectObj);
    if (newProjectObj) {
      projectObj = newProjectObj;
      selectedProject.value = projectObj;
    }
    const results:any = await localForage.getItem(projectObj.info.name+":results.zip");
    if (results) {
      textResultsDownloaded.value = true;
    }else{
      textResultsDownloaded.value = false;
    }
    let downloadedFilesCount = 0;
    for (let index = 0; index < projectObj.info.images.length; index++) {
      const image = projectObj.info.images[index];
      const dataURLInDB = await localForage.getItem(projectObj.info.name+":image:"+image);
      if (dataURLInDB) {
        downloadedFilesCount = downloadedFilesCount + 1;
      }
    }
    updateRemoteProjectProgress(downloadedFilesCount - 1);
  }
  console.log(projectObj);
  console.log(projects);
  manageAction.value = true;
}

const loadProjectManifestIfNeeded = async (projectObj:Project):Promise<undefined|Project> => {
  if (projectObj.info.images.length === 0) { //empty manifest
    const name = projectObj.info.name;
    const resp = await fetch("./dataset/"+name+"/project_manifest.json");
    const text = await resp.text();
    projectObj = JSON.parse(text);
    projectObj.isRemote = true;
    return projectObj;
  }
  return undefined;
}

const downloadTextResults = async () => {
  if (downloadingStatus.value === "Downloading...") {
    alert("Already downloading.");
    return;
  }
  downloadingStatus.value = "Downloading...";
  const resp = await fetch ("./dataset/"+selectedProject.value?.info.name+"/results.zip");
  downloadingStatus.value = "";
  const blob = await resp.blob();
  if (blob.size>0) {
    await localForage.setItem(selectedProject.value?.info.name+":results.zip",blob);
    textResultsDownloaded.value = true;
  }
}

const downloadImages = async () => {
  if (selectedProject.value) {
    if (downloadingStatus.value === "Downloading...") {
      alert("Already downloading.");
      return;
    }
    downloadingStatus.value = "Downloading...";
    for (let index = 0; index < selectedProject.value.info.images.length; index++) {
      if (manageAction.value === false) { //stop downloading if the dialog is hidden
        downloadingStatus.value = "";
        return;
      }
      const image = selectedProject.value.info.images[index];
      const dataURLInDB = await localForage.getItem(selectedProject.value.info.name+":image:"+image);
      if (!dataURLInDB) {
        const resp = await fetch ("./dataset/"+selectedProject.value.info.name+"/"+image);
        const blob = await resp.blob();
        if (blob.size>0) {
          const dataURL = await BlobtoDataURL(blob);
          await localForage.setItem(selectedProject.value.info.name+":image:"+image,dataURL);
        }
      }
      updateRemoteProjectProgress(index);
    }
    downloadingStatus.value = "";
  }
}

const updateRemoteProjectProgress = (index:number) => {
  if (selectedProject.value) {
    remoteImageFilesProgress.value = parseFloat(((index + 1) /selectedProject.value.info.images.length).toFixed(2));
    remoteImageFilesProgressLabel.value = (index + 1) + "/" + selectedProject.value.info.images.length;
  }
}

const importRemoteProjectIfNeeded = async (projectObj:Project) => {
  console.log(projectObj);
  if (projectObj.isRemote) {
    const results:any = await localForage.getItem(projectObj.info.name+":results.zip");
    if (!results) {
      status.value = "Downloading remote project text result files...";
      const resp = await fetch ("./dataset/"+projectObj.info.name+"/results.zip");
      const blob = await resp.blob();
      if (blob.size>0) {
        await localForage.setItem(projectObj.info.name+":results.zip",blob);
      }
    }
    const imported = await textResultsImported(projectObj);
    if (!imported) {
      status.value = "Importing remote project...";
      await loadTextResultsFromZip(projectObj);
      let newProjects:Project[] = [];
      projects.value.forEach(project => {
        if (project.info.name === projectObj.info.name) {
          newProjects.push(projectObj); //the projectObj is newer than the object stored in the value
        }else{
          newProjects.push(project);
        }
      });
      await localForage.setItem("projects", JSON.stringify(newProjects));
    }
    status.value = "";
  }
}


</script>
<style scoped>

.project-name {
  width: 100px;
  font-weight: bold;
}

h2 {
  align-self: center;
}
.main {
  display: flex;
  flex-direction: column;
}

.q-page {
  padding-left: 2em;
  padding-right: 2em;
}

@media screen and (max-device-width: 600px){
  h2 {
    text-align: center;
  }
  .q-page {
    padding-left: 1em;
    padding-right: 1em;
  }

}

.project-list-item {
  background: #F5F5F5;
  padding: 2em;
  width: 100%;
  display: flex;
  overflow: auto;
  margin-bottom: 1em;
  align-items: center;
}

.container {
  width: 100%;
  max-width: 1024px;
}

.flex-container {
  flex: 1;
  text-align: center;
  padding: 5px;
}

.full {
  width:100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.buttons .dynamsoft-button {
  flex-grow: 0;
  flex-basis: 50px;
}

</style>