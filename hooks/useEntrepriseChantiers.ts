"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Chantier } from "../types/chantiers";

type Params = {
  authChargee: boolean;
  userId: string | null;
  entrepriseIdCourante: string | null;
  estAdmin: boolean;
};

type Result = {
  chantiers: Chantier[];
  chargement: boolean;
};

type SnapshotState = {
  key: string | null;
  chantiers: Chantier[];
  resolved: boolean;
};

export function useEntrepriseChantiers({
  authChargee,
  userId,
  entrepriseIdCourante,
  estAdmin,
}: Params): Result {
  const [snapshotState, setSnapshotState] = useState<SnapshotState>({
    key: null,
    chantiers: [],
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

    const chantiersQuery = query(
      collection(db, "chantiers"),
      where("entrepriseId", "==", entrepriseIdCourante)
    );

    const unsubscribe = onSnapshot(
      chantiersQuery,
      (snapshot) => {
        const donnees = snapshot.docs
          .map((item) => item.data() as Chantier)
          .filter((item) => item && item.id && item.titre)
          .sort((a, b) => {
            const aUpdated = a.updatedAt ?? a.createdAt ?? 0;
            const bUpdated = b.updatedAt ?? b.createdAt ?? 0;
            return bUpdated - aUpdated;
          });

        setSnapshotState({
          key: cleCourante,
          chantiers: donnees,
          resolved: true,
        });
      },
      (error) => {
        console.error("Erreur lecture chantiers :", error);

        setSnapshotState({
          key: cleCourante,
          chantiers: [],
          resolved: true,
        });
      }
    );

    return () => unsubscribe();
  }, [cleCourante, entrepriseIdCourante]);

  const chantiers = useMemo(() => {
    if (!cleCourante) {
      return [];
    }

    if (snapshotState.key !== cleCourante) {
      return [];
    }

    return snapshotState.chantiers;
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
    chantiers,
    chargement,
  };
}