"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Client } from "../types/clients";

type Params = {
  authChargee: boolean;
  userId: string | null;
  entrepriseIdCourante: string | null;
  estAdmin: boolean;
};

type Result = {
  clients: Client[];
  chargement: boolean;
};

type SnapshotState = {
  key: string | null;
  clients: Client[];
  resolved: boolean;
};

export function useEntrepriseClients({
  authChargee,
  userId,
  entrepriseIdCourante,
  estAdmin,
}: Params): Result {
  const [snapshotState, setSnapshotState] = useState<SnapshotState>({
    key: null,
    clients: [],
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

    const clientsQuery = query(
      collection(db, "clients"),
      where("entrepriseId", "==", entrepriseIdCourante)
    );

    const unsubscribe = onSnapshot(
      clientsQuery,
      (snapshot) => {
        const donnees = snapshot.docs
          .map((item) => item.data() as Client)
          .filter((item) => item && item.id && item.nom)
          .sort((a, b) => {
            const aUpdated = a.updatedAt ?? a.createdAt ?? 0;
            const bUpdated = b.updatedAt ?? b.createdAt ?? 0;
            return bUpdated - aUpdated;
          });

        setSnapshotState({
          key: cleCourante,
          clients: donnees,
          resolved: true,
        });
      },
      (error) => {
        console.error("Erreur lecture clients :", error);

        setSnapshotState({
          key: cleCourante,
          clients: [],
          resolved: true,
        });
      }
    );

    return () => unsubscribe();
  }, [cleCourante, entrepriseIdCourante]);

  const clients = useMemo(() => {
    if (!cleCourante) {
      return [];
    }

    if (snapshotState.key !== cleCourante) {
      return [];
    }

    return snapshotState.clients;
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
    clients,
    chargement,
  };
}