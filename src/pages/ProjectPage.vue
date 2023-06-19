<template>
  <q-page>
    <div class="full">
      <div class="header">
        <div class="text-h6 fontOswald">{{projectName}}</div>
        <div class="flex-container">
          <dynamsoft-button style="margin-left:15px;" secondary label="Go to Comparison Page" @click="goToComparisonPage"/>
        </div>
        <dynamsoft-button outline style="color:black;border-color:black;background-color: #fff;" label="Export" @click="exportProject"/>
      </div>
      <div class="container">
        <div class="overview">
          <div class="statistics">
            <div class="row">
              <div class="col-12 col-md statistics-values">
                <div>
                  <div class="statistics-name">Total files: </div>
                  <div class="statistics-value">{{ statistics.fileNumber }}</div>
                </div>
                <div>
                  <div class="statistics-name">Total barcodes: </div><div class="statistics-value">{{ statistics.barcodeNumber }}</div>
                </div>
                <div>
                  <div class="statistics-name">Correctly detected files: </div>
                  <div class="statistics-value">{{ statistics.correctFilesNumber }}</div>
                </div>
                <div>
                  <div class="statistics-name">Rate of detected files: </div>
                  <div class="statistics-value">{{ statistics.detectedFilesRate }}%</div>
                </div>
                <div>
                  <div class="statistics-name">Detected barcodes:  </div>
                  <div class="statistics-value">{{  parseInt((statistics.accuracy / 100 * statistics.barcodeNumber).toString()) }}</div>
                </div>
                <div>
                  <div class="statistics-name">Misdetected barcodes:  </div>
                  <div class="statistics-value">{{ parseInt(((1 - statistics.precision / 100) * statistics.barcodeNumber).toString()) }}</div>
                </div>
                <div>
                  <div class="statistics-name">Average time (ms): </div>
                  <div class="statistics-value">{{statistics.averageTime}}</div>
                </div>
              </div>
              <div class="col-12 col-md statistics-charts">
                <div class="row">
                  <div class="col statistics-chart">
                    Accuracy:
                    <q-circular-progress
                      show-value
                      font-size="12px"
                      :value="statistics.accuracy"
                      size="60px"
                      :thickness="0.22"
                      color="orange"
                      track-color="grey-3"
                      class="q-ma-md"
                    >
                      {{ statistics.accuracy }}%
                    </q-circular-progress>
                  </div>
                  <div class="col statistics-chart">
                  Precision:
                  <q-circular-progress
                    show-value
                    font-size="12px"
                    :value="statistics.precision"
                    size="60px"
                    :thickness="0.22"
                    color="orange"
                    track-color="grey-3"
                    class="q-ma-md"
                  >
                    {{ statistics.precision }}%
                  </q-circular-progress>
                </div>
                </div>
               
              </div>
            </div>
          </div>
          <div class="decoding">
            <div>
              <label style="font-size: 16px;">Engines:</label>
            </div>
            <div class="row" style="padding-bottom: 20px;">
              <select style="min-width: 200px; height:45px;" @update:model-value="selectedEngineChanged($event)" v-model="selectedEngineDisplayName">
                <option v-for="config in barcodeReaderConfigs" :value="config.displayName" v-bind:key="config.displayName">
                  {{ config.displayName }}
                </option>
              </select>
            </div>
            <div class="row" style="align-items: center;">
              <dynamsoft-button :label="decoding ? 'Stop Decoding':'Start Decoding'" v-on:click="decode"></dynamsoft-button>
              <q-checkbox color="orange" style="padding-left: 10px;" left-label v-model="skipDetected" label="Skip Detected" />
            </div>
            <div v-if="decoding" style="width:100px;">
              <q-linear-progress size="25px" :value="progress" color="orange">
              <div class="absolute-full flex flex-center">
                <q-badge color="white" text-color="black" :label="progressLabel" />
              </div>
              </q-linear-progress>
            </div>
          </div>
        </div>
        <div style="margin-top:2em;margin-bottom:2em;">
          <q-table
            title="Images"
            color="black"
            table-header-style="background:#f5f5f5;"
            :rows="rows"
            :columns="columns"
            row-key="name"
          >
            <template v-slot:top-right>
              <q-btn-dropdown unelevated color="black" label="Action">
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
        </div>
      </div>
    </div>
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
            <div>
              <input type="file" id="zipFile" v-on:change="loadZip($event);" accept=".zip" />
              <label for="zipFile">Zip with images and text results.</label>
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
      <q-dialog v-model="showDownloadDialog" persistent transition-show="scale" transition-hide="scale">
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">Downloading project data...</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            Please wait for a while.
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { BarcodeReader, BarcodeReaderConfig, DetectionResult, Setting } from "src/barcodeReader/BarcodeReader";
import { Project } from "src/project.js";
import { onMounted, ref } from "vue";
import { useMeta } from 'quasar'
import { useRouter } from "vue-router";
import localForage from "localforage";
import { ConvertBarcodeResultsToGroundTruth, calculateEngineStatistics, dataURLtoBlob, getFilenameWithoutExtension, loadProjectBarcodeReaderConfigs, readFileAsDataURL, readFileAsText, removeProjectFiles, sleep } from "src/utils";
import JSZip from "jszip";
import { GroundTruth, PerformanceMetrics } from "src/definitions/definitions";
import DynamsoftButton from "src/components/DynamsoftButton.vue";
import { loadTextResultsFromZip, textResultsImported } from "src/projectUtils";
import { base64Decode } from "encoding-japanese";

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
const router = useRouter();
const projectName = ref("");
const selectedEngineDisplayName = ref("");
const barcodeReaderConfigs = ref([] as BarcodeReaderConfig[]);
const addAction = ref(false);
const exportAction = ref(false);
const progress = ref(0.5);
const progressLabel = ref("");
const decoding = ref(false);
const skipDetected = ref(true);
const statistics = ref({fileNumber:0,correctFilesNumber:0,barcodeNumber:0,accuracy:0,precision:0,averageTime:0} as PerformanceMetrics);
const showDownloadDialog = ref(false);
let hasToStop = false;
let imageFiles:File[] = [];
let detectionResultFiles:File[] = [];
let groundTruthFiles:File[] = [];
let zipFile:File|undefined;
let projects:Project[] = [];
      
onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  await loadConfigs(router.currentRoute.value.params.name as string);
  const savedProjects = await localForage.getItem("projects");
  useMeta({
    // sets document title
    title: 'Barcode Reading Benchmark - '+ projectName.value,
  })
  if (savedProjects) {
    projects = JSON.parse(savedProjects as string);
    for (let index = 0; index < projects.length; index++) {
      if (projects[index].info.name === projectName.value) {
        project = projects[index];
        break;
      }
    }
  }
  if (!project) {
    await downloadProjectFilesIfNeeded();
  }else{
    if (project.isRemote) {
      const results:any = await localForage.getItem(project.info.name+":results.zip");
      const imported = await textResultsImported(project);
      if (!results || !imported || project.info.images.length === 0) {
        await downloadProjectFilesIfNeeded();
      }
    }
  }
  updateRows();
});

const loadConfigs = async (projectName:string) => {
  const configs = await loadProjectBarcodeReaderConfigs(projectName);
  barcodeReaderConfigs.value = configs;
  if (configs.length>0) {
    selectedEngineDisplayName.value = configs[0].displayName;
  }
}

const updateRows = async (displayName?:string) => {
  if (project) {
    const engineStatistics = await calculateEngineStatistics(project,displayName ?? selectedEngineDisplayName.value);
    statistics.value = engineStatistics.metrics;
    if (engineStatistics.rows) {
      rows.value = engineStatistics.rows;
    }
  }
}

const decode = async () => {
  let selectedBarcodeReaderConfig = getSelectedBarcodeReaderConfig();
  if (decoding.value === false && selectedBarcodeReaderConfig) {
    decoding.value = true;
    hasToStop = false;
    await reinitializeReaderIfNeeded();
    await updateBarcodeReaderSettings(selectedBarcodeReaderConfig);
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
        let detectedResult = await localForage.getItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName)+"-"+selectedEngineDisplayName.value+".json");
        if (detectedResult) {
          continue;
        }
      }
      const dataURL:string|null|undefined = await localForage.getItem(projectName.value+":image:"+imageName);
      if (dataURL) {
        let decodingResult = await reader.detect(dataURL);
        console.log(decodingResult);
        const fileName = getFilenameWithoutExtension(imageName)+"-"+selectedEngineDisplayName.value+".json";
        if (detectionResultFileNamesList.indexOf(fileName) === -1) {
          detectionResultFileNamesList.push(fileName);
        }
        await localForage.setItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName)+"-"+selectedEngineDisplayName.value+".json",JSON.stringify(decodingResult));
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

