export type UserPhotoField =
  | 'photo_profile'
  | 'photo_id_card'
  | 'photo_student_card'
  | 'photo_driving_license';

export interface UploadConfig {
  field: UserPhotoField;
  folder: string;
  isPrivate: boolean;
}

export interface UploadResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}
