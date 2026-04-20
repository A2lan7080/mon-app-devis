"use client";

import { useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { formatMontant } from "../lib/devis-helpers";
import { db } from "../lib/firebase";
import { useEntreprisePrestations } from "../hooks/useEntreprisePrestations";
import { useEntrepriseSettings } from "../hooks/useEntrepriseSettings";
import AdminDashboard from "./AdminDashboard";
import type {
  PrestationBibliotheque,
  UnitePrestation,
} from "../types/prestations";

type Props = {
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
  entrepriseId?: string;
  createdByUid?: string;
  authChargee?: boolean;
};

type PrestationFormState = {
  designation: string;
  unite: UnitePrestation;
  prixUnitaire: string;
  description: string;
};

const UNITES_PREDEFINIES: UnitePrestation[] = [
  "pièce",
  "forfait",
  "m²",
  "ml",
  "heure",
  "jour",
];

const creerPrestationVide = (): PrestationFormState => ({
  designation: "",
  unite: "forfait",
  prixUnitaire: "",
  description: "",
});

function genererReferencePrestation(prestations: PrestationBibliotheque[]) {
  const plusGrandNumero = prestations.reduce((max, prestation) => {
    const match = prestation.reference?.match(/PRE-(\d+)/);
    if (!match) return max;
    const numero = Number(match[1]);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);

  return `PRE-${String(plusGrandNumero + 1).padStart(4, "0")}`;
}

export default function AdminWorkspace({
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
  entrepriseId,
  createdByUid,
  authChargee = true,
}: Props) {
  const {
    entrepriseSettings,
    setEntrepriseSettings,
    chargementEntreprise,
    sauvegardeEntrepriseEnCours,
    enregistrerEntreprise,
  } = useEntrepriseSettings({
    entrepriseIdCourante: entrepriseId ?? null,
    userId: createdByUid ?? null,
    authChargee,
  });

  const { prestations, chargement: chargementPrestations } =
    useEntreprisePrestations({
      authChargee,
      userId: createdByUid ?? null,
      entrepriseIdCourante: entrepriseId ?? null,
      estAdmin: true,
    });

  const [formulairePrestation, setFormulairePrestation] =
    useState<PrestationFormState>(creerPrestationVide());
  const [prestationEditionId, setPrestationEditionId] = useState<string | null>(
    null
  );
  const [sauvegardePrestationEnCours, setSauvegardePrestationEnCours] =
    useState(false);

  const prestationsActives = useMemo(
    () => prestations.filter((prestation) => !prestation.archive),
    [prestations]
  );

  const resetPrestationFormulaire = () => {
    setFormulairePrestation(creerPrestationVide());
    setPrestationEditionId(null);
  };

  const handleEntrepriseChange = (
    champ: keyof typeof entrepriseSettings,
    valeur: string
  ) => {
    setEntrepriseSettings((prev) => ({
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
        setEntrepriseSettings((prev) => ({
          ...prev,
          logoUrl: resultat,
        }));
      }
    };

    reader.readAsDataURL(file);
  };

  const supprimerLogo = () => {
    setEntrepriseSettings((prev) => ({
      ...prev,
      logoUrl: "",
    }));
  };

  const handleSauvegardeEntreprise = async () => {
    const succes = await enregistrerEntreprise();

    if (succes) {
      alert("Informations entreprise enregistrées.");
    }
  };

  const enregistrerPrestation = async () => {
    if (!entrepriseId || !createdByUid) {
      alert("Impossible d’identifier l’entreprise ou l’utilisateur.");
      return;
    }

    if (!formulairePrestation.designation.trim()) {
      alert("La désignation est obligatoire.");
      return;
    }

    const prixUnitaire = Number(formulairePrestation.prixUnitaire);

    if (Number.isNaN(prixUnitaire) || prixUnitaire < 0) {
      alert("Le prix unitaire doit être valide.");
      return;
    }

    const maintenant = Date.now();

    try {
      setSauvegardePrestationEnCours(true);

      if (prestationEditionId) {
        const prestationExistante =
          prestations.find((item) => item.id === prestationEditionId) ?? null;

        if (!prestationExistante) {
          alert("La prestation à modifier est introuvable.");
          return;
        }

        await updateDoc(doc(db, "prestationsBibliotheque", prestationEditionId), {
          ...prestationExistante,
          designation: formulairePrestation.designation.trim(),
          unite: formulairePrestation.unite,
          prixUnitaire,
          description: formulairePrestation.description.trim(),
          updatedAt: maintenant,
        });

        resetPrestationFormulaire();
        return;
      }

      const nouvelId = `${entrepriseId}-pre-${maintenant}`;
      const reference = genererReferencePrestation(prestations);

      const nouvellePrestation: PrestationBibliotheque = {
        id: nouvelId,
        reference,
        designation: formulairePrestation.designation.trim(),
        unite: formulairePrestation.unite,
        prixUnitaire,
        description: formulairePrestation.description.trim(),
        entrepriseId,
        createdByUid,
        archive: false,
        createdAt: maintenant,
        updatedAt: maintenant,
      };

      await setDoc(
        doc(db, "prestationsBibliotheque", nouvelId),
        nouvellePrestation
      );

      resetPrestationFormulaire();
    } catch (error) {
      console.error("Erreur enregistrement prestation :", error);
      alert("Impossible d’enregistrer la prestation.");
    } finally {
      setSauvegardePrestationEnCours(false);
    }
  };

  const modifierPrestation = (prestation: PrestationBibliotheque) => {
    setPrestationEditionId(prestation.id);
    setFormulairePrestation({
      designation: prestation.designation,
      unite: prestation.unite,
      prixUnitaire: String(prestation.prixUnitaire),
      description: prestation.description,
    });
  };

  const archiverPrestation = async (prestation: PrestationBibliotheque) => {
    try {
      setSauvegardePrestationEnCours(true);

      await updateDoc(doc(db, "prestationsBibliotheque", prestation.id), {
        ...prestation,
        archive: true,
        updatedAt: Date.now(),
      });

      if (prestationEditionId === prestation.id) {
        resetPrestationFormulaire();
      }
    } catch (error) {
      console.error("Erreur archivage prestation :", error);
      alert("Impossible d’archiver la prestation.");
    } finally {
      setSauvegardePrestationEnCours(false);
    }
  };

  const restaurerPrestation = async (prestation: PrestationBibliotheque) => {
    try {
      setSauvegardePrestationEnCours(true);

      await updateDoc(doc(db, "prestationsBibliotheque", prestation.id), {
        ...prestation,
        archive: false,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Erreur restauration prestation :", error);
      alert("Impossible de restaurer la prestation.");
    } finally {
      setSauvegardePrestationEnCours(false);
    }
  };

  const supprimerPrestation = async (prestation: PrestationBibliotheque) => {
    const confirmation = window.confirm(
      `Supprimer définitivement la prestation ${prestation.designation} ?`
    );

    if (!confirmation) return;

    try {
      setSauvegardePrestationEnCours(true);

      await deleteDoc(doc(db, "prestationsBibliotheque", prestation.id));

      if (prestationEditionId === prestation.id) {
        resetPrestationFormulaire();
      }
    } catch (error) {
      console.error("Erreur suppression prestation :", error);
      alert("Impossible de supprimer la prestation.");
    } finally {
      setSauvegardePrestationEnCours(false);
    }
  };

  return (
    <>
      <AdminDashboard
        valeurBusinessTotale={valeurBusinessTotale}
        caSigne={caSigne}
        totalEnvoyes={totalEnvoyes}
        pipeEnvoye={pipeEnvoye}
        pipeBrouillon={pipeBrouillon}
        tauxConversion={tauxConversion}
        totalDevis={totalDevis}
        ticketMoyen={ticketMoyen}
        totalArchives={totalArchives}
        totalBrouillons={totalBrouillons}
        totalAcceptes={totalAcceptes}
        totalRefuses={totalRefuses}
      />

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold sm:text-xl">
                Informations entreprise
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Ces informations servent pour les PDF et emails.
              </p>
            </div>

            <button
              onClick={handleSauvegardeEntreprise}
              disabled={chargementEntreprise || sauvegardeEntrepriseEnCours}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {sauvegardeEntrepriseEnCours ? "Enregistrement..." : "Enregistrer"}
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
                    value={entrepriseSettings.nom}
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
                    value={entrepriseSettings.adresse}
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
                    value={entrepriseSettings.email}
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
                    value={entrepriseSettings.telephone}
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
                    value={entrepriseSettings.tva}
                    onChange={(e) => handleEntrepriseChange("tva", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Logo entreprise
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                {entrepriseSettings.logoUrl ? (
                  <div className="space-y-4">
                    <div className="flex min-h-40 items-center justify-center rounded-xl bg-white p-4">
                      <img
                        src={entrepriseSettings.logoUrl}
                        alt="Logo entreprise"
                        className="max-h-36 w-auto object-contain"
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
                  <div className="flex min-h-40 items-center justify-center text-center text-sm text-slate-500">
                    Aucun logo chargé pour le moment.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold sm:text-xl">
                Bibliothèque de prestations
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Prépare tes prestations réutilisables pour les devis.
              </p>
            </div>

            {prestationEditionId && (
              <button
                onClick={resetPrestationFormulaire}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Annuler l’édition
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Désignation
              </label>
              <input
                type="text"
                value={formulairePrestation.designation}
                onChange={(e) =>
                  setFormulairePrestation((prev) => ({
                    ...prev,
                    designation: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Unité
              </label>
              <select
                value={formulairePrestation.unite}
                onChange={(e) =>
                  setFormulairePrestation((prev) => ({
                    ...prev,
                    unite: e.target.value as UnitePrestation,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                {UNITES_PREDEFINIES.map((unite) => (
                  <option key={unite} value={unite}>
                    {unite}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Prix unitaire
              </label>
              <input
                type="number"
                value={formulairePrestation.prixUnitaire}
                onChange={(e) =>
                  setFormulairePrestation((prev) => ({
                    ...prev,
                    prixUnitaire: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={formulairePrestation.description}
                onChange={(e) =>
                  setFormulairePrestation((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={enregistrerPrestation}
              disabled={sauvegardePrestationEnCours}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {sauvegardePrestationEnCours
                ? "Enregistrement..."
                : prestationEditionId
                ? "Enregistrer les modifications"
                : "Ajouter la prestation"}
            </button>

            <button
              onClick={resetPrestationFormulaire}
              disabled={sauvegardePrestationEnCours}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Réinitialiser
            </button>
          </div>

          <div className="mt-6">
            {chargementPrestations ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Chargement des prestations...
              </div>
            ) : prestations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Aucune prestation enregistrée pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {prestations.map((prestation) => (
                  <div
                    key={prestation.id}
                    className={`rounded-2xl border p-4 ${
                      prestation.archive
                        ? "border-amber-200 bg-amber-50/60"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">
                          {prestation.reference}
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-slate-900">
                          {prestation.designation}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatMontant(prestation.prixUnitaire)} · {prestation.unite}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {prestation.description || "Aucune description"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => modifierPrestation(prestation)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Modifier
                        </button>

                        {!prestation.archive ? (
                          <button
                            onClick={() => archiverPrestation(prestation)}
                            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                          >
                            Archiver
                          </button>
                        ) : (
                          <button
                            onClick={() => restaurerPrestation(prestation)}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                          >
                            Restaurer
                          </button>
                        )}

                        <button
                          onClick={() => supprimerPrestation(prestation)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {prestationsActives.length > 0 && (
              <p className="mt-4 text-xs text-slate-400">
                {prestationsActives.length} prestation
                {prestationsActives.length > 1 ? "s" : ""} active
                {prestationsActives.length > 1 ? "s" : ""} disponible
                {prestationsActives.length > 1 ? "s" : ""} pour les devis.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}