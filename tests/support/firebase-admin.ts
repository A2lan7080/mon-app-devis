import { createHash, randomBytes } from "node:crypto";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { loadDotEnvLocal } from "./env";

loadDotEnvLocal();

function getCredential() {
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

const app =
  getApps()[0] ??
  initializeApp({
    credential: getCredential(),
    projectId:
      process.env.FIREBASE_ADMIN_PROJECT_ID ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

export type TestIdentity = {
  uid: string;
  email: string;
  password: string;
  entrepriseId: string;
  prestationId: string;
};

export async function createBatiflowTestIdentity(): Promise<TestIdentity> {
  const runId = Date.now().toString(36);
  const entrepriseId = `e2e-${runId}`;
  const email = `admin-${runId}@batiflow-e2e.test`;
  const password = `BatiFlow-${runId}-Test!`;
  const user = await adminAuth.createUser({
    email,
    password,
    displayName: "Admin E2E",
  });
  const now = Date.now();
  const prestationId = `${entrepriseId}-prest-main`;

  await adminDb.collection("users").doc(user.uid).set({
    uid: user.uid,
    email,
    role: "admin",
    active: true,
    entrepriseId,
    displayName: "Admin E2E",
    createdAt: now,
  });

  await adminDb.collection("entreprises").doc(entrepriseId).set({
    entrepriseId,
    nom: "BatiFlow E2E",
    adresse: "1 rue des Tests",
    codePostal: "1000",
    ville: "Bruxelles",
    email: "contact@batiflow-e2e.test",
    telephone: "+32 2 000 00 00",
    tva: "BE0123456789",
    iban: "BE68 5390 0754 7034",
    mentionsLegalesFacture: "Facture payable sous 30 jours.",
    logoUrl: "",
    logoStoragePath: "",
    logoRemplaceNomEntreprise: false,
    createdByUid: user.uid,
    updatedByUid: user.uid,
    createdAt: now,
    updatedAt: now,
  });

  await adminDb.collection("prestationsBibliotheque").doc(prestationId).set({
    id: prestationId,
    reference: "PRE-E2E-001",
    designation: "Forfait bibliothèque E2E",
    unite: "forfait",
    prixUnitaire: 250,
    description: "Prestation créée pour le parcours Playwright V1.",
    entrepriseId,
    createdByUid: user.uid,
    archive: false,
    createdAt: now,
    updatedAt: now,
  });

  return {
    uid: user.uid,
    email,
    password,
    entrepriseId,
    prestationId,
  };
}

export async function cleanupBatiflowTestIdentity(identity: TestIdentity) {
  if (!identity.entrepriseId.startsWith("e2e-")) {
    throw new Error("Refus de nettoyer une entreprise qui n'est pas E2E.");
  }

  const collections = [
    "devisAcceptanceLinks",
    "factures",
    "devis",
    "chantiers",
    "clients",
    "prestationsBibliotheque",
  ];

  for (const collectionName of collections) {
    const snapshot = await adminDb
      .collection(collectionName)
      .where("entrepriseId", "==", identity.entrepriseId)
      .get();

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  await adminDb.collection("entreprises").doc(identity.entrepriseId).delete();
  await adminDb.collection("users").doc(identity.uid).delete();
  await adminAuth.deleteUser(identity.uid).catch(() => undefined);
}

export async function findLatestDevis(entrepriseId: string) {
  const snapshot = await adminDb
    .collection("devis")
    .where("entrepriseId", "==", entrepriseId)
    .get();

  return (
    snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0] ?? null
  );
}

export async function findLatestClient(entrepriseId: string) {
  const snapshot = await adminDb
    .collection("clients")
    .where("entrepriseId", "==", entrepriseId)
    .get();

  return (
    snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0] ?? null
  );
}

export async function findLatestFacture(entrepriseId: string) {
  const snapshot = await adminDb
    .collection("factures")
    .where("entrepriseId", "==", entrepriseId)
    .get();

  return (
    snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0] ?? null
  );
}

export async function mockSendDevisByEmail(params: {
  devisId: string;
  entrepriseId: string;
  toEmail: string;
}) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  const now = Date.now();

  await adminDb.batch()
    .set(adminDb.collection("devisAcceptanceLinks").doc(tokenHash), {
      devisId: params.devisId,
      entrepriseId: params.entrepriseId,
      createdAt: now,
      sentToEmail: params.toEmail,
      mockedBy: "playwright",
    })
    .update(adminDb.collection("devis").doc(params.devisId), {
      statut: "Envoyé",
      acceptanceTokenHash: tokenHash,
      acceptanceTokenCreatedAt: now,
      acceptanceTokenLastSentAt: now,
    })
    .commit();

  return token;
}
