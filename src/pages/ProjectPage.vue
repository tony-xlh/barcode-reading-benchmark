<template>
  <q-page class="row justify-evenly">
    <div class="q-pa-md" style="width:100%;">
      <q-table
        title="Images"
        :rows="rows"
        :columns="columns"
        row-key="name"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
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

const rows = [
  {
    filename: 'image.jpg',
  }
]
const router = useRouter();
const projectName = ref("");
onMounted(async () => {
  console.log("mounted");
  projectName.value = router.currentRoute.value.params.name as string;
});
</script>
