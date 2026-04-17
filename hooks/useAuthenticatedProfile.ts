"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { auth, db } from "../lib/firebase";

export type ProfilUtilisateur = {
  uid: string;
  email: string;
  role: string;
  active: boolean;
  entrepriseId: string;
  displayName: string;
  createdAt?: number;
};

type UseAuthenticatedProfileResult = {
  user: User | null;
  profilUtilisateur: ProfilUtilisateur | null;
  authChargee: boolean;
  erreurAcces: string | null;
};

export function useAuthenticatedProfile(
  router: AppRouterInstance
): UseAuthenticatedProfileResult {
  const [user, setUser] = useState<User | null>(null);
  const [profilUtilisateur, setProfilUtilisateur] =
    useState<ProfilUtilisateur | null>(null);
  const [authChargee, setAuthChargee] = useState(false);
  const [erreurAcces, setErreurAcces] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const chargerProfilUtilisateur = async () => {
        if (!currentUser) {
          setUser(null);
          setProfilUtilisateur(null);
          setErreurAcces(null);
          setAuthChargee(true);
          router.push("/login");
          return;
        }

        try {
          setErreurAcces(null);

          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces(
              "Ton profil utilisateur n’existe pas dans Firestore. Crée d’abord le document users/{uid} avec un rôle, un statut actif et un entrepriseId valide."
            );
            return;
          }

          const data = userSnap.data() as Partial<ProfilUtilisateur>;

          if (data.uid !== currentUser.uid) {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces("Le profil utilisateur est invalide.");
            return;
          }

          if (data.active !== true) {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces("Ce compte est désactivé.");
            return;
          }

          if (!data.entrepriseId || typeof data.entrepriseId !== "string") {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces(
              "Aucun entrepriseId valide n’est défini sur ce compte."
            );
            return;
          }

          if (data.role !== "admin" && data.role !== "ouvrier") {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces("Le rôle utilisateur est invalide.");
            return;
          }

          const profil: ProfilUtilisateur = {
            uid: currentUser.uid,
            email:
              typeof data.email === "string"
                ? data.email
                : currentUser.email ?? "",
            role: data.role,
            active: true,
            entrepriseId: data.entrepriseId,
            displayName:
              typeof data.displayName === "string" && data.displayName.trim()
                ? data.displayName
                : currentUser.displayName ??
                  currentUser.email?.split("@")[0] ??
                  "Utilisateur",
            createdAt:
              typeof data.createdAt === "number" ? data.createdAt : undefined,
          };

          setUser(currentUser);
          setProfilUtilisateur(profil);
        } catch (error) {
          console.error("Erreur chargement profil utilisateur :", error);
          setUser(currentUser);
          setProfilUtilisateur(null);
          setErreurAcces("Impossible de charger le profil utilisateur.");
        } finally {
          setAuthChargee(true);
        }
      };

      void chargerProfilUtilisateur();
    });

    return () => unsubscribe();
  }, [router]);

  return {
    user,
    profilUtilisateur,
    authChargee,
    erreurAcces,
  };
}