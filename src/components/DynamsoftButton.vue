<script setup>
defineProps(['label'])
defineEmits(['click'])
</script>

<template>
  <a 
    class="textUpperCase fontOswald orangeBgBtn" 
    style="transition:ease-in 0.2s all"
    @click="$emit('click', $event.target.value)"
  >
    {{ label }}
  </a>
</template>

<style scoped>
.textUpperCase {
  text-transform: uppercase;
}

.orangeBgBtn {
  padding: 5px 10px;
  background-color: #fe8e14;
  border-color: #fe8e14;
  color: #fff;
  text-align: center;
}

.orangeBgBtn:hover {
  box-shadow: -4px 4px 0 0 #000;
  transform: translate(4px,-4px);
}
</style>