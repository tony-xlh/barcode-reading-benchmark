<template>
  <div class="q-pa-md" style="width: 100%">
    <div>
      <label style="font-size: 16px;">Engines:</label>
    </div>
    <div class="row" style="padding-bottom: 20px;">
      <select @update:model-value="selectedEngineChanged($event)" style="min-width: 200px" v-model="selectedEngine">
        <option v-for="engine in engines" :value="engine" v-bind:key="engine">
          {{ engine }}
        </option>
      </select>
    </div>
    <div>
      <dynamsoft-button :label="scanning?'Stop Scanning':'Start Scanning'" @click="toggleScanning"/>
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
import DynamsoftButton from "src/components/DynamsoftButton.vue";
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
  let settings = await loadBarcodeReaderSettings(projectName.value,selectedEngine.value,reader.getSupportedSettings());
  if (selectedEngine.value === "Dynamsoft") {
    let hasDBRTemplate = false;
    for (let index = 0; index < settings.length; index++) {
      const setting = settings[index];
      if (setting.name === "template") {
        if (setting.value) {
          hasDBRTemplate = true;
        }
      }
    }
    if (hasDBRTemplate === false) {
      settings.push({name:"template",value:"speed"});
    }
  }
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
  clearInterval(interval);
  processing = false;
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
    const frame = camera.getFrame();
    const detectionResult = await reader.detect(frame);
    status.value = detectionResult.elapsedTime + "ms";
    if (reader.getEngine() === selectedEngine.value) {
      updateScannedResults(detectionResult);
    }
    processing = false;
  }
}

const updateScannedResults = (detectionResult:DetectionResult) => {
  if (detectionResult.results.length>0) {
    let text = "";
    for (let index = 0; index < detectionResult.results.length; index++) {
      const result = detectionResult.results[index];
      text = text + (index+1) + ". " + result.barcodeFormat + ": " + result.barcodeText;
      if (result.confidence) {
        text = text + ", confidence: "+result.confidence;
      }
      text = text + "\n";
    }
    scannedResults.value = text;
  }
}

const selectedEngineChanged = (engine:string) => {
  if (interval && camera.isOpen()) {
    stopProcessingLoop();
    startProcessingLoop();
  }
  scannedResults.value = "";
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