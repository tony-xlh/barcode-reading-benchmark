<template>
  <q-page class="row items-center justify-evenly">
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="blue" v-on:click="AddButtonClicked" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const AddButtonClicked = () => {
  console.log("add");
}

</script>
