"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { entreprise as entrepriseParDefaut } from "../lib/devis-constants";
import type { Entreprise } from "../types/devis";

type UseEntrepriseSettingsParams = {
  entrepriseIdCourante: string | null;
  userId: string | null;
  authChargee: boolean;
};

type EntrepriseSettings = Entreprise & {
  entrepriseId?: string;
  logoUrl?: string;
  logoStoragePath?: string;
  logoRemplaceNomEntreprise?: boolean;
  updatedAt?: number;
  createdAt?: number;
  updatedByUid?: string;
};

function creerEntrepriseDefaut(): EntrepriseSettings {
  return {
    ...entrepriseParDefaut,
    codePostal: "",
    ville: "",
    iban: "",
    mentionsLegalesFacture: "",
    logoUrl: "",
    logoStoragePath: "",
    logoRemplaceNomEntreprise: false,
  };
}

export function useEntrepriseSettings({
  entrepriseIdCourante,
  userId,
  authChargee,
}: UseEntrepriseSettingsParams) {
  const [entrepriseSettings, setEntrepriseSettings] =
    useState<EntrepriseSettings>(creerEntrepriseDefaut());

  const [chargementEntreprise, setChargementEntreprise] = useState(true);
  const [sauvegardeEntrepriseEnCours, setSauvegardeEntrepriseEnCours] =
    useState(false);

  useEffect(() => {
    const chargerEntreprise = async () => {
      if (!authChargee) return;

      if (!entrepriseIdCourante) {
        setEntrepriseSettings(creerEntrepriseDefaut());
        setChargementEntreprise(false);
        return;
      }

      try {
        setChargementEntreprise(true);

        const ref = doc(db, "entreprises", entrepriseIdCourante);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setEntrepriseSettings(creerEntrepriseDefaut());
          return;
        }

        const data = snap.data() as Partial<EntrepriseSettings>;

        setEntrepriseSettings({
          entrepriseId:
            typeof data.entrepriseId === "string"
              ? data.entrepriseId
              : entrepriseIdCourante,
          nom:
            typeof data.nom === "string" && data.nom.trim()
              ? data.nom
              : entrepriseParDefaut.nom,
          adresse:
            typeof data.adresse === "string"
              ? data.adresse
              : entrepriseParDefaut.adresse,
          codePostal:
            typeof data.codePostal === "string" ? data.codePostal : "",
          ville: typeof data.ville === "string" ? data.ville : "",
          email:
            typeof data.email === "string"
              ? data.email
              : entrepriseParDefaut.email,
          telephone:
            typeof data.telephone === "string"
              ? data.telephone
              : entrepriseParDefaut.telephone,
          tva:
            typeof data.tva === "string" ? data.tva : entrepriseParDefaut.tva,
          iban: typeof data.iban === "string" ? data.iban : "",
          mentionsLegalesFacture:
            typeof data.mentionsLegalesFacture === "string"
              ? data.mentionsLegalesFacture
              : "",
          logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : "",
          logoStoragePath:
            typeof data.logoStoragePath === "string"
              ? data.logoStoragePath
              : "",
          logoRemplaceNomEntreprise:
            typeof data.logoRemplaceNomEntreprise === "boolean"
              ? data.logoRemplaceNomEntreprise
              : false,
          createdAt:
            typeof data.createdAt === "number" ? data.createdAt : undefined,
          updatedAt:
            typeof data.updatedAt === "number" ? data.updatedAt : undefined,
          updatedByUid:
            typeof data.updatedByUid === "string"
              ? data.updatedByUid
              : undefined,
        });
      } catch (error) {
        console.error("Erreur chargement entreprise :", error);
        setEntrepriseSettings(creerEntrepriseDefaut());
      } finally {
        setChargementEntreprise(false);
      }
    };

    void chargerEntreprise();
  }, [authChargee, entrepriseIdCourante]);

  const enregistrerEntreprise = async () => {
    if (!entrepriseIdCourante || !userId) {
      alert("Impossible d’identifier l’entreprise ou l’utilisateur.");
      return false;
    }

    try {
      setSauvegardeEntrepriseEnCours(true);

      const maintenant = Date.now();

      await setDoc(
        doc(db, "entreprises", entrepriseIdCourante),
        {
          ...entrepriseSettings,
          entrepriseId: entrepriseIdCourante,
          nom: entrepriseSettings.nom.trim(),
          adresse: entrepriseSettings.adresse.trim(),
          codePostal: entrepriseSettings.codePostal?.trim() ?? "",
          ville: entrepriseSettings.ville?.trim() ?? "",
          email: entrepriseSettings.email.trim(),
          telephone: entrepriseSettings.telephone.trim(),
          tva: entrepriseSettings.tva.trim(),
          iban: entrepriseSettings.iban.trim(),
          mentionsLegalesFacture:
            entrepriseSettings.mentionsLegalesFacture.trim(),
          logoUrl: entrepriseSettings.logoUrl ?? "",
          logoStoragePath: entrepriseSettings.logoStoragePath ?? "",
          logoRemplaceNomEntreprise:
            entrepriseSettings.logoRemplaceNomEntreprise === true,
          updatedAt: maintenant,
          createdAt: entrepriseSettings.createdAt ?? maintenant,
          updatedByUid: userId,
        },
        { merge: true }
      );

      return true;
    } catch (error) {
      console.error("Erreur sauvegarde entreprise :", error);
      alert("Impossible d’enregistrer les informations entreprise.");
      return false;
    } finally {
      setSauvegardeEntrepriseEnCours(false);
    }
  };

  return {
    entrepriseSettings,
    setEntrepriseSettings,
    chargementEntreprise,
    sauvegardeEntrepriseEnCours,
    enregistrerEntreprise,
  };
}
