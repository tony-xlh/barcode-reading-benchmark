<template>
  <div class="q-pa-md" style="width: 100%">
    <q-select @update:model-value="selectedEngineChanged($event)" style="max-width: 300px" v-model="selectedEngine" :options="engines" label="Engine" />
    <div>
      <q-btn outline color="primary" :label="scanning?'Stop Scanning':'Start Scanning'" v-on:click="toggleScanning" />
      <span style="padding-left:10px;">{{ status }}</span>
    </div>
    <div id="results">
      <pre>
{{ scannedResults }}
      </pre>
    </div>
    <div>
      <div id="enhancerUIContainer" style="width:100%;height:500px;" :class="scanning?'':'hidden'"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarcodeReader, DetectionResult } from "src/barcodeReader/BarcodeReader";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { CameraEnhancer } from 'dynamsoft-camera-enhancer';
import { loadBarcodeReaderSettings } from 'src/utils';
const selectedEngine = ref("");
const engines = ref([] as string[])
const router = useRouter();
const status = ref("");
const scanning = ref(false);
const scannedResults = ref();
const projectName = ref("");
let processing = false;
let reader: BarcodeReader;
let camera: CameraEnhancer;
let interval: any;

onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  const supportedEngines = BarcodeReader.getEngines();
  engines.value = supportedEngines;
  selectedEngine.value = supportedEngines[0];
  initDCE();
});

const updateBarcodeReaderSettings = async () => {
  const settings = await loadBarcodeReaderSettings(projectName.value,selectedEngine.value,reader.getSupportedSettings());
  await reader.setSupportedSettings(settings);
}

const toggleScanning = async () => {
  stopProcessingLoop();
  if (camera) {
    if (camera.isOpen() === false) {
      status.value = "Starting...";
      await camera.open(true);
      scanning.value = true;
      status.value = "";
    }else{
      camera.close(true);
      scanning.value = false;
    }
    return;
  }
  scanning.value = false;
}

const onPlayed = () => {
  startProcessingLoop();
}

const initDCE = async () => {
  status.value = "Initializing Camera...";
  CameraEnhancer.defaultUIElementURL = "https://cdn.jsdelivr.net/npm/dynamsoft-camera-enhancer@3.3.4/dist/dce.ui.html";
  camera = await CameraEnhancer.createInstance();
  camera.on("played",onPlayed);
  await camera.setUIElement(CameraEnhancer.defaultUIElementURL);
  document.getElementById("enhancerUIContainer")?.appendChild(camera.getUIElement());
  document.getElementsByClassName("dce-btn-close")[0].remove();
  status.value = "";
}

const startProcessingLoop = () => {
  stopProcessingLoop();
  interval = setInterval(decode,200);
}

const stopProcessingLoop = () => {
  processing = false;
  clearInterval(interval);
}

const decode = async () => {
  if (camera && processing === false) {
    processing = true;
    let needInitialization = false;
    if (!reader) {
      needInitialization = true;
    }else{
      if (reader.getEngine() != selectedEngine.value) {
        needInitialization = true;
      }
    }
    if (needInitialization) {
      status.value = "Initializing Barcode Reader...";
      reader = await BarcodeReader.createInstance(selectedEngine.value);
      await updateBarcodeReaderSettings();
      status.value = "";
    }
    const cvs = camera.getFrame().toCanvas();
    const detectionResult = await reader.detect(cvs);
    status.value = detectionResult.elapsedTime + "ms";
    updateScannedResults(detectionResult);
    processing = false;
  }
}

const updateScannedResults = (detectionResult:DetectionResult) => {
  if (detectionResult.results.length>0) {
    let text = "";
    for (let index = 0; index < detectionResult.results.length; index++) {
      const result = detectionResult.results[index];
      text = text + (index+1) + ". " + result.barcodeFormat + ": " + result.barcodeText + "\n";
    }
    scannedResults.value = text;
  }
}

const selectedEngineChanged = (engine:string) => {
  if (interval && camera.isOpen()) {
    stopProcessingLoop();
    startProcessingLoop();
  }  
}

</script>
<style scoped>
.hidden {
  display: none;
}

#results {
  overflow: auto;
  height: 120px;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
  background:lightgray;
  border: 1px solid black;
}
</style>