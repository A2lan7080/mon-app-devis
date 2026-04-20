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
  logoUrl?: string;
  updatedAt?: number;
  createdAt?: number;
};

export function useEntrepriseSettings({
  entrepriseIdCourante,
  userId,
  authChargee,
}: UseEntrepriseSettingsParams) {
  const [entrepriseSettings, setEntrepriseSettings] =
    useState<EntrepriseSettings>({
      ...entrepriseParDefaut,
      logoUrl: "",
    });
  const [chargementEntreprise, setChargementEntreprise] = useState(true);
  const [sauvegardeEntrepriseEnCours, setSauvegardeEntrepriseEnCours] =
    useState(false);

  useEffect(() => {
    const chargerEntreprise = async () => {
      if (!authChargee) return;

      if (!entrepriseIdCourante) {
        setEntrepriseSettings({
          ...entrepriseParDefaut,
          logoUrl: "",
        });
        setChargementEntreprise(false);
        return;
      }

      try {
        setChargementEntreprise(true);

        const ref = doc(db, "entreprises", entrepriseIdCourante);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setEntrepriseSettings({
            ...entrepriseParDefaut,
            logoUrl: "",
          });
          return;
        }

        const data = snap.data() as Partial<EntrepriseSettings>;

        setEntrepriseSettings({
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
          tva:
            typeof data.tva === "string" ? data.tva : entrepriseParDefaut.tva,
          logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : "",
          createdAt:
            typeof data.createdAt === "number" ? data.createdAt : undefined,
          updatedAt:
            typeof data.updatedAt === "number" ? data.updatedAt : undefined,
        });
      } catch (error) {
        console.error("Erreur chargement entreprise :", error);
        setEntrepriseSettings({
          ...entrepriseParDefaut,
          logoUrl: "",
        });
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