<template>
  <div class="q-pa-md example-row-equal-width">
    <div class="row">
      <div class="col">
        <div style="padding-bottom: 20px;">
          <q-select style="max-width: 300px" v-model="selectedEngine" :options="engines" label="Engine" />
        </div>
      </div>
      <div class="col">
        <svg
          :viewBox="viewBox"
          class="overlay"
        >
          <image :href="dataURL"></image>
          <polygon v-bind:key="'polygon'+index" v-for="(barcodeResult,index) in barcodeResults"
            :points="getPointsData(barcodeResult)"
            class="barcode-polygon"
          >
            <title>{{ barcodeResult.barcodeText }}</title>
          </polygon>
        </svg>
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
const router = useRouter();
const projectName = ref("");
const imageName = ref("");
const selectedEngine = ref("");
const engines = ref([] as string[])
const viewBox = ref("")
const dataURL = ref("");
const barcodeResults = ref([] as BarcodeResult[]);
let reader: BarcodeReader;

onMounted(() => {
  projectName.value = router.currentRoute.value.params.name as string;
  imageName.value = router.currentRoute.value.params.imageName as string;
  selectedEngine.value = router.currentRoute.value.params.engine as string;
  const supportedEngines = BarcodeReader.getEngines();
  engines.value = supportedEngines;
  loadImage();
  loadBarcodeResults();
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

const loadBarcodeResults = async () => {
  const detectionResultString:string|null|undefined = await localForage.getItem(projectName.value+":detectionResult:"+getFilenameWithoutExtension(imageName.value)+"-"+selectedEngine.value+".json");
  if (detectionResultString) {
    const detectionResult:DetectionResult = JSON.parse(detectionResultString);
    barcodeResults.value = detectionResult.results;
  }
}

const getPointsData = (result:BarcodeResult) => {
  let pointsData = result.x1 + "," + result.y1 + " ";
  pointsData = pointsData + result.x2+ "," + result.y2 + " ";
  pointsData = pointsData + result.x3+ "," + result.y3 + " ";
  pointsData = pointsData + result.x4+ "," + result.y4;
  return pointsData;
}
</script>
<style>
.barcode-polygon {
  fill:rgba(85,240,40,0.5);
  stroke:green;
  stroke-width:1;
}

.barcode-polygon:hover {
  fill:rgba(85,240,40,0.6);
  stroke:green;
  stroke-width:5;
}
</style>
