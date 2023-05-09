<script setup>
const props = defineProps(['label','outline'])
defineEmits(['click'])

const getClassName = () => {
  console.log(props);
  if (props.outline === '') {
    return 'outline textUpperCase fontOswald orangeBgBtn';
  }else{
    return 'textUpperCase fontOswald orangeBgBtn';
  }
}
</script>

<template>
  <a 
    :class="getClassName()" 
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
  display: inline-block;
  padding: 5px 10px;
  background-color: #fe8e14;
  color: #fff;
  text-align: center;
  border: 2px solid #fe8e14;
}

.orangeBgBtn:hover {
  box-shadow: -4px 4px 0 0 #000;
  transform: translate(4px,-4px);
}
.outline {
  color: #fe8e14;
  border-color: #fe8e14;
  background-color: #fff;
}

</style>