import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";

export const useSocketStore = defineStore("socket", {
  state: () => ({
    socket: null as Socket | null,
    isConnected: false,
    currentPictureId: null as string | null,
  }),

  actions: {
    initializeSocket() {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No token found");
        return;
      }

      this.socket = io("http://localhost:3001", {
        auth: { 
          token: `Bearer ${token}` 
        },
        autoConnect: false,
      });

      this.bindEvents();
    },

    bindEvents() {
      if (!this.socket) return;

      this.socket.on("connect", () => {
        this.isConnected = true;
        console.log("Socket connected");
        
        if (this.currentPictureId) {
          this.joinPicture(this.currentPictureId);
        }
      });

      this.socket.on("disconnect", () => {
        this.isConnected = false;
        console.log("Socket disconnected");
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
      });
    },

    // connect() {
    //   if (this.socket && !this.isConnected) {
    //     this.socket.connect();
    //   }
    // },
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error("Socket not initialized"));
                return;
            }

            if (this.isConnected) {
                resolve(); //vec konektovan
                return;
            }

            // one-time connect lisener
            this.socket.once("connect", () => {
                this.isConnected = true;
                console.log("Socket connected");
                resolve();
            });

            // one-time connect_error lisener
            this.socket.once("connect_error", (error) => {
                reject(error);
            });

            this.socket.connect();
        });
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
      }
    },

    joinPicture(pictureId: string) {
      if (this.socket && this.isConnected) {
        this.currentPictureId = pictureId;
        this.socket.emit("join_picture", pictureId);
        console.log("join picture " + this.currentPictureId);
      } else {
            console.error("soket nije konektovan wyyy");
        }
    },
    
    leavePicture(pictureId: string) {
      if (this.socket && this.isConnected) {
        this.socket.emit("leave_picture", pictureId);
        this.currentPictureId = null;
      }
    },

    drawPixel(data: { pictureId: string; x: number; y: number; color: string }) {
      if (this.socket && this.isConnected) {
        this.socket.emit("draw_pixel", data);
        console.log("draw pixel for " + this.currentPictureId);
      }
    },

    moveCursor(data: { pictureId: string; x: number; y: number }) {
      if (this.socket && this.isConnected) {
        // console.log("kursor update x:" + data.x + "--y:" + data.y);
        this.socket.emit("cursor_move", data);
      }
    },
    sendChatMessage(data: { pictureId: string; content: string }) {
      console.log("[ iz soketa ] this.socket: " + this.socket + " this.isconn: " + this.isConnected);
      if (this.socket && this.isConnected) {
        console.log("[ iz soketa ] Salje poruku: za picture id: " + data.pictureId + " a poruka je: " + data.content);
        this.socket.emit("chat_message", data);
      }
    },
    sendComment(data: { pictureId: string; comment: string }) {
      if (this.socket && this.isConnected) {
        this.socket.emit("add_comment", data);
      }
    },
    toggleLike(data: { pictureId: string; isLiked: boolean }) {
      if (this.socket && this.isConnected) {
        this.socket.emit("toggle_like", data);
      }
    }

  },
});