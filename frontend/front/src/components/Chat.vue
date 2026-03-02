<template>
  <div class="chat-wrapper" :class="{ open: isOpen }">
    <button class="chat-toggle" @click="toggleChat">💬</button>
    
    <div v-if="isOpen" class="chat-box">
      <div class="chat-users">
         <h4>Aktivni ljudi</h4>
         <ul>
           <li v-for="(user, index) in activeUsers" :key="index">{{ user }}</li>
          </ul>
      </div>

      <div class="chat-messages">
        <div v-for="(msg, index) in messages" :key="index" class="chat-message">
          <strong>{{ msg.username }}:</strong> {{ msg.content }}
        </div>
      </div>
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="Type a message..."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useSocketStore } from "@/stores/socket";
import { useRoute } from "vue-router";

const socketStore = useSocketStore();
const route = useRoute();

const isOpen = ref(false);
const messages = ref<{ username: string; content: string }[]>([]);
const newMessage = ref("");
const activeUsers = ref<string[]>([]);

function toggleChat() {
  isOpen.value = !isOpen.value;
}

// handler za poruke
const messageHandler = (data: { username: string; content: string }) => {
  console.log("pristigla poruka: " + data.content + ", od " + data.username);
  messages.value.push(data);
};

const usersHandler = (users: string[]) => {
  console.log("Active users update:", users);
  activeUsers.value = users;
};

watch(() => socketStore.isConnected, (isConnected) => {
  if (isConnected && socketStore.socket) {
    // da se doda jednom kad postane true
    socketStore.socket.on("new_chat_message", messageHandler);
    socketStore.socket.on("active_users", usersHandler);
    console.log("NASAO GA JEE");
  } else {
    // Ukloni event listener kada se diskonektuje
    if (socketStore.socket) {
      socketStore.socket.off("new_chat_message", messageHandler);
      socketStore.socket.off("active_users", usersHandler);
    }
  }
});

function sendMessage() {

    if (!newMessage.value.trim()) return;
    console.log("ok salje poruku: " + newMessage.value.trim());
    socketStore.sendChatMessage({
        pictureId: route.params.id as string,
        content: newMessage.value,
    });
  newMessage.value = "";
}

onMounted(() => {
  if (socketStore.socket && socketStore.isConnected) {
    socketStore.socket.on("new_chat_message", messageHandler);
  }else{
    console.log("Pa nema ga na initu wyy");
  }
});

onBeforeUnmount(() => {
  if (socketStore.socket) {
    socketStore.socket.off("new_chat_message");
    socketStore.socket.off("active_users");
  }
});
</script>

<style scoped>
.chat-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
}
.chat-toggle {
  border: none;
  background: #444;
  color: white;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
}
.chat-box {
  width: 250px;
  height: 300px;
  background: white;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}
.chat-messages {
  flex: 1;
  padding: 5px;
  overflow-y: auto;
}
.chat-message {
  margin-bottom: 5px;
}
.chat-box input {
  border: none;
  border-top: 1px solid #ddd;
  padding: 5px;
}
</style>
