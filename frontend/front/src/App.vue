<template>

<Navbar />
  <div class="content">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { useSocketStore } from '@/stores/socket'

const socketStore = useSocketStore()

socketStore.initializeSocket()

</script>

<style scoped>
  body {
    background: black;
    color: #FBE9E7;
  }

  #app {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .content {
    padding: 1rem;
    /* margin-top: 45px;  */
    margin-top: 5vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
