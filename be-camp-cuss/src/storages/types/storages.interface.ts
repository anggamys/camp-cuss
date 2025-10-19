export interface UploadedFileResult {
  key: string;
}

export interface SignedUrlResponse {
  data: { signedUrl: string } | null;
  error: { message: string } | null;
}
