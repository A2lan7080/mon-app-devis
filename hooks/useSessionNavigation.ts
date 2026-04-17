"use client";

import { useCallback } from "react";
import { signOut } from "firebase/auth";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { auth } from "../lib/firebase";

export function useSessionNavigation(router: AppRouterInstance) {
  const goToLogin = useCallback(() => {
    router.push("/login");
  }, [router]);

  const handleDeconnexion = useCallback(async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Erreur déconnexion :", error);
      alert("Impossible de se déconnecter.");
    }
  }, [router]);

  return {
    goToLogin,
    handleDeconnexion,
  };
}