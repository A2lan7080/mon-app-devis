import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdminCredentials() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    return cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key?.replace(/\\n/g, "\n"),
    });
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  return applicationDefault();
}

const firebaseAdminApp =
  getApps()[0] ??
  initializeApp({
    credential: getFirebaseAdminCredentials(),
    projectId:
      process.env.FIREBASE_ADMIN_PROJECT_ID ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);
