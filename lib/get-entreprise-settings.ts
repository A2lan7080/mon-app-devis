import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { entreprise as entrepriseParDefaut } from "./devis-constants";
import type { Entreprise } from "../types/devis";

export type EntrepriseSettings = Entreprise & {
  logoUrl?: string;
  updatedAt?: number;
  createdAt?: number;
};

export async function getEntrepriseSettings(
  entrepriseId?: string | null
): Promise<EntrepriseSettings> {
  if (!entrepriseId) {
    return {
      ...entrepriseParDefaut,
      logoUrl: "",
    };
  }

  try {
    const ref = doc(db, "entreprises", entrepriseId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return {
        ...entrepriseParDefaut,
        logoUrl: "",
      };
    }

    const data = snap.data() as Partial<EntrepriseSettings>;

    return {
      nom:
        typeof data.nom === "string" && data.nom.trim()
          ? data.nom
          : entrepriseParDefaut.nom,
      adresse:
        typeof data.adresse === "string"
          ? data.adresse
          : entrepriseParDefaut.adresse,
      email:
        typeof data.email === "string"
          ? data.email
          : entrepriseParDefaut.email,
      telephone:
        typeof data.telephone === "string"
          ? data.telephone
          : entrepriseParDefaut.telephone,
      tva: typeof data.tva === "string" ? data.tva : entrepriseParDefaut.tva,
      logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : "",
      createdAt: typeof data.createdAt === "number" ? data.createdAt : undefined,
      updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : undefined,
    };
  } catch (error) {
    console.error("Erreur lecture entreprise settings :", error);

    return {
      ...entrepriseParDefaut,
      logoUrl: "",
    };
  }
}