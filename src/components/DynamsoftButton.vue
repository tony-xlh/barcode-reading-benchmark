<script setup>
const props = defineProps(['secondary','label','outline'])
defineEmits(['click'])

const getClassName = () => {
  let classNames = ['textUpperCase','dynamsoft-button'];
  if (props.secondary === '') {
    classNames.push('secondaryBtn');
    classNames.push('fontOswaldMedium');
  }else{
    classNames.push('primaryBtn');
    classNames.push('fontOswald');
  }
  if (props.outline === '') {
    classNames.push('outline')
  }
  return classNames.join(" ");
}
</script>

<template>
  <a 
    :class="getClassName()"
    @click="$emit('click', $event.target.value)"
  >
    {{ label }}
    <span v-if="props.secondary === ''" class="ml10">&gt;</span>
  </a>
</template>

<style scoped>
.textUpperCase {
  text-transform: uppercase;
}

.primaryBtn {
  display: inline-block;
  padding: 5px 10px;
  background-color: #fe8e14;
  color: #fff;
  text-align: center;
  border: 2px solid #fe8e14;
  cursor: pointer;
  transition: ease-in 0.2s all
}

.secondaryBtn {
  display: inline-block;
  background-color: transparent;
  color: #fe8e14;
  text-align: center;
  cursor: pointer;
}

@media(any-hover:hover){
  .primaryBtn:hover {
    box-shadow: -4px 4px 0 0 #000;
    transform: translate(4px,-4px);
  }
  .secondaryBtn:hover {
    color: #fea543;
  }
}

.primaryBtn:active {
  color: #fea543;
}

.secondaryBtn:active {
  color: #fea543;
}

.outline {
  color: #fe8e14;
  border-color: #fe8e14;
  background-color: #fff;
}

</style>