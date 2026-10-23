import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../lib/firebase/firebase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateProductImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "The image must be smaller than 5 MB.";
  }

  return null;
}

export async function uploadProductImage(file: File): Promise<string> {
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const uniqueFileName = `${Date.now()}-${safeFileName}`;
  const imageRef = ref(storage, `products/${uniqueFileName}`);

  await uploadBytes(imageRef, file, {
    contentType: file.type,
  });

  return getDownloadURL(imageRef);
}
