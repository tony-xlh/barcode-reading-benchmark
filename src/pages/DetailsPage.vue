<template>
  <div class="q-pa-md example-row-equal-width">
    <div class="row">
      <div class="col-12 col-md" style="padding-right:10px;">
        <div>
          <label style="font-size: 16px;">Engines:</label>
        </div>
        <div class="row" style="padding-bottom: 20px;">
          <select v-model="selectedEngineDisplayName" @update:model-value="selectedEngineChanged($event)" style="min-width: 200px">
            <option v-for="config in barcodeReaderConfigs" :value="config.displayName" v-bind:key="'engine-'+config.displayName">
              {{ config.displayName }}
            </option>
          </select>
        </div>
        <div>
          <dynamsoft-button label="Decode" v-on:click="decode"></dynamsoft-button>
          <q-checkbox v-model="saveDetectionResults" label="Save Detection Results" />
          <span style="padding-left:10px;">{{ status }}</span>
        </div>
        <div>
          <q-checkbox style="margin-right:5px;" color="orange" v-model="showDetectionResults" label="Show Detection Results" />
          <q-checkbox color="orange" v-model="showGroundTruth" label="Show Ground Trurh" />
        </div>
        <div class="row results">
          <div class="col list">
            <div class="list-header">
              Barcode Results:
            </div>
            <q-list bordered class="rounded-borders">
              <q-expansion-item :class="(incorrectDetectionResultIndex.indexOf(index) != -1)?'incorrect':'correct'" v-for="(barcodeResult,index) in barcodeResults" switch-toggle-side dense-toggle :label="index.toString()+': '+barcodeResult.barcodeText" v-bind:key="index">
                <pre>
{{ JSON.stringify(barcodeResult,null,4) }}
                </pre>
              </q-expansion-item>
            </q-list>
          </div>
          <div class="col list">
            <div class="list-header">
              Ground Truth:
            </div>
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
      <div class="col-12 col-md">
        <div style="display:flex;">
          <div v-if="!dataURL">Downloading... </div>
          <div style="flex:1;"></div>
          <div>
            <q-btn-dropdown color="black" label="Action">
              <q-list>
                <q-item clickable v-close-popup @click="downloadImage">
                  <q-item-section>
                    <q-item-label>Save the image</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="toggleAnnotationMode">
                  <q-item-section>
                    <q-item-label>{{ annotationMode? "Disable":"Enable" }} annotation</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="convertDetectedResultsToGroundTruth">
                  <q-item-section>
                    <q-item-label>Convert detected results to ground truth</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="saveModifiedGroundTruth">
                  <q-item-section>
                    <q-item-label>Save modified ground truth</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
        </div>
        <div style="max-height:75vh;overflow:auto;">
          <svg
            :viewBox="'0 0 '+imgWidth+' '+imgHeight"
            ref="svgRef"
            :class="'fade'+(annotationMode?' annotator':'')"
            v-on:contextmenu="onContextMenu($event)"
            v-on:mousedown="onMouseDown($event)"
            v-if="dataURL"
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
                v-on:mousedown="onGroundTruthMouseDown($event,index)"
              >
                <title>{{ groundTruth.attrib.Type + ": " + groundTruth.text }}</title>
              </polygon>
              <text v-bind:key="'text'+index" v-for="(groundTruth,index) in groundTruthList"
                :x="groundTruth.x1"
                :y="groundTruth.y1"
                :font-size="16 / (640 / imgWidth)"
                class="barcodeTypeLabel"
              > {{ groundTruth.attrib.Type }} </text>
            </a>
            <a v-if="annotationMode">
              <circle v-bind:key="'point'+index" v-for="(point,index) in newGroundTruthPoints"
                :cx="point.x" :cy="point.y" />
            </a>
          </svg>
        </div>
      </div>
    </div>
    <div class="row">
      <q-btn outline color="red" label="Delete this image" v-on:click="deleteThisImage" />
    </div>
    <div class="dialogs">
      <q-dialog v-model="showGroundTruthEditor">
        <q-card>
          <q-card-section>
            <div class="text-h6">Edit Ground Truth</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div>
              <div>
                <label for="ground-truth-format">Format:</label>
              </div>
              <div>
                <input type="text" id="'ground-truth-format" v-model="groundTruthList[selectedGroundTruthIndex].attrib.Type"/>
              </div>
              <div>
                <label for="ground-truth-text">Text:</label>
              </div>
              <div>
                <textarea id="'ground-truth-text" v-model="groundTruthList[selectedGroundTruthIndex].text"/>
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat v-close-popup color="primary" label="Close"/>
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarcodeReader, BarcodeReaderConfig, BarcodeResult, DetectionResult } from 'src/barcodeReader/BarcodeReader';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import localForage from 'localforage';
import { BlobtoDataURL, ConvertBarcodeResultsToGroundTruth, dataURLtoBlob, getFilenameWithoutExtension, getPointsFromBarcodeResultResult, getPointsFromGroundTruth, getRectFromPoints, intersectionOverUnion, loadProjectBarcodeReaderConfigs, overlappingPercent, textCorrect } from 'src/utils';
import { GroundTruth, Point } from 'src/definitions/definitions';
import { Project } from 'src/project';
import { useMeta } from 'quasar';
import DynamsoftButton from 'src/components/DynamsoftButton.vue';
const router = useRouter();
const projectName = ref('');
const imageName = ref('');
const selectedEngineDisplayName = ref('');
const barcodeReaderConfigs = ref([] as BarcodeReaderConfig[])
const imgWidth = ref(0);
const imgHeight = ref(0);
const dataURL = ref('');
const barcodeResults = ref([] as BarcodeResult[]);
const groundTruthList = ref([] as GroundTruth[]);
const showDetectionResults = ref(true);
const showGroundTruth = ref(true);
const saveDetectionResults = ref(false);
const status = ref('');
const incorrectDetectionResultIndex = ref([] as number[]);
const annotationMode = ref(false);
const svgRef = ref();
const newGroundTruthPoints = ref([] as Point[]);
const showGroundTruthEditor = ref(false);
const selectedGroundTruthIndex = ref(-1);
let reader: BarcodeReader;

onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  imageName.value = router.currentRoute.value.params.imageName as string;
  selectedEngineDisplayName.value = router.currentRoute.value.params.engine as string;
  const configs = await loadProjectBarcodeReaderConfigs(router.currentRoute.value.params.name as string);
  barcodeReaderConfigs.value = configs;
  useMeta({
    // sets document title
    title: 'Barcode Reading Benchmark - '+ projectName.value + ' - ' + imageName.value,
  })
  loadImage();
  loadBarcodeResultsAndGroundTruth(router.currentRoute.value.params.engine as string);
});

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

const loadImage = async () => {
  const imageDataURL:string|null|undefined = await localForage.getItem(projectName.value+':image:'+imageName.value);
  if (imageDataURL) {
    let img = new Image();
    img.src = imageDataURL;
    img.onload = function(){
      imgWidth.value = img.width;
      imgHeight.value = img.height;
      dataURL.value = imageDataURL;
    }
  }else{
    const resp = await fetch ('/barcode-dataset/benchmark/dataset/'+projectName.value+'/'+imageName.value);
    const blob = await resp.blob();
    if (blob.size>0) {
      const convertedDataURL = await BlobtoDataURL(blob);
      await localForage.setItem(projectName.value+':image:'+imageName.value,convertedDataURL);
      loadImage();
    }
  }
}

