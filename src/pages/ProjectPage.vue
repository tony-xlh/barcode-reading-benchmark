<template>
  <q-page class="row justify-evenly">
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const projectName = ref("");
onMounted(async () => {
  console.log("mounted");
  projectName.value = router.currentRoute.value.params.name as string;
});
</script>
