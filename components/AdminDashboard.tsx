"use client";

import type { Dispatch, SetStateAction } from "react";
import { formatMontant } from "../lib/devis-helpers";
import type { Entreprise } from "../types/devis";

type EntrepriseSettings = Entreprise & {
  logoUrl?: string;
  updatedAt?: number;
  createdAt?: number;
};

type AdminDashboardProps = {
  valeurBusinessTotale: number;
  caSigne: number;
  totalEnvoyes: number;
  pipeEnvoye: number;
  pipeBrouillon: number;
  tauxConversion: number;
  totalDevis: number;
  ticketMoyen: number;
  totalArchives: number;
  totalBrouillons: number;
  totalAcceptes: number;
  totalRefuses: number;
  entreprise: EntrepriseSettings;
  setEntreprise: Dispatch<SetStateAction<EntrepriseSettings>>;
  chargementEntreprise: boolean;
  sauvegardeEntrepriseEnCours: boolean;
  enregistrerEntreprise: () => Promise<boolean>;
};

export default function AdminDashboard({
  valeurBusinessTotale,
  caSigne,
  totalEnvoyes,
  pipeEnvoye,
  pipeBrouillon,
  tauxConversion,
  totalDevis,
  ticketMoyen,
  totalArchives,
  totalBrouillons,
  totalAcceptes,
  totalRefuses,
  entreprise,
  setEntreprise,
  chargementEntreprise,
  sauvegardeEntrepriseEnCours,
  enregistrerEntreprise,
}: AdminDashboardProps) {
  const handleEntrepriseChange = (
    champ: keyof EntrepriseSettings,
    valeur: string
  ) => {
    setEntreprise((prev) => ({
      ...prev,
      [champ]: valeur,
    }));
  };

  const handleLogoChange = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const resultat = reader.result;
      if (typeof resultat === "string") {
        setEntreprise((prev) => ({
          ...prev,
          logoUrl: resultat,
        }));
      }
    };

    reader.readAsDataURL(file);
  };

  const supprimerLogo = () => {
    setEntreprise((prev) => ({
      ...prev,
      logoUrl: "",
    }));
  };

  const handleSauvegarde = async () => {
    const succes = await enregistrerEntreprise();
    if (succes) {
      alert("Informations entreprise enregistrées.");
    }
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-6">
        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Valeur totale active</p>
          <p className="mt-2 break-words text-2xl font-bold sm:text-2xl">
            {formatMontant(valeurBusinessTotale)}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">CA signé</p>
          <p className="mt-2 break-words text-2xl font-bold sm:text-2xl">
            {formatMontant(caSigne)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">Envoyés</p>
          <p className="mt-2 text-2xl font-bold sm:text-2xl">{totalEnvoyes}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">Conversion</p>
          <p className="mt-2 text-2xl font-bold sm:text-2xl">
            {tauxConversion}%
          </p>
        </div>

        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Pipe envoyé</p>
          <p className="mt-2 break-words text-2xl font-bold sm:text-2xl">
            {formatMontant(pipeEnvoye)}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Brouillons</p>
          <p className="mt-2 break-words text-2xl font-bold sm:text-2xl">
            {formatMontant(pipeBrouillon)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">Devis actifs</p>
          <p className="mt-2 text-3xl font-bold">{totalDevis}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">Ticket moyen signé</p>
          <p className="mt-2 break-words text-3xl font-bold">
            {formatMontant(ticketMoyen)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">Archivés</p>
          <p className="mt-2 text-3xl font-bold">{totalArchives}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold sm:text-xl">Répartition statuts</h3>

          <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm sm:text-base">Brouillons</span>
              <span className="font-semibold">{totalBrouillons}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm sm:text-base">Envoyés</span>
              <span className="font-semibold">{totalEnvoyes}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm sm:text-base">Acceptés</span>
              <span className="font-semibold">{totalAcceptes}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm sm:text-base">Refusés</span>
              <span className="font-semibold">{totalRefuses}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold sm:text-xl">
            Lecture business rapide
          </h3>

          <div className="mt-5 space-y-3 text-sm text-slate-600 sm:mt-6 sm:space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 leading-6">
              Le chiffre le plus important ici, c’est le{" "}
              <span className="font-semibold text-slate-900">CA signé</span>. C’est
              ton revenu déjà gagné.
            </div>

            <div className="rounded-xl bg-slate-50 p-4 leading-6">
              Le{" "}
              <span className="font-semibold text-slate-900">pipe envoyé</span>{" "}
              montre ce qui peut se transformer rapidement.
            </div>

            <div className="rounded-xl bg-slate-50 p-4 leading-6">
              Les{" "}
              <span className="font-semibold text-slate-900">brouillons</span>{" "}
              représentent ton potentiel encore non envoyé.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold sm:text-xl">
                Informations entreprise
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Ces informations serviront pour les documents et communications.
              </p>
            </div>

            <button
              onClick={handleSauvegarde}
              disabled={chargementEntreprise || sauvegardeEntrepriseEnCours}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {sauvegardeEntrepriseEnCours
                ? "Enregistrement..."
                : "Enregistrer"}
            </button>
          </div>

          {chargementEntreprise ? (
            <div className="mt-6 flex min-h-40 items-center justify-center text-sm text-slate-500">
              Chargement des informations entreprise...
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nom de l’entreprise
                  </label>
                  <input
                    type="text"
                    value={entreprise.nom}
                    onChange={(e) => handleEntrepriseChange("nom", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={entreprise.adresse}
                    onChange={(e) =>
                      handleEntrepriseChange("adresse", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={entreprise.email}
                    onChange={(e) =>
                      handleEntrepriseChange("email", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={entreprise.telephone}
                    onChange={(e) =>
                      handleEntrepriseChange("telephone", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    TVA
                  </label>
                  <input
                    type="text"
                    value={entreprise.tva}
                    onChange={(e) => handleEntrepriseChange("tva", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Aperçu</p>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{entreprise.nom}</p>
                  <p>{entreprise.adresse || "Adresse non renseignée"}</p>
                  <p>{entreprise.email || "Email non renseigné"}</p>
                  <p>{entreprise.telephone || "Téléphone non renseigné"}</p>
                  <p>TVA {entreprise.tva || "Non renseignée"}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold sm:text-xl">Logo entreprise</h3>
          <p className="mt-1 text-sm text-slate-500">
            Le logo sera réutilisé plus tard dans les PDF et emails.
          </p>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Importer un logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            {entreprise.logoUrl ? (
              <div className="space-y-4">
                <div className="flex min-h-48 items-center justify-center rounded-xl bg-white p-4">
                  <img
                    src={entreprise.logoUrl}
                    alt="Logo entreprise"
                    className="max-h-40 w-auto object-contain"
                  />
                </div>

                <button
                  onClick={supprimerLogo}
                  className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Supprimer le logo
                </button>
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center text-center text-sm text-slate-500">
                Aucun logo chargé pour le moment.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold sm:text-xl">
              Bibliothèque de prestations
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Prochaine étape : enregistrer des prestations prêtes à réutiliser dans les devis.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            À faire ensuite
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Exemple : pose de porte intérieure
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Exemple : fourniture + pose châssis
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Exemple : dressing sur mesure
          </div>
        </div>
      </div>
    </>
  );
}