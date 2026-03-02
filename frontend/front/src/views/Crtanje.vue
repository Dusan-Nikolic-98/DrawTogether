<template>
    <div class="drawing-page">
      
  
      <div class="toolbar">
        <p v-if="currPictureName">Picture name: {{currPictureName}}</p>

        <ColorPicker :selectedColor="selectedColor" @colorChange="setColor" />
        
        <button @click="toggleEraser">{{ isErasing ? 'Disable Eraser' : 'Enable Eraser' }}</button>

        <div class="resize-section">
          <label for="resize-input">Canvas Size (1-24):</label>
          <input
            type="number"
            id="resize-input"
            v-model.number="newSize"
            min="1"
            max="24"
            placeholder="Enter size"
          />
          <button @click="resizeCanvas">Resize</button>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>


        <button @click="openSaveModal">Save Picture</button>
      </div>
      
      <div
        class="grid"
        @mousedown.left="startDrawing"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @mouseover="sendCursorUpdate"
        
      >
        <div
          v-for="(row, rowIndex) in grid"
          :key="rowIndex"
          class="grid-row"
        >
          <div
            v-for="(cell, cellIndex) in row"
            :key="cellIndex"
            class="grid-cell"
            :style="{ backgroundColor: cell }"
            @mouseover.left="draw(rowIndex, cellIndex)"
            @mousedown.left="draw(rowIndex, cellIndex, true)"
  
          ></div>
        </div>
      </div>

      <!-- tudji kursori -->
    <div class="cursors-overlay">
      <div
        v-for="(cursor, userId) in otherCursors"
        :key="userId"
        class="cursor"
        :style="{
          left: cursor.x + 'px', 
          top: cursor.y + 'px',
          backgroundColor: 'rgba(255, 0, 0, 0.5)'
        }"
      >
        <span class="username">{{ cursor.username }}</span>
      </div>
    </div>

    </div>
    
    <!-- Modal za cuvanje -->
    <div v-if="isSaveModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h3 v-if="currPictureName === ''">Enter Picture Name</h3>
        <h3 v-else>Save Changes</h3>
        <input type="text" v-model="pictureName" placeholder="Enter picture name" :readonly="currPictureName !== ''" />
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <div class="modal-buttons">
          <button @click="savePicture">Save</button>
          <button @click="closeSaveModal">Cancel</button>
        </div>
      </div>
    </div>

    <Chat />
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import ColorPicker from '@/components/ColorPicker.vue';
  import { usePictureStore } from '@/stores/pictures';
  import { useSocketStore } from '@/stores/socket';
  // import { io, Socket } from "socket.io-client";
  import { computed, onBeforeUnmount } from "vue";
  

  // let socket: Socket;
  const socketStore = useSocketStore();

  type Color = string;
  type Grid = Color[][];
  
  const grid = ref<Grid>(Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => "#ffffff")));
  const selectedColor = ref<Color>("#000000");
  const isDrawing = ref<boolean>(false);

  const currPictureName = ref<string>("");
  //brisanje
  const isErasing = ref<boolean>(false);

  // resize deo
  const newSize = ref<number>(20); 
  const errorMessage = ref<string>(""); 

  //cuvanje deo
  const isSaveModalOpen = ref<boolean>(false);
  const pictureName = ref<string>("");
  
  const pictureStore = usePictureStore();


  //za tudje kursore
  type CursorInfo = {
    x: number;
    y: number;
    username: string;
  };

  const otherCursors = ref<Record<string, CursorInfo>>({});


  // fje
  function sendCursorUpdate(event: MouseEvent) {
    if (route.params.id) {
      const gridElement = event.currentTarget as HTMLElement;
      const rect = gridElement.getBoundingClientRect();
      
      const x = event.clientX - rect.left; // pixel X unutar grida
      const y = event.clientY - rect.top;  // pixel Y unutar grida

      // console.log("dakle pre x: " + event.clientX + " y: " + event.clientY);
      // console.log("nakon x: " + x + " y: " + y);
      // console.log("a rect levo: " + rect.left + " i top: " + rect.top);
      
      socketStore.moveCursor({
        pictureId: route.params.id as string,
        x: x,
        y: y
      });
  
    }
  }


  function startDrawing(): void {
    isDrawing.value = true;
  }
  
  function stopDrawing(): void {
    isDrawing.value = false;
  }
  
  function draw(row: number, col: number, fTouch: boolean =false): void {
    if (fTouch || isDrawing.value) {
      const color = isErasing.value ? "#ffffff" : selectedColor.value;
      // grid.value[row][col] = isErasing.value ? "#ffffff" : selectedColor.value; //selectedColor.value;
      grid.value[row][col] = color;

      //da javim ako moram
      if (route.params.id){
        socketStore.drawPixel({
          pictureId: route.params.id as string,
        x: row,
        y: col,
        color,
        });
      }
    }
  }

  function setColor(newColor: Color): void {
    selectedColor.value = newColor;
  }

  function toggleEraser(): void {
    isErasing.value = !isErasing.value;
    const gridElement = document.querySelector('.grid') as HTMLElement;
    if(gridElement){
      gridElement.style.cursor = isErasing.value ? 'cell' : 'crosshair';
    }

  }

  function resizeCanvas(): void {
    if (newSize.value < 1 || newSize.value > 24) {
      errorMessage.value = "Size must be between 1 and 24.";
      return;
    }

    errorMessage.value = ""; 

    const currentSize = grid.value.length;
    const resizedGrid: Grid = Array.from({ length: newSize.value }, (_, row) =>
      Array.from({ length: newSize.value }, (_, col) =>
        row < currentSize && col < currentSize ? grid.value[row][col] : "#ffffff"
      )
    );

    grid.value = resizedGrid;
  }

  //cuvanje
  //modal
  function openSaveModal(): void {
    isSaveModalOpen.value = true;
  }

  function closeSaveModal(): void {
    isSaveModalOpen.value = false;
    errorMessage.value = "";
  }

 
  async function savePicture(): Promise<void> {
    if (!pictureName.value.trim()) {
      errorMessage.value = "Please enter a valid picture name!";
      return;
    }
    const pictureId = route.params.id as string;
    let result;

    if (pictureId) {
      result = await pictureStore.updatePicture(pictureId, grid.value);
    } else {
      result = await pictureStore.saveNewPicture(pictureName.value, grid.value);
    }
    if (result.success) {
      currPictureName.value = pictureName.value;
      closeSaveModal();
      errorMessage.value = "uspesno sacuvano!";
    } else {
      if(result.message && result.message === "NOT_YOURS"){
        errorMessage.value = "You cannot modify what is not yours";
      }else{
        errorMessage.value = result.message || "Failed to save picture";
      }
    }
  }
  //za ucitavanje slike sa strane
  import { onMounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import Chat from '@/components/Chat.vue';
  const route = useRoute();
  const router = useRouter();

  onMounted(async () => {
    const pictureId = route.params.id as string;
    if (pictureId) {
      const result = await pictureStore.loadPictureById(pictureId);
      if (result.success && pictureStore.currentPicture) {
        grid.value = pictureStore.currentPicture.picture_data;
        pictureName.value = pictureStore.currentPicture.name;
        currPictureName.value = pictureName.value;
        
        //socket deo
        socketStore.initializeSocket();
        
        try{
          await socketStore.connect();

          console.log("KONEKTOVAN dakle ovde je pictureId: " + pictureId);
          socketStore.joinPicture(pictureId);
        }catch(error){
          console.error("Failed to connect socket:", error);
        }
        //event listeneri
        if (socketStore.socket) {
          socketStore.socket.on("pixel_drawn", ({ x, y, color }) => {
            grid.value[x][y] = color;
          });

          socketStore.socket.on("cursor_update", ({ user_id, x, y, username }) => {

            const gridElement = document.querySelector('.grid') as HTMLElement;

            if (gridElement) {
              const rect = gridElement.getBoundingClientRect();
              
              // konv nazad
              const absoluteX = x + rect.left;
              const absoluteY = y + rect.top;
              
              // console.log("tudji kursor:", { x, y, absoluteX, absoluteY, username });
              otherCursors.value[user_id] = { x: absoluteX, y: absoluteY, username };
            }

          });

          socketStore.socket.on("user_left", ({ user_id }) => {
            delete otherCursors.value[user_id];
          });
        }

      } else {
        alert("Failed to load picture.");
        router.push({ name: "galerija" }); // vrati se ako fejluje
      }
    }
  });


  onBeforeUnmount(() => {
    const pictureId = route.params.id as string;
    if (pictureId) {
      socketStore.leavePicture(pictureId);
    }
    socketStore.disconnect();
  });

  </script>
  
  <style scoped>
  .drawing-page {
  
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 10px;
  }
  
  .toolbar {
    margin-right: 20px;
    padding: 4px;
    border-radius: 15px;
    background-color: #f0f0f0;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  }

  /* .pointer-p{
    cursor: pointer;
  } */
  
  .grid {
    display: flex;
    flex-direction: column;
    cursor: crosshair;
  }
  
  .grid-row {
    display: flex;
  }
  
  .grid-cell {
    width: 20px;
    height: 20px;
    border: 1px solid #ccc;
    box-sizing: border-box;
  }

  .resize-section {
      margin-top: 10px;
    }

  .error-message {
    color: red;
    font-size: 0.9em;
    margin-top: 5px;
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
    max-width: 400px;
    width: 100%;
    text-align: center;
  }

  .modal-buttons {
    margin-top: 20px;
  }

  .modal-buttons button {
    margin: 5px;
  }

  /* za kursore */

  .cursors-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
}

.cursor {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.username {
  position: absolute;
  top: -20px;
  left: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}
  </style>
  