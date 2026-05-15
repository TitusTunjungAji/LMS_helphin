import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const BUCKET_NAME = "helphin-lms.firebasestorage.app";

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];

  // Try individual env vars first (more reliable on Vercel)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;

  if (projectId && clientEmail && privateKeyBase64) {
    const privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf-8");
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: BUCKET_NAME,
    });
  }

  // Fallback: full JSON env var
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error("Firebase credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY_BASE64.");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

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
