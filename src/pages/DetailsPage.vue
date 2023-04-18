<template>
  <q-page class="row justify-evenly">
    <div class="q-pa-md" style="width: 100%">
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const projectName = ref("");
const imageName = ref("");
const selectedEngine = ref("");

onMounted(() => {
  projectName.value = router.currentRoute.value.params.name as string;
  imageName.value = router.currentRoute.value.params.imageName as string;
  selectedEngine.value = router.currentRoute.value.params.engine as string;
});
</script>
