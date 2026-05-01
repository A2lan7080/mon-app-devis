"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import AccessDeniedState from "../../components/AccessDeniedState";
import EmptyAuthState from "../../components/EmptyAuthState";
import PageLoadingState from "../../components/PageLoadingState";
import { useAuthenticatedProfile } from "../../hooks/useAuthenticatedProfile";
import { useSessionNavigation } from "../../hooks/useSessionNavigation";

type ReponseOuiNon = "oui" | "non";
type ReponseOuiNonForm = ReponseOuiNon | "";

type FeedbackBetaForm = {
  prenom: string;
  nom: string;
  metier: string;
  reponsesOuiNon: Record<QuestionOuiNonId, ReponseOuiNonForm>;
  notes: Record<NoteId, string>;
  reponsesOuvertes: Record<QuestionOuverteId, string>;
};

const missionTest = [
  "Compléter les informations de votre entreprise.",
  "Créer un client.",
  "Créer un chantier.",
  "Créer un devis.",
  "Ajouter une ligne manuelle.",
  "Ajouter une prestation depuis la bibliothèque.",
  "Générer le PDF du devis.",
  "Envoyer le devis par email.",
  "Créer une facture.",
  "Générer le PDF de la facture.",
];

const questionsOuiNon = [
  {
    id: "creationCompte",
    label: "Avez-vous réussi à créer votre compte ?",
  },
  {
    id: "infosEntreprise",
    label: "Avez-vous réussi à compléter les infos entreprise ?",
  },
  {
    id: "creationClient",
    label: "Avez-vous réussi à créer un client ?",
  },
  {
    id: "creationChantier",
    label: "Avez-vous réussi à créer un chantier ?",
  },
  {
    id: "creationDevis",
    label: "Avez-vous réussi à créer un devis ?",
  },
  {
    id: "ligneManuelle",
    label: "Avez-vous réussi à ajouter une ligne manuelle ?",
  },
  {
    id: "bibliothequePrestations",
    label: "Avez-vous réussi à utiliser la bibliothèque de prestations ?",
  },
  {
    id: "pdfDevis",
    label: "Avez-vous réussi à générer un PDF devis ?",
  },
  {
    id: "emailDevis",
    label: "Avez-vous réussi à envoyer un devis par email ?",
  },
  {
    id: "creationFacture",
    label: "Avez-vous réussi à créer une facture ?",
  },
] as const;

const notes = [
  { id: "mobile", label: "Note mobile sur 10" },
  { id: "desktop", label: "Note desktop sur 10" },
  { id: "globale", label: "Note globale sur 10" },
] as const;

const questionsOuvertes = [
  {
    id: "plusClair",
    label: "Qu’est-ce qui vous a semblé le plus clair ?",
  },
  {
    id: "moinsClair",
    label: "Qu’est-ce qui vous a semblé le moins clair ?",
  },
  {
    id: "blocage",
    label: "À quel moment avez-vous bloqué ou hésité ?",
  },
  {
    id: "manquesUsageReel",
    label: "Qu’est-ce qui manque pour une utilisation réelle ?",
  },
  {
    id: "inutileOuComplique",
    label: "Qu’est-ce qui est inutile ou trop compliqué ?",
  },
  {
    id: "pretAUtiliser",
    label: "Seriez-vous prêt à utiliser ce type d’outil ?",
  },
  {
    id: "prixMensuel",
    label: "Combien seriez-vous prêt à payer par mois ?",
  },
  {
    id: "autresRemarques",
    label: "Autres remarques",
  },
] as const;

type QuestionOuiNonId = (typeof questionsOuiNon)[number]["id"];
type NoteId = (typeof notes)[number]["id"];
type QuestionOuverteId = (typeof questionsOuvertes)[number]["id"];

const champClasses =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

const sectionClasses = "bf-card p-4 sm:p-6";

function creerFormulaireInitial(): FeedbackBetaForm {
  return {
    prenom: "",
    nom: "",
    metier: "",
    reponsesOuiNon: Object.fromEntries(
      questionsOuiNon.map((question) => [question.id, ""])
    ) as Record<QuestionOuiNonId, ReponseOuiNonForm>,
    notes: {
      mobile: "",
      desktop: "",
      globale: "",
    },
    reponsesOuvertes: Object.fromEntries(
      questionsOuvertes.map((question) => [question.id, ""])
    ) as Record<QuestionOuverteId, string>,
  };
}

