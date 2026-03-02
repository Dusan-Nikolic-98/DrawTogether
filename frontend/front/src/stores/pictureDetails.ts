import { defineStore } from "pinia";

const API_BASE_URL = "http://localhost:3001";

interface Comment {
  id: string;
  username: string;
  content: string;
  created_at: string;
}

interface PictureDetail {
  likes: number;
  dislikes: number;
  comments: Comment[];
}

interface PictureDetailsState {
  details: Record<string, PictureDetail>;
}

export const usePictureDetailsStore = defineStore("pictureDetails", {
  state: (): PictureDetailsState => ({
    details: {},
  }),

  actions: {
    async loadDetails(): Promise<void> {
      try {
        const res = await fetch(`${API_BASE_URL}/pictures/details`);
        if (!res.ok) throw new Error("Failed to load details");

        const data = await res.json();
        this.details = data;
      } catch (err) {
        console.error("Error loading picture details:", err);
      }
    },

    updateLike(pictureId: string, likes: number, dislikes: number): void {
      if (!this.details[pictureId]) {
        this.details[pictureId] = { likes, dislikes, comments: [] };
      } else {
        this.details[pictureId].likes = likes;
        this.details[pictureId].dislikes = dislikes;
      }
    },

    addComment(pictureId: string, comment: Comment): void {
      if (!this.details[pictureId]) {
        this.details[pictureId] = { likes: 0, dislikes: 0, comments: [] };
      }
      this.details[pictureId].comments.push(comment);
    },
  },
});