const loadZip = (e:any) => {
  zipFile = e.target.files[0];
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
    await addFilesToProjectFromZip();
    updateRows();
    saveProjects();
    alert("added");
    addAction.value = false;
  }
}

const addFilesToProjectFromZip = async () => {
  if (project && zipFile) {
    const buffer = await zipFile.arrayBuffer();
    const zip = new JSZip();
    await zip.loadAsync(buffer);
    const files = zip.files;
    const filenames = Object.keys(files);
    
    const groundTruthList = [];
    const imageList = [];
    const detectionResultList = [];
    for (let index = 0; index < filenames.length; index++) {
      const filename = filenames[index];
      const lowerCase = filename.toLowerCase();
      const file = files[filename];
      if (file.dir === false) {
        if (lowerCase.endsWith(".jpg") || lowerCase.endsWith(".jpeg") || lowerCase.endsWith(".png") || lowerCase.endsWith(".bmp")) {
          imageList.push(file);
        }else if (lowerCase.endsWith(".txt")) {
          groundTruthList.push(file);
        }else if (lowerCase.endsWith(".json")) {
          detectionResultList.push(file);
        } 
      }
    }
    for (let index = 0; index < groundTruthList.length; index++) {
      const file = groundTruthList[index];
      const content = await file.async("string");
      await localForage.setItem(projectName.value+":groundTruth:"+file.name,content);
    }
    let detectionResultFileNamesList:string[]|null|undefined = await localForage.getItem(projectName.value+":detectionResultFileNamesList");
    if (!detectionResultFileNamesList) {
      detectionResultFileNamesList = [];
    }
    for (let index = 0; index < detectionResultList.length; index++) {
      const file = detectionResultList[index];
      const content = await file.async("string");
      if (detectionResultFileNamesList.indexOf(file.name) === -1) {
        detectionResultFileNamesList.push(file.name);
      }
      await localForage.setItem(projectName.value+":detectionResult:"+file.name,content);
    }
    for (let index = 0; index < imageList.length; index++) {
      const file = imageList[index];
      const base64 = await file.async("base64");
      const dataURL = addDataURLHead(base64,file.name);
      await localForage.setItem(projectName.value+":image:"+file.name,dataURL);
      project.info.images.push(file.name);
    }
    await localForage.setItem(projectName.value+":detectionResultFileNamesList",detectionResultFileNamesList);
  }
}

const addDataURLHead = (base64:string,filename:string) => {
  const lowCase = filename.toLowerCase();
  if (lowCase.endsWith(".jpg") || lowCase.endsWith(".jpeg")) {
    return "data:image/jpeg;base64,"+base64;
  }else if (lowCase.endsWith(".bmp")) {
    return "data:image/bmp;base64,"+base64;
  }else if (lowCase.endsWith(".bmp")) { 
    return "data:image/png;base64,"+base64;
  }
  return "data:image/jpeg;base64,"+base64;
}

const saveProjects = async () => {
  let projectsToSave:Project[] = [];
  projects.forEach(project => {
    projectsToSave.push(project);
  });
  await localForage.setItem("projects", JSON.stringify(projectsToSave));
}

const showLocalFilesDialog = () => {
  resetFiles();
  addAction.value = true;
}

const resetFiles = () => {
  zipFile = undefined;
  imageFiles = [];
  detectionResultFiles = [];
  groundTruthFiles = [];
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
  zip.file("settings.json", JSON.stringify(barcodeReaderConfigs.value));
}

const nameClicked = (name:string) => {
  const href = "/project/"+encodeURIComponent(projectName.value)+"/"+encodeURIComponent(name)+"/"+selectedEngineDisplayName.value;
  const routeUrl = router.resolve(href);
  window.open(routeUrl.href,'_blank');
}

const selectedEngineChanged = (displayName:string) => {
  updateRows(displayName);
}

const goToComparisonPage = () => {
  const href = "/project/"+encodeURIComponent(projectName.value)+"/comparison";
  router.push(href);
}

const goToLiveScannerPage = () => {
  const href = "/project/"+encodeURIComponent(projectName.value)+"/livescanner";
  const routeUrl = router.resolve(href);
  window.open(routeUrl.href,'_blank');
}

