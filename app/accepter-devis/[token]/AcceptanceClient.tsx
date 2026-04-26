"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PublicDevis = {
  id: string;
  client: string;
  date: string;
  statut: string;
  chantierTitre: string;
  validiteJours: number;
  dateValidite: string;
  validiteLabel: string;
  validiteExpiree: boolean;
  joursRestants: number | null;
  totalHtLabel: string;
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
  alreadyAccepted?: boolean;
  alreadyRefused?: boolean;
  success?: boolean;
  error?: string;
};

type Props = {
  token: string;
};

export default function AcceptanceClient({ token }: Props) {
  const [devis, setDevis] = useState<PublicDevis | null>(null);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [alreadyRefused, setAlreadyRefused] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState<"accept" | "refuse" | null>(
    null
  );
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const endpoint = useMemo(
    () => `/api/devis/acceptance/${encodeURIComponent(token)}`,
    [token]
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

        if (!response.ok || !data.devis) {
          throw new Error(data.error || "Lien d'acceptation invalide.");
        }

        setDevis(data.devis);
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

  const traiterDevis = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const action = submitter?.value === "refuse" ? "refuse" : "accept";

    if (!nom.trim() || !email.trim()) {
      setErreur("Le nom et l'adresse email sont obligatoires.");
      return;
    }

    try {
      setActionEnCours(action);
      setErreur("");
      setMessage("");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          name: nom,
          email,
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success || !data.devis) {
        throw new Error(data.error || "Impossible de traiter le devis.");
      }

      setDevis(data.devis);
      setAlreadyAccepted(action === "accept");
      setAlreadyRefused(action === "refuse");
      setMessage(
        action === "accept"
          ? "Merci, votre acceptation a bien été enregistrée."
          : "Votre refus a bien été enregistré."
      );
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Acceptation devis
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                {devis?.id ?? "Devis"}
              </h1>
            </div>

            {devis && (
              <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {devis.statut}
              </span>
            )}
          </div>

          {chargement ? (
            <div className="py-12 text-sm text-slate-500">
              Chargement du devis...
            </div>
          ) : erreur && !devis ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {erreur}
            </div>
          ) : devis ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {devis.client}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Chantier
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {devis.chantierTitre || "Non renseigné"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {devis.date}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total TVAC
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {devis.totalTvacLabel}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Validité
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {devis.dateValidite
                      ? `Valable jusqu'au ${devis.dateValidite}`
                      : `${devis.validiteJours} jours`}
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      devis.validiteExpiree ? "text-red-700" : "text-slate-600"
                    }`}
                  >
                    {devis.validiteLabel}
                  </p>
                </div>
              </div>

              {alreadyAccepted ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <p className="font-semibold">Ce devis est accepté.</p>
                  {devis.acceptedAt && (
                    <p className="mt-1">
                      Accepté par {devis.acceptedByName} (
                      {devis.acceptedByEmail}) le{" "}
                      {new Date(devis.acceptedAt).toLocaleString("fr-BE")}
                    </p>
                  )}
                </div>
              ) : alreadyRefused ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-semibold">Ce devis est refusé.</p>
                  {devis.refusedAt && (
                    <p className="mt-1">
                      Refusé par {devis.refusedByName} ({devis.refusedByEmail})
                      le {new Date(devis.refusedAt).toLocaleString("fr-BE")}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={traiterDevis} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Nom
                      </label>
                      <input
                        data-testid="acceptance-name"
                        type="text"
                        value={nom}
                        onChange={(event) => setNom(event.target.value)}
                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                        autoComplete="name"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Email
                      </label>
                      <input
                        data-testid="acceptance-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {erreur && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                      {erreur}
                    </div>
                  )}

                  {message && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                      {message}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      data-testid="acceptance-submit"
                      type="submit"
                      name="action"
                      value="accept"
                      disabled={actionEnCours !== null}
                      className="w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {actionEnCours === "accept"
                        ? "Acceptation..."
                        : "Accepter le devis"}
                    </button>

                    <button
                      type="submit"
                      name="action"
                      value="refuse"
                      disabled={actionEnCours !== null}
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {actionEnCours === "refuse"
                        ? "Refus..."
                        : "Refuser le devis"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
