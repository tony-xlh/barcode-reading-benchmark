<template>
  <div class="q-pa-md example-row-equal-width">
    <div class="row">
      <div class="col">
        <div style="padding-bottom: 20px;">
          <q-select style="max-width: 300px" v-model="selectedEngine" :options="engines" label="Engine" />
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
              <q-expansion-item v-for="(barcodeResult,index) in barcodeResults" switch-toggle-side dense-toggle :label="index.toString()+': '+barcodeResult.barcodeText" v-bind:key="index">
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
                <title>{{ barcodeResult.barcodeText }}</title>
              </polygon>
            </a>
            <a v-if="showGroundTruth">
              <polygon v-bind:key="'polygon'+index" v-for="(groundTruth,index) in groundTruthList"
                :points="getPointsData(groundTruth)"
                class="groundtruth-polygon"
              >
                <title>{{ groundTruth.text }}</title>
              </polygon>
            </a>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarcodeReader, BarcodeResult, DetectionResult } from "src/barcodeReader/BarcodeReader";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import localForage from "localforage";
import { getFilenameWithoutExtension } from "src/utils";
import { GroundTruth } from "src/definitions/definitions";
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
let reader: BarcodeReader;

onMounted(() => {
  projectName.value = router.currentRoute.value.params.name as string;
  imageName.value = router.currentRoute.value.params.imageName as string;
  selectedEngine.value = router.currentRoute.value.params.engine as string;
  const supportedEngines = BarcodeReader.getEngines();
  engines.value = supportedEngines;
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

const loadBarcodeResultsAndGroundTruth = async () => {
  const detectionResultString:string|null|undefined = await localForage.getItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName.value)+"-"+selectedEngine.value+".json");
  let detectionResult:DetectionResult;
  if (detectionResultString) {
    detectionResult = JSON.parse(detectionResultString);
    barcodeResults.value = detectionResult.results;
    
  }
  const groundTruthString:string|null|undefined = await localForage.getItem(projectName.value+":groundTruth:"+getFilenameWithoutExtension(imageName.value)+".txt");
  let parsedGroundTruth;
  if (groundTruthString) {
    parsedGroundTruth = JSON.parse(groundTruthString);
    groundTruthList.value = parsedGroundTruth;
  }
}

const getPointsData = (result:BarcodeResult|GroundTruth) => {
  let pointsData = result.x1 + "," + result.y1 + " ";
  pointsData = pointsData + result.x2+ "," + result.y2 + " ";
  pointsData = pointsData + result.x3+ "," + result.y3 + " ";
  pointsData = pointsData + result.x4+ "," + result.y4;
  return pointsData;
}
</script>
<style>

pre {
  padding: 5px;
  margin: 0;
  white-space: break-spaces;
  word-wrap: break-word;
}
.barcode-polygon {
  fill:rgba(85,240,40,0.5);
  stroke:green;
  stroke-width:15;
}

.barcode-polygon:hover {
  fill:rgba(85,240,40,0.6);
  stroke:green;
  stroke-width:15;
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
</style>