const getSelectedBarcodeReaderConfig = (displayName?:string) => {
  let name;
  if (displayName) {
    name = displayName;
  }else{
    name = selectedEngineDisplayName.value;
  }
  for (const config of barcodeReaderConfigs.value) {
    if (config.displayName === name) {
      return config;
    }
  }
  return undefined;
}

const reinitializeReaderIfNeeded = async () => {
  let selectedBarcodeReaderConfig = getSelectedBarcodeReaderConfig();
  if (selectedBarcodeReaderConfig) {
    let needInitialization = false;
    if (!reader) {
      needInitialization = true;
    }else{
      if (reader.getEngine() != selectedBarcodeReaderConfig.engine) {
        needInitialization = true;
      }
    }
    if (needInitialization) {
      progressLabel.value = "Initializing...";
      reader = await BarcodeReader.createInstance(selectedBarcodeReaderConfig.engine);
      progressLabel.value = "";
    }
  }
}

const updateBarcodeReaderSettings = async (config:BarcodeReaderConfig) => {
  console.log("updateBarcodeReaderSettings");
  console.log(config);
  await reader.setSupportedSettings(config.settings);
}

const convertDetectedResultsToGroundTruth = async () => {
  const length = project.info.images.length;
  for (let index = 0; index < length; index++) {
    const imageName = project.info.images[index];
    const detectionResultString:undefined|null|string = await localForage.getItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName)+"-"+selectedEngineDisplayName.value+".json");
    if (detectionResultString) {
      const detectionResult:DetectionResult = JSON.parse(detectionResultString);
      const groundTruthList:GroundTruth[] = ConvertBarcodeResultsToGroundTruth(detectionResult.results);
      await localForage.setItem(projectName.value+":groundTruth:"+getFilenameWithoutExtension(imageName)+".txt",JSON.stringify(groundTruthList));
    }
  }
  updateRows();
}

const downloadProjectFilesIfNeeded = async () => {
  showDownloadDialog.value = true;
  const name = projectName.value;
  try {
    const resp = await fetch("./dataset/"+name+"/project_manifest.json");
    const text = await resp.text();
    const projectObj = JSON.parse(text);
    projectObj.isRemote = true;
    const resultsResp = await fetch ("./dataset/"+name+"/results.zip");
    const blob = await resultsResp.blob();
    if (blob.size>0) {
      await localForage.setItem(name+":results.zip",blob);
    }
    await loadTextResultsFromZip(projectObj);
    let savedProjects:Project[];
    let savedString:undefined|null|string = await localForage.getItem("projects");
    if (savedString) {
      savedProjects = JSON.parse(savedString);
    }else{
      savedProjects = [];
    }
    let newProjects:Project[] = [];
    let added = false;
    for (let index = 0; index < savedProjects.length; index++) {
      const p = savedProjects[index];
      if (p.info.name === projectObj.info.name) {
        newProjects.push(projectObj); //the projectObj is newer than the object stored in the value
        added = true;
      }else{
        newProjects.push(p);
      }
    }
    if (added === false) {
      newProjects.push(projectObj);
    }
    await localForage.setItem("projects", JSON.stringify(newProjects));
    project = projectObj;
    await loadConfigs(name);
  } catch (error) {
    console.log(error);
  }
  showDownloadDialog.value = false;
}

</script>

<style>
.full {
  width:100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.container {
  width: 100%;
  padding-left: 30px;
  padding-right: 30px;
}

.flex-container {
  flex: 1;
}

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

.statistics {
  flex-grow: 1;
  flex-basis: 66%;
}

.decoding {
  flex-grow: 1;
  flex-basis: 34%;
}

.statistics-name {
  width:70%;
  text-align: right;
  display: inline-block;
}

.statistics-value {
  display: inline-block;
  width:calc(30% - 10px);
  text-align: left;
  margin-left: 5px;
  font-weight: bold;
}

.statistics-values {
  padding:1em;
  height: 100%;
  width: 100%;
  text-align: center;
  background: #EEEEEE;
}

.statistics-charts {
  padding:1em;
  height: 100%;
  width: 100%;
  display: flex;
  background: #F5F5F5;
  align-items: center;
  justify-content: center;
}

.statistics-chart {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.decoding {
  padding-left: 2em;
}

@media screen and (max-device-width: 600px){
  .decoding {
    padding-left: 0px;
  }
}

.q-table__top {
  background: #eeeeee;
}

.overview {
  display: flex;
  flex-wrap: wrap;
}
</style>