"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { PrestationBibliotheque } from "../types/prestations";

type Params = {
  authChargee: boolean;
  userId: string | null;
  entrepriseIdCourante: string | null;
  estAdmin: boolean;
};

export function useEntreprisePrestations({
  authChargee,
  userId,
  entrepriseIdCourante,
  estAdmin,
}: Params) {
  const [prestations, setPrestations] = useState<PrestationBibliotheque[]>([]);
  const [chargementInterne, setChargementInterne] = useState(true);

  const peutCharger = useMemo(
    () =>
      authChargee &&
      !!userId &&
      !!entrepriseIdCourante &&
      estAdmin,
    [authChargee, userId, entrepriseIdCourante, estAdmin]
  );

  useEffect(() => {
    if (!peutCharger || !entrepriseIdCourante) {
      return;
    }

    setChargementInterne(true);

    const q = query(
      collection(db, "prestationsBibliotheque"),
      where("entrepriseId", "==", entrepriseIdCourante)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docItem) => {
          const data = docItem.data() as Omit<PrestationBibliotheque, "id">;

          return {
            id: docItem.id,
            ...data,
          };
        });

        items.sort((a, b) => {
          const dateA = a.createdAt ?? 0;
          const dateB = b.createdAt ?? 0;
          return dateB - dateA;
        });

        setPrestations(items);
        setChargementInterne(false);
      },
      (error) => {
        console.error("Erreur chargement prestations :", error);
        setPrestations([]);
        setChargementInterne(false);
      }
    );

    return () => unsubscribe();
  }, [peutCharger, entrepriseIdCourante]);

  return {
    prestations: peutCharger ? prestations : [],
    chargement: !authChargee ? true : peutCharger ? chargementInterne : false,
  };
}