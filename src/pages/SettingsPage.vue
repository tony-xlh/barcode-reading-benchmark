<template>
  <q-page>
    <div class="full">
      <div class="header">
        <div class="text-h6 fontOswald">{{projectName}}</div>
      </div>
      <div class="container">
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { Project } from "src/project";
import localForage from "localforage";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DynamsoftButton from "src/components/DynamsoftButton.vue";

const projectName = ref("");
const router = useRouter();

onMounted(async () => {
  projectName.value = router.currentRoute.value.params.name as string;
  console.log(projectName.value);
});

</script>
<style scoped>
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
</style>