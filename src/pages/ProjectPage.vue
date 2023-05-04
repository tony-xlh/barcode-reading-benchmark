<template>
  <q-page class="row justify-evenly">
    <q-card flat bordered class="overview-card" style="width:100%;">
      <q-card-section>
        <div class="text-h6">{{projectName}}</div>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section>
        <div class="row" style="padding-bottom: 20px;">
          <q-select @update:model-value="selectedEngineChanged($event)" style="min-width: 200px" v-model="selectedEngine" :options="engines" label="Engine" />
          <q-btn flat round color="primary" icon="settings" @click="showSettingsModal()" />
        </div>
        <div class="row" style="align-items: center;">
          <q-btn outline color="primary" :label="decoding ? 'Stop Decoding':'Start Decoding'" v-on:click="decode" />
          <q-checkbox  style="padding-left: 10px;" left-label v-model="skipDetected" label="Skip Detected" />
          <div v-if="decoding" style="width:100px;padding-left: 20px;">
            <q-linear-progress size="25px" :value="progress" color="blue">
            <div class="absolute-full flex flex-center">
              <q-badge color="white" text-color="black" :label="progressLabel" />
            </div>
            </q-linear-progress>
          </div>
        </div>
        <div>
          Statistics: 
          <div class="row">
            <div>
              Accuracy:
              <q-circular-progress
                show-value
                font-size="12px"
                :value="statistics.accuracy"
                size="50px"
                :thickness="0.22"
                color="teal"
                track-color="grey-3"
                class="q-ma-md"
              >
                {{ statistics.accuracy }}%
              </q-circular-progress>
            </div>
            <div>
              Precision:
              <q-circular-progress
                show-value
                font-size="12px"
                :value="statistics.precision"
                size="50px"
                :thickness="0.22"
                color="teal"
                track-color="grey-3"
                class="q-ma-md"
              >
                {{ statistics.precision }}%
              </q-circular-progress>
            </div>
          </div>
          <div>
            <div>
              Total files: {{ statistics.fileNumber }}
            </div>
            <div>
              Total barcodes: {{ statistics.barcodeNumber }}
            </div>
            <div>
              Correctly detected files: {{ statistics.correctFilesNumber }}
            </div>
            <div>
              Rate of detected files: {{ statistics.detectedFilesRate }}%
            </div>
            <div>
              Detected barcodes:  {{  parseInt((statistics.accuracy / 100 * statistics.barcodeNumber).toString()) }}
            </div>
            <div>
              Misdetected barcodes:  {{ parseInt(((1 - statistics.precision / 100) * statistics.barcodeNumber).toString()) }}
            </div>
            <div>
              Average time (ms): {{statistics.averageTime}}
            </div>
          </div>
        </div>
        <div style="padding-top:1em;line-height: 2em;">
          <div>
            <a href="javascript:void();" @click="goToComparisonPage()">Go to comparison page</a>
          </div>
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
              <q-item clickable v-close-popup @click="exportProject">
                <q-item-section>
                  <q-item-label>Export</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="clearProject">
                <q-item-section>
                  <q-item-label>Clear</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="convertDetectedResultsToGroundTruth">
                <q-item-section>
                  <q-item-label>Convert detected results to ground truth</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="goToLiveScannerPage">
                <q-item-section>
                  <q-item-label>Go to live scanner</q-item-label>
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
              <div class="filename">
                {{ props.row.filename }}
              </div>
            </q-td>
            <q-td key="detectedText" :props="props">
              <div class="text">
                {{ props.row.detectedText }}
              </div>
            </q-td>
            <q-td key="groundTruth" :props="props">
              <div class="text">
                {{ props.row.groundTruth }}
              </div>
            </q-td>
            <q-td key="barcodeFormat" :props="props">
              <div class="text">
                {{ props.row.barcodeFormat }}
              </div>
            </q-td>
            <q-td key="time" :props="props">
              {{ props.row.time }}
            </q-td>
            <q-td key="correct" :props="props">
              {{ props.row.correct }}
            </q-td>
            <q-td key="misdetected" :props="props">
              {{ props.row.misdetected }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
      </q-card-section>
    </q-card>
    <div class="dialogs">
      <q-dialog v-model="addAction">
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
              <input type="file" id="detectionResultFiles" multiple="true" v-on:change="loadDetectionResultFiles($event);" accept=".json" />
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
      <q-dialog v-model="exportAction">
        <q-card>
          <q-card-section>
            <div class="text-h6">Export</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div>
              <q-btn outline color="primary" label="Download images" v-on:click="downloadImages" />
            </div>
            <div>
              <q-btn outline color="primary" label="Download images in a zip" v-on:click="downloadImagesAsZip" />
            </div>
            <div>
              <q-btn outline color="primary" label="Download TextResults.zip" v-on:click="downloadTextResults" />
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat v-close-popup color="primary" label="Close"/>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="showSettings">
        <q-card>
          <q-card-section>
            <div class="text-h6">Settings</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div v-for="setting in barcodeReaderSettings" v-bind:key="setting.name">
              <div>
                <label for="'settings-' + setting.name">{{ setting.name + ":" }}</label>
              </div>
              <div>
                <textarea :id="'settings-' + setting.name" v-model="setting.value"/>
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat v-close-popup color="primary" label="Save" @click="saveSettings()"/>
            <q-btn flat v-close-popup color="primary" label="Close"/>
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { BarcodeReader, DetectionResult } from "src/barcodeReader/BarcodeReader";
import { Project } from "src/project.js";
import { onMounted, ref } from "vue";
import { useMeta } from 'quasar'
import { useRouter } from "vue-router";
import localForage from "localforage";
import { ConvertBarcodeResultsToGroundTruth, calculateEngineStatistics, dataURLtoBlob, getFilenameWithoutExtension, loadBarcodeReaderSettings, readFileAsDataURL, readFileAsText, removeProjectFiles, sleep } from "src/utils";
import JSZip from "jszip";
import { GroundTruth, PerformanceMetrics } from "src/definitions/definitions";

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
    label: 'Time (ms)',
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
  },
  {
    name: 'misdetected',
    required: true,
    label: 'Misdetected',
    align: 'left',
    field: 'misdetected',
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
const addAction = ref(false);
const exportAction = ref(false);
const showSettings = ref(false);
const barcodeReaderSettings = ref([] as any[]);
const progress = ref(0.5);
const progressLabel = ref("");
const decoding = ref(false);
const skipDetected = ref(true);
const statistics = ref({fileNumber:0,correctFilesNumber:0,barcodeNumber:0,accuracy:0,precision:0,averageTime:0} as PerformanceMetrics);
let hasToStop = false;
let imageFiles:File[] = [];
let detectionResultFiles:File[] = [];
let groundTruthFiles:File[] = [];
let projects:Project[] = [];
      
onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  const savedProjects = await localForage.getItem("projects");
  const supportedEngines = BarcodeReader.getEngines();
  engines.value = supportedEngines;
  if (supportedEngines.length>0) {
    selectedEngine.value = supportedEngines[0];
  }
  useMeta({
    // sets document title
    title: 'Barcode Reading Benchmark - '+ projectName.value,
  })
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

const updateRows = async (engine?:string) => {
  if (project) {
    const engineStatistics = await calculateEngineStatistics(project,engine ?? selectedEngine.value);
    statistics.value = engineStatistics.metrics;
    if (engineStatistics.rows) {
      rows.value = engineStatistics.rows;
    }
  }
}

const decode = async () => {
  console.log(selectedEngine.value);
  if (decoding.value === false) {
    decoding.value = true;
    hasToStop = false;
    await reinitializeReaderIfNeeded();
    await updateBarcodeReaderSettings();
    const length = project.info.images.length;
    progress.value = 0.0;
    progressLabel.value = "0/"+length;
    let detectionResultFileNamesList:string[]|null|undefined = await localForage.getItem(projectName.value+":detectionResultFileNamesList");
    if (!detectionResultFileNamesList) {
      detectionResultFileNamesList = [];
    }
    for (let index = 0; index < length; index++) {
      if (hasToStop) {
        await localForage.setItem(projectName.value+":detectionResultFileNamesList",detectionResultFileNamesList);
        return;
      }
      const imageName = project.info.images[index];
      if (skipDetected.value) {
        let detectedResult = await localForage.getItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName)+"-"+selectedEngine.value+".json");
        if (detectedResult) {
          continue;
        }
      }
      const dataURL:string|null|undefined = await localForage.getItem(projectName.value+":image:"+imageName);
      if (dataURL) {
        let decodingResult = await reader.detect(dataURL);
        console.log(decodingResult);
        const fileName = getFilenameWithoutExtension(imageName)+"-"+selectedEngine.value+".json";
        if (detectionResultFileNamesList.indexOf(fileName) === -1) {
          detectionResultFileNamesList.push(fileName);
        }
        await localForage.setItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName)+"-"+selectedEngine.value+".json",JSON.stringify(decodingResult));
      }
      progress.value = parseFloat(((index + 1) / length).toFixed(2));
      progressLabel.value = (index+1)+"/"+length;
    }
    await localForage.setItem(projectName.value+":detectionResultFileNamesList",detectionResultFileNamesList);
    decoding.value = false;
  }else{
    hasToStop = true;
    decoding.value = false;
  }
  updateRows();
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
      await localForage.setItem(projectName.value+":groundTruth:"+file.name,content);
    }
    let detectionResultFileNamesList:string[]|null|undefined = await localForage.getItem(projectName.value+":detectionResultFileNamesList");
    if (!detectionResultFileNamesList) {
      detectionResultFileNamesList = [];
    }
    for (let index = 0; index < detectionResultFiles.length; index++) {
      const file = detectionResultFiles[index];
      const content = await readFileAsText(file);
      if (detectionResultFileNamesList.indexOf(file.name) === -1) {
        detectionResultFileNamesList.push(file.name);
      }
      await localForage.setItem(projectName.value+":detectionResult:"+file.name,content);
    }
    for (let index = 0; index < imageFiles.length; index++) {
      const file = imageFiles[index];
      const dataURL = await readFileAsDataURL(file);
      await localForage.setItem(projectName.value+":image:"+file.name,dataURL);
      project.info.images.push(file.name);
    }
    await localForage.setItem(projectName.value+":detectionResultFileNamesList",detectionResultFileNamesList);
    updateRows();
    saveProjects();
    alert("added");
    addAction.value = false;
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
  addAction.value = true;
}

