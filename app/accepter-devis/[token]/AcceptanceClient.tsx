"use client";

import { useEffect, useMemo, useState } from "react";

type PublicLigneDevis = {
  id: string;
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaireLabel: string;
  tvaTaux: number;
  montantHtLabel: string;
  montantTvaLabel: string;
  totalTtcLabel: string;
};

type PublicDetailTva = {
  taux: number;
  montantHtLabel: string;
  montantTvaLabel: string;
  totalTtcLabel: string;
};

type PublicEntreprise = {
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  tva: string;
  iban: string;
  logoUrl: string;
  logoRemplaceNomEntreprise: boolean;
};

type PublicDevis = {
  id: string;
  client: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  typeClient: string;
  societe: string;
  tvaClient: string;
  date: string;
  statut: string;
  chantierTitre: string;
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  lignes: PublicLigneDevis[];
  detailTva: PublicDetailTva[];
  dateValidite: string;
  validiteLabel: string;
  validiteExpiree: boolean;
  joursRestants: number | null;
  totalHtLabel: string;
  totalTvaLabel: string;
  totalTvacLabel: string;
  acceptedAt: number | null;
  acceptedByName: string;
  acceptedByEmail: string;
  refusedAt: number | null;
  refusedByName: string;
  refusedByEmail: string;
};

type ApiResponse = {
  devis?: PublicDevis;
  entreprise?: PublicEntreprise;
  alreadyAccepted?: boolean;
  alreadyRefused?: boolean;
  success?: boolean;
  error?: string;
};

type Props = {
  token: string;
};

type Decision = "accept" | "refuse";

function joindreLocalite(codePostal: string, ville: string) {
  return [codePostal, ville].filter(Boolean).join(" ");
}

