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
          <q-btn outline color="primary" label="Get statistics" v-on:click="getStatistics" />
        </div>
        <div>
          Statistics: 
        </div>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section>
          <div>
            <input type="file" id="imageFiles" multiple="true" v-on:change="loadImageFiles($event);" accept=".jpg,.jpeg,.png,.bmp" />
            <label for="imageFiles">Image files.</label>
          </div>
          <div>
            <input type="file" id="detectionResultFiles" multiple="true" v-on:change="loadDetectionResultFiles($event);" accept=".json" />
            <label for="detectionResultFiles">Detection result files.</label>
          </div>
          <div>
            <input type="file" id="groundTruthFiles" multiple="true" v-on:change="loadGroundTruthFiles($event);" accept=".json" />
            <label for="imageFiles">Ground truth files.</label>
          </div>
          <q-btn color="primary" label="Add to project" v-on:click="addFilesToProject" />
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section>
      <q-table
        title="Images"
        :rows="rows"
        :columns="columns"
        row-key="name"
      >
      </q-table>
      </q-card-section>
    </q-card>
    
  </q-page>
</template>

<script setup lang="ts">
import { BarcodeReader } from "src/barcodeReader/BarcodeReader";
import { Project } from "src/definitions/project";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import localForage from "localforage";

const columns = [
  {
    name: 'name',
    required: true,
    label: 'Filename',
    align: 'left',
    field: 'filename',
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
let imageFiles:string[] = [];
let detectionResultFiles:string[] = [];
let groundTruthFiles:string[] = [];
      
onMounted(async () => {
  console.log("mounted");
  projectName.value = router.currentRoute.value.params.name as string;
  const savedProjects = await localForage.getItem("projects");
  if (savedProjects) {
    const projects = JSON.parse(savedProjects as string);
    project = projects[projectName.value];
    updateRows();
  }
  const supportedEngines = BarcodeReader.getEngines();
  engines.value = supportedEngines;
  if (supportedEngines.length>0) {
    selectedEngine.value = supportedEngines[0];
  }
});

const updateRows = () => {
  if (project) {
    let newRows = [];
    for (let index = 0; index < project.info.images.length; index++) {
      const image = project.info.images[index];
      const row = {
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

const addFilesToProject = () => {
  console.log(groundTruthFiles);
  console.log(imageFiles);
  console.log(detectionResultFiles);
}
</script>

<style>
</style>