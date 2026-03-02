<template>
    <div>
      <label for="color-picker" class="pointer-p">Color select:</label>
      <input type="color" id="color-picker" v-model="localColor" @input="updateColor" class="pointer-p" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, defineProps } from 'vue';
  
  const props = defineProps<{ selectedColor: string }>();
  
  const emit = defineEmits<{ (e: 'colorChange', color: string): void }>();
  
  const localColor = ref(props.selectedColor);
  
  function updateColor() {
    emit('colorChange', localColor.value);
  }
  
  </script>
  
  <style scoped>
  .pointer-p {
    cursor: pointer;
  }
  </style>
  