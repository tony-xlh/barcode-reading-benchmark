<template>
  <q-page class="row justify-evenly">
    <q-card flat bordered class="overview-card" style="width:100%;">
      <q-card-section>
        <div class="text-h6">{{projectName}}</div>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section>
        <div style="padding-bottom: 20px;">
          <q-select style="max-width: 300px" v-model="selectedEngine" :options="engines" label="Engine" />
        </div>
        <div>
          <q-btn outline color="primary" label="Start decoding" v-on:click="decode" />
        </div>
        <div>
          Statistics: 
        </div>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section>
      <q-table
        title="Images"
        :rows="rows"
        :columns="columns"
        row-key="name"
      >
        <template v-slot:top-right>
          <q-btn-dropdown color="primary" label="Action">
            <q-list>
              <q-item clickable v-close-popup @click="showLocalFilesDialog">
                <q-item-section>
                  <q-item-label>Add local files</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="clearProject">
                <q-item-section>
                  <q-item-label>Clear</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
         </q-btn-dropdown>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="number" :props="props">
              {{ props.row.number }}
            </q-td>
            <q-td key="name" :props="props" @click="nameClicked(props.row.filename)">
              {{ props.row.filename }}
            </q-td>
            <q-td key="detectedText" :props="props">
              {{ props.row.detectedText }}
            </q-td>
            <q-td key="groundTruth" :props="props">
              {{ props.row.groundTruth }}
            </q-td>
            <q-td key="barcodeFormat" :props="props">
              {{ props.row.barcodeFormat }}
            </q-td>
            <q-td key="time" :props="props">
              {{ props.row.time }}
            </q-td>
            <q-td key="correct" :props="props">
              {{ props.row.correct }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
      </q-card-section>
    </q-card>
    <q-dialog v-model="action">
      <q-card>
        <q-card-section>
          <div class="text-h6">Add files</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div>
            <input type="file" id="imageFiles" multiple="true" v-on:change="loadImageFiles($event);" accept=".jpg,.jpeg,.png,.bmp" />
            <label for="imageFiles">Image files.</label>
          </div>
          <div>
            <input type="file" id="detectionResultFiles" multiple="true" v-on:change="loadDetectionResultFiles($event);" accept=".txt" />
            <label for="detectionResultFiles">Detection result files.</label>
          </div>
          <div>
            <input type="file" id="groundTruthFiles" multiple="true" v-on:change="loadGroundTruthFiles($event);" accept=".txt" />
            <label for="imageFiles">Ground truth files.</label>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Add to project" v-on:click="addFilesToProject" />
          <q-btn flat v-close-popup color="primary" label="Close"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { BarcodeReader } from "src/barcodeReader/BarcodeReader";
import { Project } from "src/definitions/project";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import localForage from "localforage";
import { readFileAsDataURL, readFileAsText } from "src/utils";

const columns = [
  {
    name: 'number',
    required: true,
    label: 'No.',
    align: 'left',
    field: 'number'
  },
  {
    name: 'name',
    required: true,
    label: 'Filename',
    align: 'left',
    field: 'filename',
    sortable: true
  },
  {
    name: 'detectedText',
    required: true,
    label: 'Detected Text',
    align: 'left',
    field: 'detectedText'
  },
  {
    name: 'groundTruth',
    required: true,
    label: 'Ground Truth',
    align: 'left',
    field: 'groundTruth'
  },
  {
    name: 'barcodeFormat',
    required: true,
    label: 'Barcode Format',
    align: 'left',
    field: 'barcodeFormat'
  },
  {
    name: 'time',
    required: true,
    label: 'Time',
    align: 'left',
    field: 'time'
  },
  {
    name: 'correct',
    required: true,
    label: 'Correct',
    align: 'left',
    field: 'correct',
    sortable: true
  }
]
let reader: BarcodeReader;
let project:Project;
const rows = ref([] as any[]);
const engines = ref([] as string[])
const router = useRouter();
const projectName = ref("");
const selectedEngine = ref("");
const action = ref(false);
let imageFiles:File[] = [];
let detectionResultFiles:File[] = [];
let groundTruthFiles:File[] = [];
let projects:Project[] = [];
      
onMounted(async () => {
  console.log("mounted");
  projectName.value = router.currentRoute.value.params.name as string;
  const savedProjects = await localForage.getItem("projects");
  const supportedEngines = BarcodeReader.getEngines();
  engines.value = supportedEngines;
  if (supportedEngines.length>0) {
    selectedEngine.value = supportedEngines[0];
  }

  if (savedProjects) {
    projects = JSON.parse(savedProjects as string);
    for (let index = 0; index < projects.length; index++) {
      if (projects[index].info.name === projectName.value) {
        project = projects[index];
        updateRows();
        return;
      }    
    }
  }
});

const updateRows = () => {
  if (project) {
    let newRows = [];
    for (let index = 0; index < project.info.images.length; index++) {
      const image = project.info.images[index];
      const row = {
        number: (index + 1),
        filename:image
      }
      newRows.push(row);
    } 
    rows.value = newRows;
  }
}

const decode = () => {
  console.log(selectedEngine.value);
}

const getStatistics = () => {
  console.log(reader);
}

const loadDetectionResultFiles = (e:any) => {
  detectionResultFiles = e.target.files;
}

const loadImageFiles = (e:any) => {
  imageFiles = e.target.files;
}

const loadGroundTruthFiles = (e:any) => {
  groundTruthFiles = e.target.files;
}

const addFilesToProject = async () => {
  if (project) {
    for (let index = 0; index < groundTruthFiles.length; index++) {
      const file = groundTruthFiles[index];
      const content = await readFileAsText(file);
      localForage.setItem(projectName.value+":groundTruth:"+file.name,content);
    }
    let detectionResultFileNamesList = [];
    for (let index = 0; index < detectionResultFiles.length; index++) {
      const file = detectionResultFiles[index];
      const content = await readFileAsText(file);
      detectionResultFileNamesList.push(file.name);
      localForage.setItem(projectName.value+":detectionResult:"+file.name,content);
    }
    for (let index = 0; index < imageFiles.length; index++) {
      const file = imageFiles[index];
      const dataURL = await readFileAsDataURL(file);
      localForage.setItem(projectName.value+":image:"+file.name,dataURL);
      project.info.images.push(file.name);
    }
    localForage.setItem(projectName.value+":detectionResultFileNamesList",detectionResultFileNamesList);
    updateRows();
    saveProjects();
    alert("added");
    action.value = false;
  }
}

const saveProjects = async () => {
  let projectsToSave:Project[] = [];
  projects.forEach(project => {
    projectsToSave.push(project);
  });
  await localForage.setItem("projects", JSON.stringify(projectsToSave));
}

const showLocalFilesDialog = () => {
  action.value = true;
}

const clearProject = async () => {
  for (let index = 0; index < project.info.images.length; index++) {
    const image = project.info.images[index];
    localForage.removeItem(projectName.value+":image:"+image);
    localForage.removeItem(projectName.value+":groundTruth:"+getFilenameWithoutExtension(image)+".txt");
  }
  const detectionResultFileNamesList:undefined|null|string[] = await localForage.getItem(projectName.value+":detectionResultFileNamesList");
  if (detectionResultFileNamesList) {
    for (let index = 0; index < detectionResultFileNamesList.length; index++) {
      const filename = detectionResultFileNamesList[index];
      localForage.removeItem(projectName.value+":detectionResult:"+filename);  
    }
  }
  project.info.images = [];
  saveProjects();
  updateRows();
}

//scanned.jpg => scanned
const getFilenameWithoutExtension = (filename:string) => {
  if (filename.lastIndexOf(".") != -1) {
    return filename.substring(0,filename.lastIndexOf("."));
  }else{
    return filename;
  }
}

const nameClicked = (name:string) => {
  console.log("clicked");
  console.log(name);
}

</script>

<style>
.q-td {
  max-width: 150px;
  white-space: break-spaces !important;
  overflow-y: auto;
}
</style>