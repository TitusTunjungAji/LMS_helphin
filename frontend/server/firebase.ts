import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const BUCKET_NAME = "helphin-lms.firebasestorage.app";

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
}

export function getFirebaseBucket() {
  getFirebaseApp();
  return getStorage().bucket();
}

export async function uploadToFirebase(
  buffer: Buffer,
  fileName: string,
  contentType?: string
): Promise<string> {
  const bucket = getFirebaseBucket();
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: { contentType: contentType || "application/octet-stream" },
  });

  // Make file publicly accessible
  await file.makePublic();

  return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
}

export async function deleteFromFirebase(fileName: string): Promise<void> {
  const bucket = getFirebaseBucket();
  try {
    await bucket.file(fileName).delete();
  } catch {
    // File might not exist, ignore
  }
}

export async function downloadFromFirebase(fileName: string): Promise<Buffer> {
  const bucket = getFirebaseBucket();
  const [buffer] = await bucket.file(fileName).download();
  return buffer;
}
