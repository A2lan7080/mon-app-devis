import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { adminAuth, adminDb } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

type ReponseOuiNon = "oui" | "non";

type PayloadFeedbackBeta = {
  prenom?: unknown;
  nom?: unknown;
  metier?: unknown;
  reponsesOuiNon?: unknown;
  notes?: unknown;
  reponsesOuvertes?: unknown;
};

type ProfilUtilisateurBeta = {
  email?: string;
  active?: boolean;
  actif?: boolean;
  entrepriseId?: string;
};

const QUESTIONS_OUI_NON = [
  "creationCompte",
  "infosEntreprise",
  "creationClient",
  "creationChantier",
  "creationDevis",
  "ligneManuelle",
  "bibliothequePrestations",
  "pdfDevis",
  "emailDevis",
  "creationFacture",
] as const;

const NOTES = ["mobile", "desktop", "globale"] as const;

const QUESTIONS_OUVERTES = [
  "plusClair",
  "moinsClair",
  "blocage",
  "manquesUsageReel",
  "inutileOuComplique",
  "pretAUtiliser",
  "prixMensuel",
  "autresRemarques",
] as const;

type FeedbackBetaEnregistre = {
  uid: string;
  email: string;
  entrepriseId: string;
  prenom: string;
  nom: string;
  metier: string;
  reponsesOuiNon: Record<(typeof QUESTIONS_OUI_NON)[number], ReponseOuiNon>;
  notes: Record<(typeof NOTES)[number], number>;
  reponsesOuvertes: Record<(typeof QUESTIONS_OUVERTES)[number], string>;
};

const LABELS_OUI_NON: Record<(typeof QUESTIONS_OUI_NON)[number], string> = {
  creationCompte: "Compte cree",
  infosEntreprise: "Infos entreprise completees",
  creationClient: "Client cree",
  creationChantier: "Chantier cree",
  creationDevis: "Devis cree",
  ligneManuelle: "Ligne manuelle ajoutee",
  bibliothequePrestations: "Bibliotheque de prestations utilisee",
  pdfDevis: "PDF devis genere",
  emailDevis: "Devis envoye par email",
  creationFacture: "Facture creee",
};

const LABELS_NOTES: Record<(typeof NOTES)[number], string> = {
  mobile: "Mobile",
  desktop: "Desktop",
  globale: "Globale",
};

const LABELS_OUVERTES: Record<(typeof QUESTIONS_OUVERTES)[number], string> = {
  plusClair: "Le plus clair",
  moinsClair: "Le moins clair",
  blocage: "Blocage ou hesitation",
  manquesUsageReel: "Manques pour une utilisation reelle",
  inutileOuComplique: "Inutile ou trop complique",
  pretAUtiliser: "Pret a utiliser l'outil",
  prixMensuel: "Prix mensuel envisage",
  autresRemarques: "Autres remarques",
};

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token || null;
}

function nettoyerTexte(valeur: unknown, maxLength: number) {
  return typeof valeur === "string" ? valeur.trim().slice(0, maxLength) : "";
}

function estObjetRecord(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

function validerReponsesOuiNon(valeur: unknown) {
  if (!estObjetRecord(valeur)) {
    return null;
  }

  const reponses: Record<(typeof QUESTIONS_OUI_NON)[number], ReponseOuiNon> =
    {} as Record<(typeof QUESTIONS_OUI_NON)[number], ReponseOuiNon>;

  for (const question of QUESTIONS_OUI_NON) {
    const reponse = valeur[question];

    if (reponse !== "oui" && reponse !== "non") {
      return null;
    }

    reponses[question] = reponse;
  }

  return reponses;
}

function validerNotes(valeur: unknown) {
  if (!estObjetRecord(valeur)) {
    return null;
  }

  const notes: Record<(typeof NOTES)[number], number> = {} as Record<
    (typeof NOTES)[number],
    number
  >;

  for (const noteKey of NOTES) {
    const note = Number(valeur[noteKey]);

    if (!Number.isFinite(note) || note < 0 || note > 10) {
      return null;
    }

    notes[noteKey] = Math.round(note);
  }

  return notes;
}

function nettoyerReponsesOuvertes(valeur: unknown) {
  const source = estObjetRecord(valeur) ? valeur : {};
  const reponses: Record<(typeof QUESTIONS_OUVERTES)[number], string> =
    {} as Record<(typeof QUESTIONS_OUVERTES)[number], string>;

  for (const question of QUESTIONS_OUVERTES) {
    reponses[question] = nettoyerTexte(source[question], 2000);
  }

  return reponses;
}

function echapperHtml(valeur: string) {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formaterDateFeedback(date: Date) {
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  }).format(date);
}

function renderFeedbackText(feedback: FeedbackBetaEnregistre, date: Date) {
  const reponsesOuiNon = QUESTIONS_OUI_NON.map(
    (question) =>
      `- ${LABELS_OUI_NON[question]} : ${
        feedback.reponsesOuiNon[question] === "oui" ? "Oui" : "Non"
      }`
  ).join("\n");

  const notesTexte = NOTES.map(
    (noteKey) => `- ${LABELS_NOTES[noteKey]} : ${feedback.notes[noteKey]}/10`
  ).join("\n");

  const reponsesOuvertes = QUESTIONS_OUVERTES.map(
    (question) =>
      `- ${LABELS_OUVERTES[question]} : ${
        feedback.reponsesOuvertes[question] || "-"
      }`
  ).join("\n");

  return [
    `Nouveau retour bêta BatiFlow — ${feedback.prenom} ${feedback.nom}`,
    "",
    `Nom : ${feedback.prenom} ${feedback.nom}`,
    `Email compte : ${feedback.email || "-"}`,
    `EntrepriseId : ${feedback.entrepriseId}`,
    `Metier : ${feedback.metier || "-"}`,
    `Date : ${formaterDateFeedback(date)}`,
    "",
    "Reponses oui/non",
    reponsesOuiNon,
    "",
    "Notes",
    notesTexte,
    "",
    "Reponses ouvertes",
    reponsesOuvertes,
  ].join("\n");
}

