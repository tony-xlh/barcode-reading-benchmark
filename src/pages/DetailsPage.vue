<template>
  <div class="q-pa-md example-row-equal-width">
    <div class="row">
      <div class="col">
        <div style="padding-bottom: 20px;">
          <q-select @update:model-value="selectedEngineChanged($event)" style="max-width: 300px" v-model="selectedEngine" :options="engines" label="Engine" />
        </div>
        <div>
          <q-btn outline color="primary" label="Decode" v-on:click="decode" />
          <q-checkbox v-model="saveDetectionResults" label="Save Detection Results" />
          <span style="padding-left:10px;">{{ status }}</span>
        </div>
        <div>
          <q-checkbox v-model="showDetectionResults" label="Show Detection Results" />
        </div>
        <div>
          <q-checkbox v-model="showGroundTruth" label="Show Ground Trurh" />
        </div>
        <div class="row">
          <div class="col">
            Barcode Results:
            <q-list bordered class="rounded-borders">
              <q-expansion-item :class="(incorrectDetectionResultIndex.indexOf(index) != -1)?'incorrect':'correct'" v-for="(barcodeResult,index) in barcodeResults" switch-toggle-side dense-toggle :label="index.toString()+': '+barcodeResult.barcodeText" v-bind:key="index">
                <pre>
{{ JSON.stringify(barcodeResult,null,4) }}
                </pre>
              </q-expansion-item>
            </q-list>
          </div>
          <div class="col">
            Ground Truth:
            <q-list bordered class="rounded-borders">
              <q-expansion-item v-for="(groundTruth,index) in groundTruthList" switch-toggle-side dense-toggle :label="index.toString()+': '+groundTruth.text" v-bind:key="index">
                <pre>
{{ JSON.stringify(groundTruth,null,4) }}
                </pre>
              </q-expansion-item>
            </q-list>
          </div>
        </div>
      </div>
      <div class="col">
        <div style="max-height:500px;overflow:auto;">
          <svg
            :viewBox="viewBox"
            class="overlay"
          >
            <image :href="dataURL"></image>
            <a v-if="showDetectionResults">
              <polygon v-bind:key="'polygon'+index" v-for="(barcodeResult,index) in barcodeResults"
                :points="getPointsData(barcodeResult)"
                class="barcode-polygon"
              >
                <title>{{ barcodeResult.barcodeFormat + ": " + barcodeResult.barcodeText }}</title>
              </polygon>
            </a>
            <a v-if="showGroundTruth">
              <polygon v-bind:key="'polygon'+index" v-for="(groundTruth,index) in groundTruthList"
                :points="getPointsData(groundTruth)"
                class="groundtruth-polygon"
              >
                <title>{{ groundTruth.attrib.Type + ": " + groundTruth.text }}</title>
              </polygon>
            </a>
          </svg>
        </div>
        <div>
          <a href="javascript:void();" @click="downloadImage()">Download</a>
        </div>
      </div>
    </div>
    <div class="row">
      <q-btn outline color="red" label="Delete this image" v-on:click="deleteThisImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarcodeReader, BarcodeResult, DetectionResult } from "src/barcodeReader/BarcodeReader";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import localForage from "localforage";
import { dataURLtoBlob, getFilenameWithoutExtension, getPointsFromBarcodeResultResult, getPointsFromGroundTruth, intersectionOverUnion, loadBarcodeReaderSettings, textCorrect } from "src/utils";
import { GroundTruth } from "src/definitions/definitions";
import { Project } from "src/project";
import { useMeta } from "quasar";
const router = useRouter();
const projectName = ref("");
const imageName = ref("");
const selectedEngine = ref("");
const engines = ref([] as string[])
const viewBox = ref("0 0 0 0")
const dataURL = ref("");
const barcodeResults = ref([] as BarcodeResult[]);
const groundTruthList = ref([] as GroundTruth[]);
const showDetectionResults = ref(true);
const showGroundTruth = ref(true);
const saveDetectionResults = ref(false);
const status = ref("");
const incorrectDetectionResultIndex = ref([] as number[]);
let reader: BarcodeReader;

onMounted(() => {
  projectName.value = router.currentRoute.value.params.name as string;
  imageName.value = router.currentRoute.value.params.imageName as string;
  selectedEngine.value = router.currentRoute.value.params.engine as string;
  const supportedEngines = BarcodeReader.getEngines();
  engines.value = supportedEngines;
  useMeta({
    // sets document title
    title: 'Barcode Reading Benchmark - '+ projectName.value + ' - ' + imageName.value,
  })
  loadImage();
  loadBarcodeResultsAndGroundTruth();
});

const loadImage = async () => {
  const imageDataURL:string|null|undefined = await localForage.getItem(projectName.value+":image:"+imageName.value);
  if (imageDataURL) {
    let img = new Image();
    img.src = imageDataURL;
    img.onload = function(){
      viewBox.value= "0 0 "+img.width+" "+img.height;
      dataURL.value = imageDataURL;
    }
  }
}