const clearProject = async () => {
  await removeProjectFiles(project);
  saveProjects();
  updateRows();
}

const exportProject = async () => {
  exportAction.value = true;
};

const downloadImages = async () => {
  for (let index = 0; index < project.info.images.length; index++) {
    const imageName = project.info.images[index];
    const dataURL:string|null|undefined = await localForage.getItem(projectName.value+":image:"+imageName);
    if (dataURL) {
      await sleep(1000);
      const blob = dataURLtoBlob(dataURL);
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob);
      link.download = imageName;
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
};

const downloadImagesAsZip = async () => {
  const zip = new JSZip();
  for (let index = 0; index < project.info.images.length; index++) {
    const imageName = project.info.images[index];
    const dataURL:string|null|undefined = await localForage.getItem(projectName.value+":image:"+imageName);
    if (dataURL) {
      console.log(imageName);
      const blob = dataURLtoBlob(dataURL);
      zip.file(imageName, blob);
    }
  }
  zip.generateAsync({type:"blob"}).then(function(content) {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content);
    link.download = projectName.value+"-images.zip";
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  });
};

const downloadTextResults = async () => {
  const zip = new JSZip();
  for (let index = 0; index < project.info.images.length; index++) {
    const imageName = project.info.images[index];
    const groundTruthFileName = getFilenameWithoutExtension(imageName)+".txt";
    const groundTruthString:string|null|undefined = await localForage.getItem(projectName.value+":groundTruth:"+getFilenameWithoutExtension(imageName)+".txt");
    if (groundTruthString) {
      zip.file(groundTruthFileName, groundTruthString);
    }
  }

  const detectionResultFileNamesList:string[]|null|undefined = await localForage.getItem(projectName.value+":detectionResultFileNamesList");
  if (detectionResultFileNamesList) {
    for (let index = 0; index < detectionResultFileNamesList.length; index++) {
      const detectionResultFileName = detectionResultFileNamesList[index];
      const detectionResultString:string|null|undefined = await localForage.getItem(projectName.value+":detectionResult:"+detectionResultFileName);
      if (detectionResultString) {
        zip.file(detectionResultFileName, detectionResultString);  
      }
    }
    zip.file("detection_result_filenames.json", JSON.stringify(detectionResultFileNamesList));
  }
  zip.file("project_manifest.json", JSON.stringify(project));
  await addSettingsFileToZip(zip);
  zip.generateAsync({type:"blob"}).then(function(content) {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content);
    link.download = projectName.value+"-results.zip";
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  });
};

