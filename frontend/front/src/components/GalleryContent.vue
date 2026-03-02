<template>
  <div>
    <!-- prazno -->
    <div v-if="pictures.length === 0" class="empty-message">No pictures available.</div>

    <!-- galerija -->
    <div v-else class="gallery-list">
      <div v-for="picture in pictures" :key="picture.picture_id" class="gallery-item">
        <div class="gallery-item-header">
          <h4>{{ picture.name }}</h4>
          <p>
            By:
            <span class="author-link" @click="filterByAuthor(picture.author.user_id)">
              {{ picture.author.username }}
            </span>
          </p>
        </div>
        <div class="gallery-item-thumbnail" @click="goToDrawingPage(picture.picture_id)">
          <div class="thumbnail-grid">
            <div
              v-for="(row, rowIndex) in picture.picture_data"
              :key="rowIndex"
              class="thumbnail-row"
            >
              <div
                v-for="(cell, cellIndex) in row"
                :key="cellIndex"
                class="thumbnail-cell"
                :style="{ backgroundColor: cell }"
              ></div>
            </div>
          </div>
        </div>
        <!-- lajkovanje deo -->
        <div class="likes-section">
          <div class="likes-stats">
            <span class="likes-count">👍 {{ getLikesCount(picture.picture_id) }}</span>
            <span class="dislikes-count">👎 {{ getDislikesCount(picture.picture_id) }}</span>
          </div>
          
          <div class="like-buttons">
            <button 
              @click="toggleLike(picture.picture_id, true)"
              :class="{ active: getUserVote(picture.picture_id) === true }"
            >
              👍 Like
            </button>
            <button 
              @click="toggleLike(picture.picture_id, false)"
              :class="{ active: getUserVote(picture.picture_id) === false }"
            >
              👎 Dislike
            </button>
          </div>
        </div>


        <!-- komentari deo dodati -->
        <div class="comments-section">
          <h5>Comments ({{ getCommentsForPicture(picture.picture_id).length }})</h5>
          
          <div class="comments-list">
            <div 
              v-for="comment in getCommentsForPicture(picture.picture_id)" 
              :key="comment.id" 
              class="comment-item"
            >
              <strong>{{ comment.username }}:</strong> {{ comment.comment }}
              <span class="comment-time">{{ formatCommentTime(comment.createdAt) }}</span>
            </div>
          </div>

          <div class="comment-input">
            <input
              v-model="commentInputs[picture.picture_id]"
              @keyup.enter="addComment(picture.picture_id)"
              placeholder="Add a comment..."
            />
            <button @click="addComment(picture.picture_id)">Send</button>
          </div>
        </div>

        <!-- del -->
        <button @click="confirmDelete(picture.picture_id)">Delete</button>
        <div class="gallery-item-footer">
          <p>{{ formatDate(picture.created_at) }}</p>
        </div>
      </div>
      <!-- conf modal -->
      <div v-if="isDeleteModalOpen" class="modal-overlay">
        <div class="modal-content">
          <h3>Are you sure you want to delete this picture?</h3>
          <div class="modal-buttons">
            <button @click="deletePicture">Yes</button>
            <button @click="closeDeleteModal">No</button>
          </div>
        </div>
      </div>

    </div>

    <!-- <div v-if="deleteError" class="error-message">{{ deleteError }}</div> -->
    <!-- paginacija -->
    <div v-if="pictures.length > 0" class="pagination-controls">
      <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
      <span>Page {{ currentPage }}</span>
      <button @click="nextPage" :disabled="!hasMorePages">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { defineEmits } from "vue";
import type { Picture } from "@/types/Picture";
import { useRouter } from "vue-router";

import { usePictureStore } from "@/stores/pictures";
import { useSocketStore } from "@/stores/socket";
import type { Comment } from "@/types/Comment";
import { useUserStore } from '@/stores/user';




const props = defineProps<{
  pictures: Picture[];
  currentPage: number;
  hasMorePages: boolean;
}>();


const socketStore = useSocketStore();
const emit = defineEmits(["changePage", "filterByAuthor"]); 
const router = useRouter();

const isDeleteModalOpen = ref<boolean>(false);
const pictureToDelete = ref<string>("");
//const deleteError = ref<string>("");

const pictureStore = usePictureStore();
const userStore = useUserStore();

// state za komentare
const allComments = ref<Comment[]>([]);
const commentInputs = ref<Record<string, string>>({});

// state za lajkove
const allLikes = ref<any[]>([]);

// dohvati sve komentare na mount
onMounted(async () => {
  await loadAllComments();
  await loadAllLikes();
  await setupSocketListeners();
});

onBeforeUnmount(() => {
  removeSocketListeners();
});