export default function AcceptanceClient({ token }: Props) {
  const [devis, setDevis] = useState<PublicDevis | null>(null);
  const [entreprise, setEntreprise] = useState<PublicEntreprise | null>(null);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [alreadyRefused, setAlreadyRefused] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState<Decision | null>(null);
  const [actionAConfirmer, setActionAConfirmer] = useState<Decision | null>(
    null
  );
  const [decisionFinale, setDecisionFinale] = useState<Decision | null>(null);
  const [afficherResultatFinal, setAfficherResultatFinal] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [erreur, setErreur] = useState("");

  const endpoint = useMemo(
    () => `/api/devis/acceptance/${encodeURIComponent(token)}`,
    [token]
  );
  const pdfEndpoint = useMemo(
    () => `${endpoint}/pdf`,
    [endpoint]
  );

  useEffect(() => {
    const chargerDevis = async () => {
      try {
        setChargement(true);
        setErreur("");

        const response = await fetch(endpoint, {
          cache: "no-store",
        });
        const data = (await response.json()) as ApiResponse;

        if (!response.ok || !data.devis || !data.entreprise) {
          throw new Error(data.error || "Lien de devis invalide.");
        }

        setDevis(data.devis);
        setEntreprise(data.entreprise);
        setEmail(data.devis.email || "");
        setAlreadyAccepted(Boolean(data.alreadyAccepted));
        setAlreadyRefused(Boolean(data.alreadyRefused));
      } catch (error) {
        setErreur(
          error instanceof Error
            ? error.message
            : "Impossible de charger ce devis."
        );
      } finally {
        setChargement(false);
      }
    };

    void chargerDevis();
  }, [endpoint]);

  const ouvrirConfirmation = (action: Decision) => {
    if (!nom.trim() || !email.trim()) {
      setErreur(
        "Renseignez votre nom et votre adresse email avant de continuer."
      );
      return;
    }

    setErreur("");
    setActionAConfirmer(action);
  };

  const confirmerDecision = async () => {
    if (!actionAConfirmer) return;

    const action = actionAConfirmer;

    try {
      setActionEnCours(action);
      setErreur("");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          name: nom,
          email,
          ...(action === "refuse" && commentaire.trim()
            ? { comment: commentaire.trim() }
            : {}),
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success || !data.devis) {
        throw new Error(data.error || "Impossible de traiter le devis.");
      }

      setDevis((devisCourant) =>
        devisCourant ? { ...devisCourant, ...data.devis } : data.devis ?? null
      );
      setAlreadyAccepted(action === "accept");
      setAlreadyRefused(action === "refuse");
      setDecisionFinale(action);
      setActionAConfirmer(null);
      setAfficherResultatFinal(true);
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : "Impossible de traiter le devis."
      );
    } finally {
      setActionEnCours(null);
    }
  };

  if (chargement) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-600">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          Chargement du devis...
        </div>
      </main>
    );
  }

  if (erreur && (!devis || !entreprise)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-700">
            !
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-950">
            Devis indisponible
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{erreur}</p>
        </div>
      </main>
    );
  }

  if (!devis || !entreprise) return null;

  if (afficherResultatFinal && decisionFinale) {
    const accepte = decisionFinale === "accept";

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
        <section
          className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-10"
          aria-live="polite"
        >
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold ${
              accepte
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {accepte ? "✓" : "✓"}
          </div>
          <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
            {accepte
              ? "Merci pour votre confiance !"
              : "Votre réponse a bien été enregistrée."}
          </h1>
          <div className="mx-auto mt-4 max-w-xl space-y-2 text-sm leading-6 text-slate-600 sm:text-base">
            {accepte ? (
              <>
                <p>Votre devis a bien été accepté.</p>
                <p>L’entreprise a été informée.</p>
                <p>Elle reviendra vers vous rapidement.</p>
              </>
            ) : (
              <>
                <p>Merci d’avoir pris le temps de répondre.</p>
                <p>L’entreprise a été informée.</p>
              </>
            )}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={pdfEndpoint}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Télécharger le PDF
            </a>
            {accepte && (
              <button
                type="button"
                onClick={() => setAfficherResultatFinal(false)}
                className="min-h-12 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Retour au devis
              </button>
            )}
          </div>
        </section>
      </main>
    );
  }

  const devisTraite = alreadyAccepted || alreadyRefused;

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
              ✓
            </div>
            <div>
              <h1 className="text-lg font-bold text-sky-950 sm:text-xl">
                Vous consultez un devis sécurisé.
              </h1>
              <p className="mt-1 text-sm leading-6 text-sky-800 sm:text-base">
                Prenez le temps de consulter ce devis. Vous pourrez ensuite
                décider de l’accepter ou de le refuser.
              </p>
            </div>
          </div>
        </section>

        <article
          data-testid="public-devis"
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
        >
          <header className="bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                {entreprise.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entreprise.logoUrl}
                    alt={`Logo de ${entreprise.nom}`}
                    className="mb-4 max-h-20 max-w-60 rounded-xl bg-white object-contain p-2"
                  />
                )}
                {(!entreprise.logoUrl ||
                  !entreprise.logoRemplaceNomEntreprise) && (
                  <p className="text-xl font-bold sm:text-2xl">
                    {entreprise.nom}
                  </p>
                )}
                <p className="mt-2 text-sm text-slate-300">
                  {[entreprise.adresse, joindreLocalite(entreprise.codePostal, entreprise.ville)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                  Devis
                </p>
                <h2 className="mt-2 break-all text-2xl font-bold sm:text-3xl">
                  {devis.id}
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Émis le {devis.date}
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-8 p-5 sm:p-8">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Entreprise
                </p>
                <p className="mt-3 text-lg font-bold">{entreprise.nom}</p>
                <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                  <p>{entreprise.adresse || "Adresse non renseignée"}</p>
                  <p>
                    {joindreLocalite(entreprise.codePostal, entreprise.ville) ||
                      "Localité non renseignée"}
                  </p>
                  <p>{entreprise.email}</p>
                  <p>{entreprise.telephone}</p>
                  {entreprise.tva && <p>TVA : {entreprise.tva}</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client
                </p>
                <p className="mt-3 text-lg font-bold">{devis.client}</p>
                <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                  {devis.societe && <p>{devis.societe}</p>}
                  <p>{devis.adresse || "Adresse non renseignée"}</p>
                  <p>
                    {joindreLocalite(devis.codePostal, devis.ville) ||
                      "Localité non renseignée"}
                  </p>
                  {devis.chantierTitre && (
                    <p>Chantier : {devis.chantierTitre}</p>
                  )}
                  {devis.tvaClient && <p>TVA : {devis.tvaClient}</p>}
                </div>
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Prestations
                  </p>
                  <h3 className="mt-1 text-xl font-bold">Détail du devis</h3>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    devis.validiteExpiree ? "text-red-700" : "text-slate-600"
                  }`}
                >
                  {devis.validiteLabel}
                </p>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {devis.lignes.map((ligne) => (
                  <div
                    key={ligne.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="font-semibold">{ligne.designation}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                      <p>
                        {ligne.quantite} {ligne.unite}
                      </p>
                      <p className="text-right">
                        PU {ligne.prixUnitaireLabel}
                      </p>
                      <p>TVA {ligne.tvaTaux}%</p>
                      <p className="text-right font-bold text-slate-950">
                        {ligne.montantHtLabel} HT
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Désignation</th>
                      <th className="px-4 py-3 text-center">Quantité</th>
                      <th className="px-4 py-3 text-center">Unité</th>
                      <th className="px-4 py-3 text-right">Prix unitaire</th>
                      <th className="px-4 py-3 text-right">TVA</th>
                      <th className="px-4 py-3 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devis.lignes.map((ligne) => (
                      <tr
                        key={ligne.id}
                        className="border-t border-slate-200"
                      >
                        <td className="px-4 py-4 font-medium">
                          {ligne.designation}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {ligne.quantite}
                        </td>
                        <td className="px-4 py-4 text-center">{ligne.unite}</td>
                        <td className="px-4 py-4 text-right">
                          {ligne.prixUnitaireLabel}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {ligne.tvaTaux}%
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          {ligne.montantHtLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Conditions
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                  {devis.conditions || "Aucune condition particulière."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">Total HT</span>
                    <strong>{devis.totalHtLabel}</strong>
                  </div>
                  {devis.detailTva.map((ligne) => (
                    <div
                      key={ligne.taux}
                      className="flex justify-between gap-4"
                    >
                      <span className="text-slate-600">TVA {ligne.taux}%</span>
                      <strong>{ligne.montantTvaLabel}</strong>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-end justify-between gap-4">
                      <span className="font-bold">Total TVAC</span>
                      <strong className="text-2xl">{devis.totalTvacLabel}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {devisTraite ? (
              <section
                className={`rounded-2xl border p-5 ${
                  alreadyAccepted
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900"
                }`}
              >
                <p className="font-bold">
                  {alreadyAccepted
                    ? "Ce devis est accepté."
                    : "Ce devis est refusé."}
                </p>
                <p className="mt-2 text-sm">
                  Cette réponse a déjà été enregistrée. Le document reste
                  disponible au téléchargement.
                </p>
                <a
                  href={pdfEndpoint}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Télécharger le PDF
                </a>
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Votre décision
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    Après lecture du devis
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Renseignez votre identité, puis choisissez une action. Une
                    confirmation vous sera toujours demandée.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="acceptance-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Nom complet
                    </label>
                    <input
                      id="acceptance-name"
                      data-testid="acceptance-name"
                      type="text"
                      value={nom}
                      onChange={(event) => setNom(event.target.value)}
                      className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="acceptance-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Adresse email
                    </label>
                    <input
                      id="acceptance-email"
                      data-testid="acceptance-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {erreur && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                  >
                    {erreur}
                  </div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    data-testid="acceptance-submit"
                    type="button"
                    onClick={() => ouvrirConfirmation("accept")}
                    disabled={actionEnCours !== null}
                    className="min-h-14 w-full rounded-xl bg-emerald-700 px-5 py-3 text-base font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Accepter le devis
                  </button>
                  <button
                    data-testid="acceptance-refuse"
                    type="button"
                    onClick={() => ouvrirConfirmation("refuse")}
                    disabled={actionEnCours !== null}
                    className="min-h-14 w-full rounded-xl border border-red-300 bg-white px-5 py-3 text-base font-bold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Refuser le devis
                  </button>
                </div>
              </section>
            )}
          </div>
        </article>

        <p className="pb-4 text-center text-xs text-slate-500">
          Document sécurisé transmis par {entreprise.nom}.
        </p>
      </div>

      {actionAConfirmer && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
          aria-describedby="confirmation-description"
        >
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-7">
            <h2
              id="confirmation-title"
              className="text-xl font-bold text-slate-950 sm:text-2xl"
            >
              {actionAConfirmer === "accept"
                ? "Confirmer l’acceptation"
                : "Confirmer le refus"}
            </h2>
            <div
              id="confirmation-description"
              className="mt-3 space-y-2 text-sm leading-6 text-slate-600"
            >
              <p>
                {actionAConfirmer === "accept"
                  ? "Confirmez-vous l’acceptation de ce devis ?"
                  : "Confirmez-vous le refus de ce devis ?"}
              </p>
              {actionAConfirmer === "accept" && (
                <p>L’entreprise sera automatiquement informée.</p>
              )}
            </div>

            {actionAConfirmer === "refuse" && (
              <div className="mt-5">
                <label
                  htmlFor="refusal-comment"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Commentaire{" "}
                  <span className="font-normal text-slate-500">
                    (facultatif)
                  </span>
                </label>
                <textarea
                  id="refusal-comment"
                  value={commentaire}
                  onChange={(event) => setCommentaire(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Souhaitez-vous laisser un commentaire ?"
                  className="block w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Ce champ est facultatif.
                </p>
              </div>
            )}

            {erreur && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
              >
                {erreur}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => setActionAConfirmer(null)}
                disabled={actionEnCours !== null}
                className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                data-testid="acceptance-confirm"
                type="button"
                onClick={() => void confirmerDecision()}
                disabled={actionEnCours !== null}
                className={`min-h-12 rounded-xl px-5 py-3 text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  actionAConfirmer === "accept"
                    ? "bg-emerald-700 hover:bg-emerald-800 focus:ring-emerald-600"
                    : "bg-red-700 hover:bg-red-800 focus:ring-red-600"
                }`}
              >
                {actionEnCours
                  ? "Enregistrement..."
                  : actionAConfirmer === "accept"
                    ? "Confirmer l’acceptation"
                    : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