const addSettingsFileToZip = async (zip:JSZip) => {
  for (let index = 0; index < engines.value.length; index++) {
    const engine = engines.value[index];
    const settings = await localForage.getItem(projectName.value+":settings:"+engine);
    if (settings) {
      zip.file(engine+"_settings.json", JSON.stringify(settings));
    }
  }
}

const nameClicked = (name:string) => {
  const href = "/project/"+encodeURIComponent(projectName.value)+"/"+encodeURIComponent(name)+"/"+selectedEngine.value;
  const routeUrl = router.resolve(href);
  window.open(routeUrl.href,'_blank');
}

const selectedEngineChanged = (engine:string) => {
  updateRows(engine);
}

const goToComparisonPage = () => {
  const href = "/project/"+encodeURIComponent(projectName.value)+"/comparison";
  const routeUrl = router.resolve(href);
  window.open(routeUrl.href,'_blank');
}

const goToLiveScannerPage = () => {
  const href = "/project/"+encodeURIComponent(projectName.value)+"/livescanner";
  const routeUrl = router.resolve(href);
  window.open(routeUrl.href,'_blank');
}

const showSettingsModal = async () => {
  await reinitializeReaderIfNeeded();
  const settingsItems = reader.getSupportedSettings();
  if (settingsItems.length>0) {
    console.log(settingsItems);
    showSettings.value = true;
    loadSettings(settingsItems);
  }else{
    alert("This engine does not have settings.");
  }
}

