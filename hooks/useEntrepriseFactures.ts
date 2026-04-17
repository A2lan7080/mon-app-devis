"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Facture } from "../types/factures";

type Params = {
  authChargee: boolean;
  userId: string | null;
  entrepriseIdCourante: string | null;
  estAdmin: boolean;
};

type Result = {
  factures: Facture[];
  chargement: boolean;
};

type SnapshotState = {
  key: string | null;
  factures: Facture[];
  resolved: boolean;
};

export function useEntrepriseFactures({
  authChargee,
  userId,
  entrepriseIdCourante,
  estAdmin,
}: Params): Result {
  const [snapshotState, setSnapshotState] = useState<SnapshotState>({
    key: null,
    factures: [],
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

    const facturesQuery = query(
      collection(db, "factures"),
      where("entrepriseId", "==", entrepriseIdCourante)
    );

    const unsubscribe = onSnapshot(
      facturesQuery,
      (snapshot) => {
        const donnees = snapshot.docs
          .map((item) => item.data() as Facture)
          .filter((item) => item && item.id && item.reference)
          .sort((a, b) => {
            const aUpdated = a.updatedAt ?? a.createdAt ?? 0;
            const bUpdated = b.updatedAt ?? b.createdAt ?? 0;
            return bUpdated - aUpdated;
          });

        setSnapshotState({
          key: cleCourante,
          factures: donnees,
          resolved: true,
        });
      },
      (error) => {
        console.error("Erreur lecture factures :", error);

        setSnapshotState({
          key: cleCourante,
          factures: [],
          resolved: true,
        });
      }
    );

    return () => unsubscribe();
  }, [cleCourante, entrepriseIdCourante]);

  const factures = useMemo(() => {
    if (!cleCourante) {
      return [];
    }

    if (snapshotState.key !== cleCourante) {
      return [];
    }

    return snapshotState.factures;
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
    factures,
    chargement,
  };
}