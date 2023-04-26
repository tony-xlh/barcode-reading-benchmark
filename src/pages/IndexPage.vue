<template>
  <q-page class="row justify-evenly">
    <div class="q-pa-md" style="width: 100%">
      <q-list bordered separator>
        <q-item-label header>Local Projects:</q-item-label>
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
      <q-list bordered separator>
        <q-item-label header>Remote Projects:</q-item-label>
        <q-separator spaced/>
        <q-item clickable v-ripple v-for='project in remoteProjects' v-bind:key="project">
          <q-item-section v-on:click="showRemoteProjectActionDialog(project)">
            <q-item-label>{{project}}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div class="dialogs">
      <q-dialog v-model="newProject">
        <q-card>
          <q-card-section>
            <div class="text-h6">New project</div>
          </q-card-section>
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
      <q-dialog v-model="remoteProjectAction">
        <q-card>
          <q-card-section>
            <div class="text-h6">Remote project: {{ remoteProject?.info.name }}</div>
          </q-card-section>
          <q-card-section>
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
            <q-btn flat v-close-popup color="primary" label="Import" v-on:click="importRemoteProject"/>
            <q-btn flat v-close-popup color="primary" label="Close"/>
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
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
import { removeProjectFiles, BlobtoDataURL, getFilenameWithoutExtension } from "src/utils";
import JSZip from "jszip";
import { BarcodeReader } from "src/barcodeReader/BarcodeReader";

const newProject = ref(false);
const projectName = ref("");
const projects = ref([] as Project[]);
const action = ref(false);
const remoteProjectAction = ref(false);
const router = useRouter();
const remoteProjects = ref([] as string[]);
const remoteImageFilesProgress = ref(0.0);
const remoteImageFilesProgressLabel = ref("");
const textResultsDownloaded = ref(false);
const downloadingStatus = ref("");
let selectedIndex = -1;
let remoteProject = ref(null as null|Project);
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
      const projectList:string[] = JSON.parse(text);  
      remoteProjects.value = projectList;
    } catch (error) {
      console.log(error);
    }
  }
}

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


const showRemoteProjectActionDialog = async (name:string) => {
  const resp = await fetch("./dataset/"+name+"/project_manifest.json");
  const text = await resp.text();
  const projectObj:Project = JSON.parse(text);
  remoteProject.value = projectObj;
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
  remoteProjectAction.value = true;
}

const downloadTextResults = async () => {
  if (downloadingStatus.value === "Downloading...") {
    alert("Already downloading.");
    return;
  }
  downloadingStatus.value = "Downloading...";
  const resp = await fetch ("./dataset/"+remoteProject.value?.info.name+"/results.zip");
  downloadingStatus.value = "";
  const blob = await resp.blob();
  if (blob.size>0) {
    await localForage.setItem(remoteProject.value?.info.name+":results.zip",blob);
    textResultsDownloaded.value = true;
  }
}

const downloadImages = async () => {
  if (remoteProject.value) {
    if (downloadingStatus.value === "Downloading...") {
      alert("Already downloading.");
      return;
    }
    downloadingStatus.value = "Downloading...";
    for (let index = 0; index < remoteProject.value.info.images.length; index++) {
      if (remoteProjectAction.value === false) { //stop downloading if the dialog is hidden
        downloadingStatus.value = "";
        return;
      }
      const image = remoteProject.value.info.images[index];
      const dataURLInDB = await localForage.getItem(remoteProject.value.info.name+":image:"+image);
      if (!dataURLInDB) {
        const resp = await fetch ("./dataset/"+remoteProject.value.info.name+"/"+image);
        const blob = await resp.blob();
        if (blob.size>0) {
          const dataURL = await BlobtoDataURL(blob);
          await localForage.setItem(remoteProject.value.info.name+":image:"+image,dataURL);
        }
      }
      updateRemoteProjectProgress(index);
    }
    downloadingStatus.value = "";
  }
}

const updateRemoteProjectProgress = (index:number) => {
  if (remoteProject.value) {
    remoteImageFilesProgress.value = parseFloat(((index + 1) /remoteProject.value.info.images.length).toFixed(2));
    remoteImageFilesProgressLabel.value = (index + 1) + "/" + remoteProject.value.info.images.length;
  }
}

const importRemoteProject = async () => {
  if (textResultsDownloaded.value === false) {
    alert("Please download the text results.");
    return;
  }
  let newProjects:Project[] = [];
  projects.value.forEach(project => {
    if (project.info.name === remoteProject.value?.info.name) {
      alert("The project has already been added.");
      return;
    }
    newProjects.push(project);
  });
  await loadTextResultsFromZip();
  if (remoteProject.value) {
    newProjects.push(remoteProject.value);
  }
  projects.value = newProjects;
  await localForage.setItem("projects", JSON.stringify(newProjects));
}

const loadTextResultsFromZip = async ():Promise<boolean> => {
  if (remoteProject.value) {
    const blob:Blob|null|undefined = await localForage.getItem(remoteProject.value.info.name+":results.zip");
    if (blob) {
      const zip = new JSZip();
      await zip.loadAsync(blob);
      const detectionResultFileNamesListString = await zip.file("detection_result_filenames.json")?.async("string");
      if (detectionResultFileNamesListString) {
        const detectionResultFileNamesList:string[] = JSON.parse(detectionResultFileNamesListString);
        for (let index = 0; index < detectionResultFileNamesList.length; index++) {
          const detectionResultFileName = detectionResultFileNamesList[index];
          const detectionResultString:string|undefined = await zip.file(detectionResultFileName)?.async("string");
          if (detectionResultString) {
            await localForage.setItem(remoteProject.value.info.name+":detectionResult:"+detectionResultFileName,detectionResultString);
          }
        }
        await localForage.setItem(remoteProject.value.info.name+":detectionResultFileNamesList",detectionResultFileNamesList);
      }
      for (let index = 0; index < remoteProject.value.info.images.length; index++) {
        const imageName = remoteProject.value.info.images[index];
        const groundTruthName = getFilenameWithoutExtension(imageName)+".txt";
        const key = remoteProject.value.info.name+":groundTruth:"+groundTruthName;
        const groundTruthString:string|undefined = await zip.file(groundTruthName)?.async("string");
        if (groundTruthString) {
          await localForage.setItem(key,groundTruthString);
        }
      }
      const engines = BarcodeReader.getEngines();
      for (let index = 0; index < engines.length; index++) {
        const engine = engines[index];
        const settingsString = await zip.file(engine+"_settings.json")?.async("string");
        if (settingsString) {
          await localForage.setItem(remoteProject.value.info.name+":settings:"+engine,JSON.parse(settingsString));
        }
      }
      return true;
    }
  }
  return false;
}


</script>
