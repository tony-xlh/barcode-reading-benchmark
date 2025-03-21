<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-black text-white">
        <a class="ds-logo" href="https://www.dynamsoft.com"></a>
        <div class="toolbar-span"></div>
        <div class="right">
          <a href="javascript:void(0);" @click="goHome">Home</a>
          <a href="https://github.com/tony-xlh/barcode-reading-benchmark" target="_blank" >GitHub</a>
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const goHome = () => {
  console.log('goHome');
  router.push('/');
}
</script>

<style scoped>

.q-toolbar {
  padding-left: 15px;
  padding-right: 15px;
}

.toolbar-span {
  flex:1;
}

.right a {
  color: white;
  margin-left: 10px;
  text-decoration: none;
}

.ds-logo {
  width: 145px;
  height: 35px;
  background: url(/assets/img-icon/logo-dynamsoft-white.svg) no-repeat 0;
}
</style>