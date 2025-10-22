export interface UploadConfig {
  folder: string;
  isPrivate: boolean;
  oldKey?: string | null;
  update: (
    uid: number,
    fileKey: string,
  ) => Promise<{ id: number; [key: string]: any }>;
}

export interface UploadResponse {
  status: string;
  message: string;
  data: { id: number; [key: string]: any };
}
