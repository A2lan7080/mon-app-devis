import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type AppSession = {
  user: User;
  entrepriseId: string;
  role: string;
  nom: string;
};

export async function attendreSession(): Promise<AppSession> {
  const authUser = await new Promise<User>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe();

        try {
          if (user) {
            resolve(user);
            return;
          }

          const credentials = await signInAnonymously(auth);
          resolve(credentials.user);
        } catch (error) {
          reject(error);
        }
      },
      reject
    );
  });

  const userRef = doc(db, "users", authUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("Utilisateur sans profil Firestore.");
  }

  const data = userSnap.data() as {
    entrepriseId?: string;
    role?: string;
    nom?: string;
  };

  if (!data.entrepriseId) {
    throw new Error("Aucun entrepriseId trouvé pour cet utilisateur.");
  }

  return {
    user: authUser,
    entrepriseId: data.entrepriseId,
    role: data.role ?? "ouvrier",
    nom: data.nom ?? "",
  };
}