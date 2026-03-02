import { defineStore } from "pinia";

// const API_BASE_URL = "https://raf-pixeldraw.aarsen.me/api";
const API_BASE_URL = "http://localhost:3001";


// "klase"
interface UserState {
  token: string | null;
  userId: number | null;
  username: string | null;
  isAuthenticated: boolean;
}

interface LoginResponse {
  success: boolean;
  message?: string;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    token: null,
    userId: null,
    username: null,
    isAuthenticated: false,
  }),

  actions: {
    async login(username: string, password: string): Promise<LoginResponse> {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          return {
            success: false,
            message: errorData?.code || "Unknown error",
          };
        }

        const data = await response.json();
        this.token = data.token;
        this.userId = data.user_id;
        this.username = data.username;
        this.isAuthenticated = true;

        // cuvanje
        if(this.token){
            localStorage.setItem("authToken", this.token);
            return { success: true };
        }
        return { success: false, message: "Token was null :(" };
      } catch (error) {
        return { success: false, message: "Some random error" };
      }
    },

    async register(username: string, password: string): Promise<RegisterResponse> {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          return {
            success: false,
            message: errorData?.code || "Unknown error",
          };
        }

        const data = await response.json();
        this.userId = data.user_id;

        return { success: true };
      } catch (error) {
        return { success: false, message: "Network error" };
      }
    },

    logout(): void {
      this.token = null;
      this.userId = null;
      this.username = null;
      this.isAuthenticated = false;

      localStorage.removeItem("authToken");
    },

    loadStoredToken(): void {
      const token = localStorage.getItem("authToken");
      if (token) {
        this.token = token;
        this.isAuthenticated = true;
      }
    },
  },
});
