<template>
  <q-page class="row justify-evenly">
    <q-card flat bordered class="overview-card" style="width:100%;">
      <q-card-section>
        <div class="text-h6">{{projectName}}</div>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section>
        <div style="padding-bottom: 20px;">
          <q-select style="max-width: 300px" v-model="model" :options="options" label="Engine" />
        </div>
        <div>
          <q-btn outline color="primary" label="Start decoding" @click="addImages" />
          <q-btn outline color="primary" label="Get statistics" @click="addImages" />
        </div>
        <div>
          Statistics: 
        </div>
      </q-card-section>
      <q-card-section>
      <q-table
        title="Images"
        :rows="rows"
        :columns="columns"
        row-key="name"
      >
        <template v-slot:top>
          <q-btn-dropdown color="primary" label="Action">
            <q-list>
              <q-item clickable v-close-popup @click="addImages">
                <q-item-section>
                  <q-item-label>Add images</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="addReadingResults">
                <q-item-section>
                  <q-item-label>Add reading results</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="addGroundTruth">
                <q-item-section>
                  <q-item-label>Add ground truth</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </template>
      </q-table>
      </q-card-section>
    </q-card>
    
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
const model = ref(null);
const options = ['Google', 'Facebook', 'Twitter', 'Apple', 'Oracle']
      
const addImages = () => {
  console.log("add")
};

const addReadingResults = () => {
  console.log("add")
};

const addGroundTruth = () => {
  console.log("add")
};

onMounted(async () => {
  console.log("mounted");
  projectName.value = router.currentRoute.value.params.name as string;
});

</script>