const loadBarcodeResultsAndGroundTruth = async (displayName?:string,detectionResult?:DetectionResult) => {
  let name;
  if (displayName) {
    name = displayName;
  }else{
    name = selectedEngineDisplayName.value;
  }
  if (detectionResult) {
    barcodeResults.value = detectionResult.results;
  }else{
    const detectionResultString:string|null|undefined = await localForage.getItem(projectName.value+':detectionResult:'+getFilenameWithoutExtension(imageName.value)+'-'+name+'.json');
    if (detectionResultString) {
      detectionResult = JSON.parse(detectionResultString);
      if (detectionResult) {
        barcodeResults.value = detectionResult.results;
      }
    }else{
      barcodeResults.value = [];
    }
  }
  const groundTruthString:string|null|undefined = await localForage.getItem(projectName.value+':groundTruth:'+getFilenameWithoutExtension(imageName.value)+'.txt');
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
  let pointsData = result.x1 + ',' + result.y1 + ' ';
  pointsData = pointsData + result.x2+ ',' + result.y2 + ' ';
  pointsData = pointsData + result.x3+ ',' + result.y3 + ' ';
  pointsData = pointsData + result.x4+ ',' + result.y4;
  return pointsData;
}

const decode = async () => {
  const selectedBarcodeReaderConfig = getSelectedBarcodeReaderConfig();
  if (selectedBarcodeReaderConfig) {
    let selectedEngineName = selectedBarcodeReaderConfig.engine;
    let selectedEngineDisplayName = selectedBarcodeReaderConfig.displayName;
    let needInitialization = false;
    if (!reader) {
      needInitialization = true;
    }else{
      if (reader.getEngine() != selectedEngineName) {
        needInitialization = true;
      }
    }
    if (needInitialization) {
      status.value = 'Initializing...';
      reader = await BarcodeReader.createInstance(selectedEngineName);
      status.value = '';
    }
    await updateBarcodeReaderSettings();
    const dataURL:string|null|undefined = await localForage.getItem(projectName.value+':image:'+imageName.value);
    if (dataURL) {
      status.value = 'Decoding...';
      let decodingResult = await reader.detect(dataURL);
      status.value = '';
      console.log(decodingResult);
      barcodeResults.value = decodingResult.results;
      if (saveDetectionResults.value === true) {
        await localForage.setItem(projectName.value+':detectionResult:'+getFilenameWithoutExtension(imageName.value)+'-'+selectedEngineDisplayName+'.json',JSON.stringify(decodingResult));
      }
      loadBarcodeResultsAndGroundTruth(selectedEngineDisplayName,decodingResult);
    }
  }
}

const updateBarcodeReaderSettings = async () => {
  const config = getSelectedBarcodeReaderConfig();
  if (config) {
    const settings = config.settings;
    await reader.setSupportedSettings(settings);
  }
}

const findOutIncorrectDetectionResults = (barcodeResultList:BarcodeResult[],groundTruthList:GroundTruth[]) => {
  let index:number[] = [];
  for (let i = 0; i < barcodeResultList.length; i++) {
    const barcodeResult = barcodeResultList[i];
    let hasCorrectResult = false;
    for (let j = 0; j < groundTruthList.length; j++) {
      const groundTruth = groundTruthList[j];
      //let IoU;
      let percent;
      if (groundTruth.hasLocation === false) {
        percent = 1.0;
      }else {
        const points1 = getPointsFromBarcodeResultResult(barcodeResult);
        const points2 = getPointsFromGroundTruth(groundTruth);
        //IoU = intersectionOverUnion(points1, points2);
        percent = overlappingPercent(points1,points2);
      }

      if (percent > 0.20) {
        if (groundTruth.text) {
          if (!textCorrect(groundTruth,barcodeResult)) {
            index.push(i);
          }else{
            hasCorrectResult = true;
          }
        }
        break;
      }
      if (j === groundTruthList.length - 1 && hasCorrectResult === false) {
        index.push(i);
      }
    }
  }
  incorrectDetectionResultIndex.value = index;
}

const selectedEngineChanged = (displayName:string) => {
  selectedEngineDisplayName.value = displayName;
  loadBarcodeResultsAndGroundTruth(displayName);
}

