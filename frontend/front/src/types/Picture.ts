export interface Picture {
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