<template>
  <div>

  </div>
</template>

<script setup lang="ts">
import { BarcodeReader } from "src/barcodeReader/BarcodeReader";
import { Project } from "src/project";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import localForage from "localforage";
const projectName = ref("");
const engines = ref([] as string[])
const router = useRouter();
let project:Project;
onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  const supportedEngines = BarcodeReader.getEngines();
  engines.value = supportedEngines;
  const savedProjects = await localForage.getItem("projects");
  if (savedProjects) {
    const projects = JSON.parse(savedProjects as string);
    for (let index = 0; index < projects.length; index++) {
      if (projects[index].info.name === projectName.value) {
        project = projects[index];
        return;
      }
    }
  }
});
</script>
