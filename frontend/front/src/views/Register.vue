<template>
    <div class="register-container">
      <h2>Register</h2>
      <form @submit.prevent="handleRegister">
        <div>
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter your username"
          />
          <span class="error_class" v-if="errors.username">{{ errors.username }}</span>
        </div>
        <div>
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
          />
          <span class="error_class" v-if="errors.password">{{ errors.password }}</span>
        </div>
        <div>
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm your password"
          />
          <span class="error_class" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</span>
        </div>
        <button type="submit">Register</button>
        <p class="error_class" v-if="errorMessage">{{ errorMessage }}</p>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  import { useUserStore } from "@/stores/user";
  import { useRouter } from "vue-router";
  
  const router = useRouter();
  const userStore = useUserStore();
  
  const username = ref("");
  const password = ref("");
  const confirmPassword = ref("");
  const errorMessage = ref("");
  const errors = ref<{ username?: string; password?: string; confirmPassword?: string }>({});
  
  const validateForm = (): boolean => {
    errors.value = {};
  
    if (!username.value) {
      errors.value.username = "Username is required.";
    } else if (username.value.length < 2 || username.value.length > 32) {
      errors.value.username = "Username must be between 2 and 32 characters.";
    }
  
    if (!password.value) {
      errors.value.password = "Password is required.";
    } else if (password.value.length < 8 || password.value.length > 128) {
      errors.value.password = "Password must be between 8 and 128 characters.";
    }
  
    if (password.value !== confirmPassword.value) {
      errors.value.confirmPassword = "Passwords do not match.";
    }
  
    return Object.keys(errors.value).length === 0;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) return;
  
    const result = await userStore.register(username.value, password.value);
    if (!result.success) {
        if(result.message){
            errorMessage.value = result.message;
        }else{
            errorMessage.value = "Random error";
        }
    }else{
        router.push({ name: "crtanje" });
    }
  };
  </script>
  
  <style scoped>
    .error_class{
        color: red;
    }
  </style>
  