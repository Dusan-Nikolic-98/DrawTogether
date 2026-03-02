export type BasePictureDto = {
  name: string;
  picture_data: string[][];
};

export type PictureDto = BasePictureDto & {
  picture_id: string;
  author: {
    user_id: string;
    username: string;
  };
  created_at: string;
  updated_at: string;
};