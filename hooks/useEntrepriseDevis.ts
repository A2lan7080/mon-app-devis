"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { DevisBusiness } from "./useDevisActions";

type Params = {
  authChargee: boolean;
  userId: string | null;
  entrepriseIdCourante: string | null;
  estAdmin: boolean;
};

type Result = {
  devis: DevisBusiness[];
  chargement: boolean;
};

type SnapshotState = {
  key: string | null;
  devis: DevisBusiness[];
  resolved: boolean;
};

export function useEntrepriseDevis({
  authChargee,
  userId,
  entrepriseIdCourante,
  estAdmin,
}: Params): Result {
  const [snapshotState, setSnapshotState] = useState<SnapshotState>({
    key: null,
    devis: [],
    resolved: false,
  });

  const cleCourante = useMemo(() => {
    if (!authChargee || !userId || !entrepriseIdCourante || !estAdmin) {
      return null;
    }

    return `${userId}::${entrepriseIdCourante}`;
  }, [authChargee, userId, entrepriseIdCourante, estAdmin]);

  useEffect(() => {
    if (!cleCourante || !entrepriseIdCourante) {
      return;
    }

    const devisQuery = query(
      collection(db, "devis"),
      where("entrepriseId", "==", entrepriseIdCourante)
    );

    const unsubscribe = onSnapshot(
      devisQuery,
      (snapshot) => {
        const donnees = snapshot.docs
          .map((item) => ({
            ...(item.data() as DevisBusiness),
            id: item.id,
          }))
          .filter((item) => item && item.id && item.client)
          .sort((a, b) => {
            const aCreated = a.createdAt ?? 0;
            const bCreated = b.createdAt ?? 0;
            return bCreated - aCreated;
          });

        setSnapshotState({
          key: cleCourante,
          devis: donnees,
          resolved: true,
        });
      },
      (error) => {
        console.error("Erreur lecture devis :", error);

        setSnapshotState({
          key: cleCourante,
          devis: [],
          resolved: true,
        });
      }
    );

    return () => unsubscribe();
  }, [cleCourante, entrepriseIdCourante]);

  const devis = useMemo(() => {
    if (!cleCourante) {
      return [];
    }

    if (snapshotState.key !== cleCourante) {
      return [];
    }

    return snapshotState.devis;
  }, [cleCourante, snapshotState]);

  const chargement = useMemo(() => {
    if (!authChargee) {
      return true;
    }

    if (!cleCourante) {
      return false;
    }

    return !(snapshotState.key === cleCourante && snapshotState.resolved);
  }, [authChargee, cleCourante, snapshotState]);

  return {
    devis,
    chargement,
  };
}
