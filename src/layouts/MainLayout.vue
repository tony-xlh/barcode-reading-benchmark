<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-black text-white">
        <a class="ds-logo" href="https://www.dynamsoft.com"></a>
        <div class="toolbar-container"></div>
        <q-btn flat round color="white" icon="home" @click="goHome()" />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
const goHome = () => {
  router.push("/");
}
</script>

<style scoped>

.q-toolbar {
  padding-left: 15px;
  padding-right: 15px;
}
.toolbar-container {
  flex:1;
}
.ds-logo {
  width: 145px;
  height: 35px;
  background: url(/assets/img-icon/logo-dynamsoft-white.svg) no-repeat 0;
}
</style>