const deleteThisImage = async () => {
  localForage.removeItem(projectName.value+':image:'+imageName.value);
  localForage.removeItem(projectName.value+':groundTruth:'+getFilenameWithoutExtension(imageName.value)+'.txt');
  const savedProjects = await localForage.getItem('projects');
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
    await localForage.setItem('projects', JSON.stringify(projects));
    alert('deleted');
  }
}

const downloadImage = () => {
  if (dataURL.value) {
    const blob = dataURLtoBlob(dataURL.value);
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob);
    link.download = imageName.value;
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }else{
    alert('The image has not been downloaded.');
  }
}

const toggleAnnotationMode = () => {
  annotationMode.value = !annotationMode.value;
}

const convertDetectedResultsToGroundTruth = () => {
  groundTruthList.value = ConvertBarcodeResultsToGroundTruth(barcodeResults.value);
}

const saveModifiedGroundTruth = async () => {
  await localForage.setItem(projectName.value+':groundTruth:'+getFilenameWithoutExtension(imageName.value)+'.txt',JSON.stringify(groundTruthList.value));
  alert('Saved');
}

const onContextMenu = (event:any) => {
  event.preventDefault();
  return false;
}

const getPosition = (x:number,y:number) => {
  let percent = 1.0;
  percent = imgWidth.value/svgRef.value.clientWidth;
  const point:Point = {
    x:Math.floor(percent*x),
    y:Math.floor(percent*y)
  };
  return point;
}

const onGroundTruthMouseDown = (event:MouseEvent,index:number) => {
  if (annotationMode.value) {
    event.stopPropagation();
    selectedGroundTruthIndex.value = index;
    showGroundTruthEditor.value = true;
  }
} 

const onMouseDown = (event:any) => {
  if (annotationMode.value) {
    const points:Point[] = [];
    newGroundTruthPoints.value.forEach(point => {
      points.push(point)
    });
    if (event.button == 2){
      event.preventDefault();
      points.pop();
    }else {
      points.push(getPosition(event.offsetX,event.offsetY));
      if (points.length >= 4){
        createNewGroundTruthFromPoints(points);
        return;
      }
    }
    newGroundTruthPoints.value = points;
  }
}

const createNewGroundTruthFromPoints = (points:Point[]) => {
  const newListOfGroundTruth:GroundTruth[] = [];
  const groundTruth:GroundTruth = {
    x1:points[0].x,
    x2:points[1].x,
    x3:points[2].x,
    x4:points[3].x,
    y1:points[0].y,
    y2:points[1].y,
    y3:points[2].y,
    y4:points[3].y,
    text:'',
    attrib:{Type:''},
    value_attrib:{}
  }
  groundTruthList.value.forEach(item => {
    newListOfGroundTruth.push(item);
  });
  newListOfGroundTruth.push(groundTruth);
  groundTruthList.value = newListOfGroundTruth;
  newGroundTruthPoints.value = [];
}
</script>
<style>

.annotator {
  cursor: crosshair;
}

.results .q-item {
  padding: 0px;
}
.results .q-item__label {
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

.fade {
  animation-name: fadeIn;
  animation-duration: 1.5s;
}

@keyframes fadeIn {
  from {
    opacity: 0.4;
  }
  to {
    opacity: 1;
  }
}

.barcodeTypeLabel {
  fill:white;
  font-weight: bold;
  text-shadow: 1px 1px 2px black;
}

circle{
  r: 16;
  fill: rgb(0, 255, 0);
  stroke: rgb(255, 255, 255);
  stroke-width: 4;
}
circle:hover{
  r: 20;
  fill: rgb(0, 255, 0);
  stroke: rgb(255, 255, 255);
  stroke-width: 4;
}

.list-header {
  padding:10px;
  background: #eeeeee;
}

.list {
  margin-right:10px;
}
</style>