export default function BetaTestPage() {
  const router = useRouter();
  const { goToLogin, handleDeconnexion } = useSessionNavigation(router);
  const { user, profilUtilisateur, authChargee, erreurAcces } =
    useAuthenticatedProfile(router);

  const [formulaire, setFormulaire] = useState<FeedbackBetaForm>(
    creerFormulaireInitial
  );
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [messageSucces, setMessageSucces] = useState("");
  const [messageErreur, setMessageErreur] = useState("");

  const noteOptions = useMemo(
    () => Array.from({ length: 11 }, (_, index) => String(index)),
    []
  );

  const formulaireComplet =
    formulaire.prenom.trim() &&
    formulaire.nom.trim() &&
    Object.values(formulaire.reponsesOuiNon).every(Boolean) &&
    Object.values(formulaire.notes).every((note) => note !== "");

  const mettreAJourReponseOuiNon = (
    id: QuestionOuiNonId,
    valeur: ReponseOuiNon
  ) => {
    setFormulaire((prev) => ({
      ...prev,
      reponsesOuiNon: {
        ...prev.reponsesOuiNon,
        [id]: valeur,
      },
    }));
  };

  const mettreAJourNote = (id: NoteId, valeur: string) => {
    setFormulaire((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [id]: valeur,
      },
    }));
  };

  const mettreAJourReponseOuverte = (
    id: QuestionOuverteId,
    valeur: string
  ) => {
    setFormulaire((prev) => ({
      ...prev,
      reponsesOuvertes: {
        ...prev.reponsesOuvertes,
        [id]: valeur,
      },
    }));
  };

  const envoyerFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessageSucces("");
    setMessageErreur("");

    if (!user) {
      setMessageErreur("Vous devez être connecté pour envoyer votre retour.");
      return;
    }

    if (!formulaireComplet) {
      setMessageErreur("Merci de compléter les champs obligatoires.");
      return;
    }

    try {
      setEnvoiEnCours(true);

      const idToken = await user.getIdToken(true);
      const response = await fetch("/api/beta-feedback", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prenom: formulaire.prenom,
          nom: formulaire.nom,
          metier: formulaire.metier,
          reponsesOuiNon: formulaire.reponsesOuiNon,
          notes: {
            mobile: Number(formulaire.notes.mobile),
            desktop: Number(formulaire.notes.desktop),
            globale: Number(formulaire.notes.globale),
          },
          reponsesOuvertes: formulaire.reponsesOuvertes,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Impossible d’envoyer le retour.");
      }

      setMessageSucces("Merci, votre retour bêta a bien été envoyé.");
      setFormulaire(creerFormulaireInitial());
    } catch (error) {
      setMessageErreur(
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer le retour."
      );
    } finally {
      setEnvoiEnCours(false);
    }
  };

  if (!authChargee) {
    return <PageLoadingState />;
  }

  if (!user) {
    return <EmptyAuthState />;
  }

  if (erreurAcces || !profilUtilisateur) {
    return (
      <AccessDeniedState
        erreurAcces={erreurAcces}
        onDeconnexion={handleDeconnexion}
        onRetourLogin={goToLogin}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="bf-card overflow-hidden">
          <div className="border-b border-slate-100 bg-white px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                  Test bêta BatiFlow
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Merci de tester BatiFlow comme si vous deviez l’utiliser dans
                  votre activité. Le but est de repérer ce qui est clair, ce qui
                  bloque et ce qui manque.
                </p>
              </div>

              <Link href="/" className="bf-button-secondary text-center">
                Accéder à BatiFlow
              </Link>
            </div>
          </div>
        </header>

        <section className={sectionClasses}>
          <h2 className="text-lg font-semibold text-slate-950">
            Mission de test
          </h2>
          <ol className="mt-4 grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-2">
            {missionTest.map((mission, index) => (
              <li
                key={mission}
                className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span>{mission}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
            Si vous bloquez ou si vous voyez un bug, notez l’étape concernée.
            Vous pouvez aussi m’envoyer une capture d’écran directement par
            WhatsApp ou par email.
          </p>
        </section>

        <form onSubmit={envoyerFeedback} className="flex flex-col gap-5">
          <section className={sectionClasses}>
            <h2 className="text-lg font-semibold text-slate-950">Identité</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formulaire.prenom}
                  onChange={(event) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      prenom: event.target.value,
                    }))
                  }
                  className={champClasses}
                  autoComplete="given-name"
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formulaire.nom}
                  onChange={(event) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nom: event.target.value,
                    }))
                  }
                  className={champClasses}
                  autoComplete="family-name"
                />
              </div>

              <div className="min-w-0 md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Métier / activité
                </label>
                <input
                  type="text"
                  value={formulaire.metier}
                  onChange={(event) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      metier: event.target.value,
                    }))
                  }
                  className={champClasses}
                />
              </div>
            </div>
          </section>

          <details className={sectionClasses} open>
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">
              Questions oui / non
            </summary>
            <div className="mt-4 grid gap-3">
              {questionsOuiNon.map((question) => (
                <fieldset
                  key={question.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <legend className="text-sm font-medium text-slate-800">
                    {question.label}
                  </legend>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
                    {(["oui", "non"] as const).map((valeur) => (
                      <label
                        key={valeur}
                        className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                          formulaire.reponsesOuiNon[question.id] === valeur
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          required
                          name={question.id}
                          value={valeur}
                          checked={
                            formulaire.reponsesOuiNon[question.id] === valeur
                          }
                          onChange={() =>
                            mettreAJourReponseOuiNon(question.id, valeur)
                          }
                          className="sr-only"
                        />
                        {valeur === "oui" ? "Oui" : "Non"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </details>

          <section className={sectionClasses}>
            <h2 className="text-lg font-semibold text-slate-950">Notes</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {notes.map((note) => (
                <div key={note.id} className="min-w-0">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {note.label} *
                  </label>
                  <select
                    required
                    value={formulaire.notes[note.id]}
                    onChange={(event) =>
                      mettreAJourNote(note.id, event.target.value)
                    }
                    className={champClasses}
                  >
                    <option value="">Choisir</option>
                    {noteOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}/10
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <details className={sectionClasses} open>
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">
              Questions ouvertes
            </summary>
            <div className="mt-4 grid gap-4">
              {questionsOuvertes.map((question) => (
                <div key={question.id} className="min-w-0">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {question.label}
                  </label>
                  <textarea
                    value={formulaire.reponsesOuvertes[question.id]}
                    onChange={(event) =>
                      mettreAJourReponseOuverte(question.id, event.target.value)
                    }
                    rows={3}
                    className={champClasses}
                  />
                </div>
              ))}
            </div>
          </details>

          {(messageSucces || messageErreur) && (
            <div
              role="status"
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                messageSucces
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {messageSucces || messageErreur}
            </div>
          )}

          <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border">
            <button
              type="submit"
              disabled={envoiEnCours || !formulaireComplet}
              className="bf-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {envoiEnCours ? "Envoi en cours..." : "Envoyer mon retour"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