const reinitializeReaderIfNeeded = async () => {
  let needInitialization = false;
  if (!reader) {
    needInitialization = true;
  }else{
    if (reader.getEngine() != selectedEngine.value) {
      needInitialization = true;
    }
  }
  if (needInitialization) {
    progressLabel.value = "Initializing...";
    reader = await BarcodeReader.createInstance(selectedEngine.value);
    progressLabel.value = "";
  }
}

const loadSettings = async (settingsItems:string[]) => {
  const items = await loadBarcodeReaderSettings(projectName.value,selectedEngine.value,settingsItems);
  barcodeReaderSettings.value = items;
}

const saveSettings = async () => {
  const settings = [];
  for (let index = 0; index < barcodeReaderSettings.value.length; index++) {
    const setting = barcodeReaderSettings.value[index];
    const item:any = {};
    item.name = setting.name;
    item.value = setting.value;
    settings.push(item);
  }
  await localForage.setItem(projectName.value+":settings:"+selectedEngine.value,settings);
}

const updateBarcodeReaderSettings = async () => {
  await reader.setSupportedSettings(barcodeReaderSettings.value);
}

const convertDetectedResultsToGroundTruth = async () => {
  const length = project.info.images.length;
  for (let index = 0; index < length; index++) {
    const imageName = project.info.images[index];
    const detectionResultString:undefined|null|string = await localForage.getItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName)+"-"+selectedEngine.value+".json");
    if (detectionResultString) {
      const detectionResult:DetectionResult = JSON.parse(detectionResultString);
      const groundTruthList:GroundTruth[] = ConvertBarcodeResultsToGroundTruth(detectionResult.results);
      await localForage.setItem(projectName.value+":groundTruth:"+getFilenameWithoutExtension(imageName)+".txt",JSON.stringify(groundTruthList));
    }
  }
  updateRows();
}

</script>

<style>
.text {
  max-width: 150px;
  max-height: 150px;
  white-space: break-spaces !important;
  overflow: auto;
}

.filename {
  text-decoration: underline;
  cursor: pointer;
}
</style>