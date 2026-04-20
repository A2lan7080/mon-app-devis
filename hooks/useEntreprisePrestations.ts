"use client";

import { useEffect, useState } from "react";
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
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!authChargee) {
      setPrestations([]);
      setChargement(true);
      return;
    }

    if (!userId || !entrepriseIdCourante) {
      setPrestations([]);
      setChargement(false);
      return;
    }

    if (!estAdmin) {
      setPrestations([]);
      setChargement(false);
      return;
    }

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
        setChargement(false);
      },
      (error) => {
        console.error("Erreur chargement prestations :", error);
        setPrestations([]);
        setChargement(false);
      }
    );

    return () => unsubscribe();
  }, [authChargee, userId, entrepriseIdCourante, estAdmin]);

  return {
    prestations,
    chargement,
  };
}