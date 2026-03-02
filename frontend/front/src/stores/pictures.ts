import { defineStore } from "pinia";
import { useUserStore } from "./user";

// const API_BASE_URL = "https://raf-pixeldraw.aarsen.me/api";
const API_BASE_URL = "http://localhost:3001";

interface Picture {
  picture_id: string;
  name: string;
  picture_data: string[][];
  author: {
    user_id: string;
    username: string;
  };
  created_at: string;
  updated_at: string;
}

interface PictureState {
  pictures: Picture[];
  currentPicture: Picture | null;
}

export const usePictureStore = defineStore("pictures", {
  state: (): PictureState => ({
    pictures: [],
    currentPicture: null,
  }),

  actions: {
    async saveNewPicture(name: string, pictureData: string[][]): Promise<{ success: boolean; message?: string }> {
      const userStore = useUserStore(); // user za autentif

      if (!userStore.token) {
        return { success: false, message: "User not authenticated" };
      }

      try {
        const response = await fetch(`${API_BASE_URL}/pictures/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userStore.token}`,
          },
          body: JSON.stringify({ name, picture_data: pictureData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          return { success: false, message: errorData?.code || "Failed to save picture" };
        }

        const newPicture = await response.json();
        // ako nesto bude trebalo da se radi sa slikom
        return { success: true };
      } catch (error) {
        return { success: false, message: "Network error" };
      }
    },
    
    async loadAllPictures(page: number, author?: string): Promise<{ success: boolean; pictures: Picture[]; hasMorePages: boolean }> {
      try {
        //alert("POZVAN");
        const params = new URLSearchParams({ page: page.toString(), limit: "3" });
        if (author) {
          
          params.append("author", author);
          //params.append("author", 1);
          //alert(author);
        }

        const response = await fetch(`${API_BASE_URL}/pictures?${params.toString()}`);
        //alert("stigao?");
        if (!response.ok) {
          //alert("NIJE USPEO NESTO1");
          return { success: false, pictures: [], hasMorePages: false };
        }

        const data = await response.json();
        //const hasMorePages = data.pictures.length === 3; // da li ima jos str
        const hasMorePages = page * 3 < data.total;
        //alert("USPEO NESTO");
        //alert(data.pictures.length)
        return { success: true, pictures: data.pictures, hasMorePages };
      } catch (error) {
        //alert("NIJE USPEO NESTO2");
        return { success: false, pictures: [], hasMorePages: false };
      }
    },

    async loadPictureById(pictureId: string): Promise<{ success: boolean; message?: string }> {
      try {
        const response = await fetch(`${API_BASE_URL}/pictures/${pictureId}`);

        if (!response.ok) {
          const errorData = await response.json();
          return { success: false, message: errorData?.code || "Picture not found" };
        }

        const data = await response.json();
        this.currentPicture = data.picture;

        return { success: true };
      } catch (error) {
        return { success: false, message: "Network error" };
      }
    },

    async updatePicture(pictureId: string, pictureData: string[][]): Promise<{ success: boolean; message?: string }> {
      const userStore = useUserStore();

      if (!userStore.token) {
        return { success: false, message: "User not authenticated" };
      }

      try {
        const response = await fetch(`${API_BASE_URL}/pictures/${pictureId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userStore.token}`,
          },
          body: JSON.stringify({ picture_data: pictureData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          return { success: false, message: errorData?.code || "Failed to update picture" };
        }

        return { success: true };
      } catch (error) {
        return { success: false, message: "Network error" };
      }
    },

    async deletePicture(pictureId: string): Promise<{ success: boolean; message?: string }> {
      const userStore = useUserStore();

      if (!userStore.token) {
        return { success: false, message: "User not authenticated" };
      }

      try {
        const response = await fetch(`${API_BASE_URL}/pictures/${pictureId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userStore.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          return {
            success: false,
            message: errorData?.code || "Failed to delete picture",
          };
          //return { success: false };
        }

        this.pictures = this.pictures.filter(picture => picture.picture_id !== pictureId);
        return { success: true };
      } catch (error) {
        return { success: false, message: "Random error" };
      }
    },
    
  },
});
