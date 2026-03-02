<template>
  <nav>
    <div class="nav-left">
      <RouterLink :to="{ name: 'home' }">Home</RouterLink>
      <RouterLink :to="{ name: 'crtanje' }">Crtanje</RouterLink>
      <RouterLink :to="{ name: 'galerija' }">Galerija</RouterLink>
      <template v-if="isLoggedIn">
        <RouterLink :to="{ name: 'galerija', query: { author: currentUserId } }">My Gallery</RouterLink>
      </template>
    
    </div>

    <div class="nav-right">
    <!-- Vidljivo kad nije ulogovan-->
      <template v-if="!isLoggedIn">
        <RouterLink :to="{ name: 'login' }">Login</RouterLink>
        <RouterLink :to="{ name: 'register' }">Register</RouterLink>
      </template>

      <!-- Vidljivo kad jeste -->
      <template v-else>
        <span>{{ currentUser }}</span>
        <button @click="logout">Logout</button>
      </template>
    </div>  
  </nav>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { computed } from "vue";

const userStore = useUserStore();
const router = useRouter();

// da se prati da li je osoba ulogovana
const isLoggedIn = computed(() => !!userStore.token);
const currentUser = computed(() => userStore.username || "");
const currentUserId = computed(() => userStore.userId);

// za logout
const logout = () => {
  userStore.logout();
  router.push({ name: "login" });
};
</script>

<style scoped>
nav {
  background-color: black;
  color: #FF8A65;
  padding: 1rem;
  text-align: center;
  border-bottom: dotted 3px #FFCCBC;
  width: 100%;
  display: flex;
  justify-content: space-between;
  /* justify-content: left; */
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.nav-left {
  display: flex;
  align-items: center;
}
.nav-right{
  margin-right: 15px;
  display: flex;
  align-items: center;
}

a {
  color: white;
  text-decoration: none;
  margin-right: 1rem;
}

a:hover {
  text-decoration: underline;
}

button {
  background-color: transparent;
  border: none;
  color: white;
  cursor: pointer;
  margin-left: 1rem;
}

button:hover {
  text-decoration: underline;
}
</style>