const loadBarcodeResultsAndGroundTruth = async (engine?:string,detectionResult?:DetectionResult) => {
  let selectedEngineName;
  if (engine) {
    selectedEngineName = engine;
  }else{
    selectedEngineName = selectedEngine.value;
  }
  if (detectionResult) {
    barcodeResults.value = detectionResult.results;
  }else{
    const detectionResultString:string|null|undefined = await localForage.getItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName.value)+"-"+selectedEngineName+".json");
    let detectionResult:DetectionResult;
    if (detectionResultString) {
      detectionResult = JSON.parse(detectionResultString);
      barcodeResults.value = detectionResult.results;
    }else{
      barcodeResults.value = [];
    }
  }
  const groundTruthString:string|null|undefined = await localForage.getItem(projectName.value+":groundTruth:"+getFilenameWithoutExtension(imageName.value)+".txt");
  let parsedGroundTruth;
  if (groundTruthString) {
    parsedGroundTruth = JSON.parse(groundTruthString);
    groundTruthList.value = parsedGroundTruth;
  }

  if (detectionResult && groundTruthString) {
    findOutIncorrectDetectionResults(detectionResult.results,parsedGroundTruth);
  }
}

const getPointsData = (result:BarcodeResult|GroundTruth) => {
  let pointsData = result.x1 + "," + result.y1 + " ";
  pointsData = pointsData + result.x2+ "," + result.y2 + " ";
  pointsData = pointsData + result.x3+ "," + result.y3 + " ";
  pointsData = pointsData + result.x4+ "," + result.y4;
  return pointsData;
}

const decode = async () => {
  let needInitialization = false;
  if (!reader) {
    needInitialization = true;
  }else{
    if (reader.getEngine() != selectedEngine.value) {
      needInitialization = true;
    }
  }
  if (needInitialization) {
    status.value = "Initializing...";
    reader = await BarcodeReader.createInstance(selectedEngine.value);
    status.value = "";
  }
  await updateBarcodeReaderSettings();
  const dataURL:string|null|undefined = await localForage.getItem(projectName.value+":image:"+imageName.value);
  if (dataURL) {
    status.value = "Decoding...";
    let decodingResult = await reader.detect(dataURL);
    status.value = "";
    console.log(decodingResult);
    barcodeResults.value = decodingResult.results;
    if (saveDetectionResults.value === true) {
      await localForage.setItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName.value)+"-"+selectedEngine.value+".json",JSON.stringify(decodingResult));
    }
    loadBarcodeResultsAndGroundTruth(selectedEngine.value,decodingResult);
  }
}

const updateBarcodeReaderSettings = async () => {
  const settings = await loadBarcodeReaderSettings(projectName.value,selectedEngine.value,reader.getSupportedSettings());
  console.log(settings);
  await reader.setSupportedSettings(settings);
}

const findOutIncorrectDetectionResults = (barcodeResultList:BarcodeResult[],groundTruthList:GroundTruth[]) => {
  let index:number[] = [];
  for (let i = 0; i < barcodeResultList.length; i++) {
    const barcodeResult = barcodeResultList[i];
    let hasCorrectResult = false;
    for (let j = 0; j < groundTruthList.length; j++) {
      const groundTruth = groundTruthList[j];
      const points1 = getPointsFromBarcodeResultResult(barcodeResult);
      const points2 = getPointsFromGroundTruth(groundTruth);
      const IoU = intersectionOverUnion(points1,points2);
      if (IoU > 0) {
        if (groundTruth.text) {
          if (!textCorrect(groundTruth,barcodeResult)) {
            index.push(i);
          }else{
            hasCorrectResult = true;
          }
        }
        continue;
      }
      if (j === groundTruthList.length - 1 && hasCorrectResult === false) {
        index.push(i);
      }
    }
  }
  incorrectDetectionResultIndex.value = index;
}

const selectedEngineChanged = (value:string) => {
  loadBarcodeResultsAndGroundTruth(value);
}

const deleteThisImage = async () => {
  localForage.removeItem(projectName.value+":image:"+imageName.value);
  localForage.removeItem(projectName.value+":groundTruth:"+getFilenameWithoutExtension(imageName.value)+".txt");
  const savedProjects = await localForage.getItem("projects");
  if (savedProjects) {
    const projects:Project[] = JSON.parse(savedProjects as string);
    for (let i = 0; i < projects.length; i++) {
      if (projects[i].info.name === projectName.value) {
        const project = projects[i];
        const newImages = [];
        for (let j = 0; j < project.info.images.length; j++) {
          const name = project.info.images[j];
          if (name != imageName.value) { //skip the current image
            newImages.push(name);
          }
        }
        project.info.images = newImages;
      }
    }
    await localForage.setItem("projects", JSON.stringify(projects));
    alert("deleted");
  }
}

const downloadImage = () => {
  const blob = dataURLtoBlob(dataURL.value);
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob);
  link.download = imageName.value;
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

</script>
<style>
.q-item {
  padding: 0px;
}
.q-item__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
pre {
  padding: 5px;
  margin: 0;
  white-space: break-spaces;
  word-wrap: break-word;
}
.barcode-polygon {
  fill:rgba(85,240,40,0.5);
  stroke:green;
  stroke-width:7;
}

.barcode-polygon:hover {
  fill:rgba(85,240,40,0.6);
  stroke:green;
  stroke-width:7;
}

.groundtruth-polygon {
  fill:rgba(208, 240, 91, 0.2);
  stroke:green;
  stroke-width:5;
}

.groundtruth-polygon:hover {
  fill:rgba(208, 240, 91, 0.3);
  stroke:green;
  stroke-width:5;
}

.incorrect {
  background: rgba(255, 0, 0, 0.5);
}
</style>