function renderFeedbackHtml(feedback: FeedbackBetaEnregistre, date: Date) {
  const renderLignes = (lignes: Array<{ label: string; value: string }>) =>
    lignes
      .map(
        (ligne) =>
          `<tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#475569;">${echapperHtml(
            ligne.label
          )}</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:600;">${echapperHtml(
            ligne.value || "-"
          )}</td></tr>`
      )
      .join("");

  const identite = renderLignes([
    { label: "Nom", value: `${feedback.prenom} ${feedback.nom}` },
    { label: "Email compte", value: feedback.email },
    { label: "EntrepriseId", value: feedback.entrepriseId },
    { label: "Metier", value: feedback.metier },
    { label: "Date", value: formaterDateFeedback(date) },
  ]);

  const reponsesOuiNon = renderLignes(
    QUESTIONS_OUI_NON.map((question) => ({
      label: LABELS_OUI_NON[question],
      value: feedback.reponsesOuiNon[question] === "oui" ? "Oui" : "Non",
    }))
  );

  const notesHtml = renderLignes(
    NOTES.map((noteKey) => ({
      label: LABELS_NOTES[noteKey],
      value: `${feedback.notes[noteKey]}/10`,
    }))
  );

  const reponsesOuvertes = renderLignes(
    QUESTIONS_OUVERTES.map((question) => ({
      label: LABELS_OUVERTES[question],
      value: feedback.reponsesOuvertes[question],
    }))
  );

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:24px;">Nouveau retour bêta BatiFlow</h1>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">${identite}</table>
      <h2 style="margin:24px 0 10px;font-size:18px;">Reponses oui/non</h2>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">${reponsesOuiNon}</table>
      <h2 style="margin:24px 0 10px;font-size:18px;">Notes</h2>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">${notesHtml}</table>
      <h2 style="margin:24px 0 10px;font-size:18px;">Reponses ouvertes</h2>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">${reponsesOuvertes}</table>
    </div>
  </body>
</html>`;
}

async function envoyerEmailAdminFeedback(
  feedback: FeedbackBetaEnregistre,
  date: Date
) {
  const toEmail = process.env.BATIFLOW_BETA_FEEDBACK_EMAIL?.trim();
  const fromEmail = process.env.BATIFLOW_FROM_EMAIL?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  if (!toEmail) {
    console.warn("BATIFLOW_BETA_FEEDBACK_EMAIL manquante : email beta ignore.");
    return false;
  }

  if (!fromEmail || !resendApiKey) {
    console.warn(
      "Configuration email incomplete : email beta ignore, feedback sauvegarde."
    );
    return false;
  }

  const resend = new Resend(resendApiKey);

  const { error } = await resend.emails.send({
    from: `Batiflow <${fromEmail}>`,
    to: [toEmail],
    subject: `Nouveau retour bêta BatiFlow — ${feedback.prenom} ${feedback.nom}`,
    html: renderFeedbackHtml(feedback, date),
    text: renderFeedbackText(feedback, date),
  });

  if (error) {
    console.error("Erreur envoi email feedback beta :", error);
    return false;
  }

  return true;
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

    const profilSnap = await adminDb.collection("users").doc(decodedToken.uid).get();

    if (!profilSnap.exists) {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    const profil = profilSnap.data() as ProfilUtilisateurBeta;
    const entrepriseId = profil.entrepriseId?.trim();

    if (profil.active !== true && profil.actif !== true) {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    if (!entrepriseId) {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as PayloadFeedbackBeta;
    const prenom = nettoyerTexte(body.prenom, 80);
    const nom = nettoyerTexte(body.nom, 80);
    const metier = nettoyerTexte(body.metier, 140);
    const reponsesOuiNon = validerReponsesOuiNon(body.reponsesOuiNon);
    const notes = validerNotes(body.notes);

    if (!prenom || !nom) {
      return NextResponse.json(
        { error: "Le prenom et le nom sont obligatoires." },
        { status: 400 }
      );
    }

    if (!reponsesOuiNon) {
      return NextResponse.json(
        { error: "Les reponses oui/non sont incompletes." },
        { status: 400 }
      );
    }

    if (!notes) {
      return NextResponse.json(
        { error: "Les notes doivent etre comprises entre 0 et 10." },
        { status: 400 }
      );
    }

    const maintenant = new Date();
    const feedback: FeedbackBetaEnregistre = {
      uid: decodedToken.uid,
      email:
        decodedToken.email?.trim().toLowerCase() ??
        profil.email?.trim().toLowerCase() ??
        "",
      entrepriseId,
      prenom,
      nom,
      metier,
      reponsesOuiNon,
      notes,
      reponsesOuvertes: nettoyerReponsesOuvertes(body.reponsesOuvertes),
    };

    await adminDb.collection("betaFeedback").add({
      ...feedback,
      createdAt: FieldValue.serverTimestamp(),
    });

    const emailEnvoye = await envoyerEmailAdminFeedback(
      feedback,
      maintenant
    ).catch((error) => {
      console.error("Erreur email feedback beta non bloquante :", error);
      return false;
    });

    return NextResponse.json({ success: true, emailEnvoye });
  } catch (error) {
    console.error("Erreur route feedback beta :", error);

    return NextResponse.json(
      { error: "Impossible d'enregistrer le retour beta." },
      { status: 500 }
    );
  }
}
