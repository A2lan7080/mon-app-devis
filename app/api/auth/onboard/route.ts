import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

type Payload = {
  displayName?: string;
  entrepriseNom?: string;
  invitationCode?: string;
};

type ProfilUtilisateurOnboarding = {
  uid?: string;
  email?: string;
  role?: string;
  active?: boolean;
  actif?: boolean;
  entrepriseId?: string;
  displayName?: string;
};

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token || null;
}

function nettoyerChampTexte(valeur: unknown, maxLength: number) {
  return typeof valeur === "string" ? valeur.trim().slice(0, maxLength) : "";
}

function creerEntrepriseId(uid: string) {
  return `ent_${uid}`;
}

function verifierCodeInvitation(invitationCode: string) {
  const betaCode = process.env.BATIFLOW_BETA_CODE?.trim() ?? "";

  if (!betaCode) {
    return {
      ok: false,
      status: 500,
      error:
        "Configuration serveur manquante : BATIFLOW_BETA_CODE n'est pas defini.",
    };
  }

  if (!invitationCode || invitationCode !== betaCode) {
    return {
      ok: false,
      status: 403,
      error: "Code d’invitation invalide",
    };
  }

  return {
    ok: true,
    status: 200,
    error: "",
  };
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token).catch(() => null);

    if (!decodedToken) {
      return NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email?.trim().toLowerCase() ?? "";

    if (!uid || !email) {
      return NextResponse.json(
        { error: "Compte Firebase invalide." },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Payload;
    const displayName = nettoyerChampTexte(body.displayName, 120);
    const entrepriseNom = nettoyerChampTexte(body.entrepriseNom, 140);
    const invitationCode = nettoyerChampTexte(body.invitationCode, 120);
    const validationInvitation = verifierCodeInvitation(invitationCode);

    if (!validationInvitation.ok) {
      return NextResponse.json(
        { error: validationInvitation.error },
        { status: validationInvitation.status }
      );
    }

    if (!displayName) {
      return NextResponse.json(
        { error: "Le nom affiché est obligatoire." },
        { status: 400 }
      );
    }

    if (!entrepriseNom) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est obligatoire." },
        { status: 400 }
      );
    }

    const entrepriseId = creerEntrepriseId(uid);
    const maintenant = Date.now();
    const userRef = adminDb.collection("users").doc(uid);
    const entrepriseRef = adminDb.collection("entreprises").doc(entrepriseId);

    const resultat = await adminDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (userSnap.exists) {
        const profil = userSnap.data() as ProfilUtilisateurOnboarding;
        const profilEntrepriseId =
          typeof profil.entrepriseId === "string"
            ? profil.entrepriseId.trim()
            : "";

        if (profil.uid && profil.uid !== uid) {
          throw new Error("PROFILE_UID_MISMATCH");
        }

        if (profil.role && profil.role !== "admin") {
          throw new Error("PROFILE_ALREADY_EXISTS");
        }

        if (profil.active === false || profil.actif === false) {
          throw new Error("PROFILE_INACTIVE");
        }

        if (profilEntrepriseId && profilEntrepriseId !== entrepriseId) {
          return {
            status: "already-onboarded",
            entrepriseId: profilEntrepriseId,
          };
        }
      }

      const entrepriseSnap = await transaction.get(entrepriseRef);

      if (entrepriseSnap.exists) {
        const entreprise = entrepriseSnap.data() as {
          createdByUid?: string;
          entrepriseId?: string;
        };

        if (
          entreprise.createdByUid &&
          entreprise.createdByUid !== uid
        ) {
          throw new Error("ENTREPRISE_ALREADY_EXISTS");
        }
      }

      transaction.set(
        userRef,
        {
          uid,
          email,
          displayName,
          role: "admin",
          active: true,
          actif: true,
          entrepriseId,
          createdAt: userSnap.exists
            ? (userSnap.data()?.createdAt ?? maintenant)
            : maintenant,
          updatedAt: maintenant,
        },
        { merge: true }
      );

      if (!entrepriseSnap.exists) {
        transaction.set(entrepriseRef, {
          entrepriseId,
          nom: entrepriseNom,
          adresse: "",
          codePostal: "",
          ville: "",
          pays: "Belgique",
          email,
          telephone: "",
          numeroEntreprise: "",
          numeroTVA: "",
          tva: "",
          iban: "",
          logoUrl: "",
          logoStoragePath: "",
          logoRemplaceNomEntreprise: false,
          conditionsDevis: "",
          conditionsFacture: "",
          mentionsLegales: "",
          mentionsLegalesFacture: "",
          plan: "beta",
          subscriptionStatus: "beta",
          trialEndsAt: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          billingEmail: email,
          billingName: displayName,
          createdAt: maintenant,
          updatedAt: maintenant,
          createdByUid: uid,
          updatedByUid: uid,
          active: true,
          actif: true,
        });
      }

      return {
        status: "created",
        entrepriseId,
      };
    });

    return NextResponse.json({
      success: true,
      ...resultat,
    });
  } catch (error) {
    console.error("Erreur onboarding signup :", error);

    if (error instanceof Error) {
      if (error.message === "PROFILE_INACTIVE") {
        return NextResponse.json(
          { error: "Ce compte utilisateur est désactivé." },
          { status: 403 }
        );
      }

      if (
        error.message === "PROFILE_ALREADY_EXISTS" ||
        error.message === "PROFILE_UID_MISMATCH" ||
        error.message === "ENTREPRISE_ALREADY_EXISTS"
      ) {
        return NextResponse.json(
          { error: "Un profil existe déjà pour ce compte." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Impossible d'initialiser le compte." },
      { status: 500 }
    );
  }
}