//KOMENTARI DEO
// svi komentari da se ucitaju 
async function loadAllComments() {
  try {
    const response = await fetch('http://localhost:3001/pictures/comments');
    if (response.ok) {
      const data = await response.json();
      allComments.value = data.comments || [];
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

// socket listeners za realtime komentare
async function setupSocketListeners() {

  try{
    socketStore.initializeSocket();
    await socketStore.connect();
  }catch(error){
    console.error('Failed to connect to socket:', error);
  }

  if (socketStore.socket && socketStore.isConnected) {
    socketStore.socket.on('new_comment', handleNewComment);

    //lajkovi deo
    socketStore.socket.on('like_updated', handleLikeUpdated);
  }else{
    console.log("i dalje ne radi o pobogu pobogu");
  }
}

function removeSocketListeners() {
  if (socketStore.socket) {
    socketStore.socket.off('new_comment', handleNewComment);
    socketStore.socket.off('like_updated', handleLikeUpdated);
  }
  if (socketStore.isConnected) {
    socketStore.disconnect();
  }
}

function handleNewComment(comment: any) {
  allComments.value.unshift(comment); // da se doda na pocetak
}

// kom za specificnu sliku
function getCommentsForPicture(pictureId: string) {
  return allComments.value
    .filter(comment => comment.pictureId === pictureId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// nov komentar
function addComment(pictureId: string) {
  const commentText = commentInputs.value[pictureId]?.trim();
  if (!commentText) return;

  if (socketStore.isConnected) {
    socketStore.sendComment({
      pictureId,
      comment: commentText
    });
    commentInputs.value[pictureId] = '';
  } else {
    alert('Not connected to server');
  }
}

// formatiranje za vreme komentara
function formatCommentTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// deo za lajkove
async function loadAllLikes() {
  try {
    const response = await fetch('http://localhost:3001/pictures/likes');
    if (response.ok) {
      const data = await response.json();
      allLikes.value = data.likes || [];
    }
  } catch (error) {
    console.error('Error loading likes:', error);
  }
}

function handleLikeUpdated(like: any) {
  // da se ukloni postojeci like za ovog usera i ovu sliku ako postoji
  allLikes.value = allLikes.value.filter(
    l => !(l.pictureId === like.pictureId && l.username === like.username)
  );
  // da se doda novi/updated like
  allLikes.value.unshift(like);
}

function getLikesCount(pictureId: string) {
  return allLikes.value.filter(like => 
    like.pictureId === pictureId && like.isLiked === true
  ).length;
}

function getDislikesCount(pictureId: string) {
  return allLikes.value.filter(like => 
    like.pictureId === pictureId && like.isLiked === false
  ).length;
}

function getUserVote(pictureId: string) {
  // const userStore = useUserStoreeeeeeee();
  const userLike = allLikes.value.find(like => 
    like.pictureId === pictureId && like.username === userStore.username
  );
  return userLike ? userLike.isLiked : null;
}

function toggleLike(pictureId: string, isLiked: boolean) {
  if (socketStore.isConnected) {
    socketStore.toggleLike({
      pictureId,
      isLiked
    });
  } else {
    alert('Not connected to server.');
  }
}


// paginacija
function prevPage() {
  emit("changePage", props.currentPage - 1);
}

function nextPage() {
  emit("changePage", props.currentPage + 1);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function filterByAuthor(author: string) {
  //alert("odradio makar poziv ka tome");
  emit("filterByAuthor", author);
}

function goToDrawingPage(pictureId: string) {
  router.push({ name: "crtanje", params: { id: pictureId } });
}

//brisanje
function confirmDelete(pictureId: string) {
  pictureToDelete.value = pictureId;
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
  pictureToDelete.value = "";
}

async function deletePicture() {
  if (!pictureToDelete.value) return;

  const result = await pictureStore.deletePicture(pictureToDelete.value);

  if (result.success) {
    //deleteError.value = "";
    alert("Picture deleted successfully!");
    isDeleteModalOpen.value = false;
    pictureToDelete.value = "";
    //await pictureStore.loadAllPictures(props.currentPage);// reload?
    //window.location.reload();
    router.replace({ path: router.currentRoute.value.path }).catch(() => { });
  } else {
   // deleteError.value = result.message || "Failed to delete the picture.";
    isDeleteModalOpen.value = false;
    pictureToDelete.value = "";
    alert(result.message || "Failed to delete the picture.");
  }
}



</script>

<style scoped>
.empty-message {
  text-align: center;
  color: #888;
  font-size: 1.2em;
  margin: 20px 0;
}

.gallery-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gallery-item {
  padding: 15px;
  border: 1px solid #d9ebf7;
  background-color: #f8fbff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gallery-item-header {
  margin-bottom: 10px;
}

.author-link {
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}

.author-link:hover {
  text-decoration: none;
}

.gallery-item-thumbnail {
  margin-bottom: 10px;
  cursor: pointer;
}

.thumbnail-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.thumbnail-row {
  display: flex;
  gap: 2px;
}

.thumbnail-cell {
  width: 10px;
  height: 10px;
  border: 1px solid #e0e0e0;
  box-sizing: border-box;
}

.gallery-item-footer {
  font-size: 0.9em;
  color: #555;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 5px 10px;
  font-size: 1em;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
}

.modal-buttons button {
  margin: 5px;
}


.comments-section {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.comments-section h5 {
  margin: 0 0 10px 0;
  color: #333;
}

.comments-list {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.comment-item {
  padding: 5px;
  border-bottom: 1px solid #eee;
  font-size: 0.9em;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-time {
  font-size: 0.8em;
  color: #888;
  margin-left: 5px;
}

.comment-input {
  display: flex;
  gap: 5px;
}

.comment-input input {
  flex: 1;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.comment-input button {
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.comment-input button:hover {
  background-color: #0056b3;
}


.likes-section {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.likes-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 0.9em;
}

.like-buttons {
  display: flex;
  gap: 10px;
}

.like-buttons button {
  flex: 1;
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f0f0f0;
  cursor: pointer;
}

.like-buttons button:hover {
  background-color: #e0e0e0;
}

.like-buttons button.active {
  background-color: #007bff;
  color: white;
  border-color: #0056b3;
}

.like-buttons button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

</style>
