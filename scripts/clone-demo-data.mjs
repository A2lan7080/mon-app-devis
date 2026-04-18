import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const SOURCE_ENTREPRISE_ID = "demo-01";
const TARGET_ENTREPRISE_IDS = ["demo-02", "demo-03", "demo-04", "demo-05"];

function now() {
  return Date.now();
}

function makeId(prefix, entrepriseId) {
  return `${entrepriseId}-${prefix}-${now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

async function loadCollectionByEntreprise(collectionName, entrepriseId) {
  const snapshot = await db
    .collection(collectionName)
    .where("entrepriseId", "==", entrepriseId)
    .get();

  return snapshot.docs.map((doc) => ({
    docId: doc.id,
    ...doc.data(),
  }));
}

async function deleteCollectionByEntreprise(collectionName, entrepriseId) {
  const snapshot = await db
    .collection(collectionName)
    .where("entrepriseId", "==", entrepriseId)
    .get();

  const docs = snapshot.docs;

  for (const docSnap of docs) {
    await docSnap.ref.delete();
  }
}

async function cleanTargetEntreprise(targetEntrepriseId) {
  await deleteCollectionByEntreprise("factures", targetEntrepriseId);
  await deleteCollectionByEntreprise("devis", targetEntrepriseId);
  await deleteCollectionByEntreprise("chantiers", targetEntrepriseId);
  await deleteCollectionByEntreprise("clients", targetEntrepriseId);
}

async function cloneToEntreprise(targetEntrepriseId) {
  console.log(`Nettoyage ${targetEntrepriseId}...`);
  await cleanTargetEntreprise(targetEntrepriseId);

  const [clients, chantiers, devis, factures] = await Promise.all([
    loadCollectionByEntreprise("clients", SOURCE_ENTREPRISE_ID),
    loadCollectionByEntreprise("chantiers", SOURCE_ENTREPRISE_ID),
    loadCollectionByEntreprise("devis", SOURCE_ENTREPRISE_ID),
    loadCollectionByEntreprise("factures", SOURCE_ENTREPRISE_ID),
  ]);

  const clientIdMap = new Map();
  const chantierIdMap = new Map();

  for (const client of clients) {
    const newId = makeId("cl", targetEntrepriseId);

    clientIdMap.set(client.id, newId);

    const clonedClient = {
      ...client,
      id: newId,
      entrepriseId: targetEntrepriseId,
      createdAt: now(),
      updatedAt: now(),
      archive: client.archive ?? false,
    };

    delete clonedClient.docId;

    await db.collection("clients").doc(newId).set(clonedClient);
  }

  for (const chantier of chantiers) {
    const newId = makeId("ch", targetEntrepriseId);

    chantierIdMap.set(chantier.id, newId);

    const clonedChantier = {
      ...chantier,
      id: newId,
      entrepriseId: targetEntrepriseId,
      clientId: clientIdMap.get(chantier.clientId) ?? "",
      createdAt: now(),
      updatedAt: now(),
      archive: chantier.archive ?? false,
    };

    delete clonedChantier.docId;

    await db.collection("chantiers").doc(newId).set(clonedChantier);
  }

  for (const devisItem of devis) {
    const newId = makeId("dev", targetEntrepriseId);

    const clonedDevis = {
      ...devisItem,
      id: newId,
      entrepriseId: targetEntrepriseId,
      clientId: clientIdMap.get(devisItem.clientId) ?? devisItem.clientId ?? "",
      createdAt: now(),
      archive: devisItem.archive ?? false,
      lignes: Array.isArray(devisItem.lignes)
        ? devisItem.lignes.map((ligne, index) => ({
            ...ligne,
            id: `${newId}-L-${index + 1}`,
          }))
        : [],
    };

    delete clonedDevis.docId;

    await db.collection("devis").doc(newId).set(clonedDevis);
  }

  for (const facture of factures) {
    const newId = makeId("fa", targetEntrepriseId);

    const clonedFacture = {
      ...facture,
      id: newId,
      entrepriseId: targetEntrepriseId,
      clientId: clientIdMap.get(facture.clientId) ?? "",
      chantierId: chantierIdMap.get(facture.chantierId) ?? "",
      createdAt: now(),
      updatedAt: now(),
      archive: facture.archive ?? false,
    };

    delete clonedFacture.docId;

    await db.collection("factures").doc(newId).set(clonedFacture);
  }

  console.log(`Clone terminé pour ${targetEntrepriseId}`);
}

async function main() {
  for (const entrepriseId of TARGET_ENTREPRISE_IDS) {
    await cloneToEntreprise(entrepriseId);
  }

  console.log("Duplication terminée.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});