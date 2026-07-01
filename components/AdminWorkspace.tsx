"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { formatMontant } from "../lib/devis-helpers";
import { obtenirOptionsTvaAvecValeur } from "../lib/devis-constants";
import {
  genererReferenceFactureDepuisConfig,
  getInvoiceNumberSettings,
} from "../lib/facture-helpers";
import { db, storage } from "../lib/firebase";
import { useEntrepriseFactures } from "../hooks/useEntrepriseFactures";
import { useEntreprisePrestations } from "../hooks/useEntreprisePrestations";
import { useEntrepriseSettings } from "../hooks/useEntrepriseSettings";
import AdminDashboard from "./AdminDashboard";
import Button from "./ui/Button";
import Card from "./ui/Card";
import ConfirmDialog from "./ui/ConfirmDialog";
import EmptyState from "./ui/EmptyState";
import FeedbackMessage from "./ui/FeedbackMessage";
import Input from "./ui/Input";
import LoadingState from "./ui/LoadingState";
import Select from "./ui/Select";
import Textarea from "./ui/Textarea";
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
  tvaTaux: string;
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
  tvaTaux: "21",
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

function entrepriseEstConfiguree(entreprise: {
  nom: string;
  adresse: string;
  email: string;
  telephone: string;
  tva: string;
  iban: string;
}) {
  return Boolean(
    entreprise.nom.trim() &&
      entreprise.adresse.trim() &&
      entreprise.email.trim() &&
      entreprise.telephone.trim() &&
      entreprise.tva.trim() &&
      entreprise.iban.trim()
  );
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

  const { factures } = useEntrepriseFactures({
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
  const [uploadLogoEnCours, setUploadLogoEnCours] = useState(false);
  const [infosEntrepriseOuvertes, setInfosEntrepriseOuvertes] = useState(false);
  const [bibliothequeOuverte, setBibliothequeOuverte] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);
  const [prestationASupprimer, setPrestationASupprimer] =
    useState<PrestationBibliotheque | null>(null);

  const prestationsActives = useMemo(
    () => prestations.filter((prestation) => !prestation.archive),
    [prestations]
  );

  const entrepriseConfiguree = entrepriseEstConfiguree(entrepriseSettings);
  const invoiceNumberConfig = getInvoiceNumberSettings(entrepriseSettings);
  const apercuProchaineFacture =
    genererReferenceFactureDepuisConfig(entrepriseSettings);
  const plusGrandNumeroFacture = useMemo(
    () =>
      factures.reduce((max, facture) => {
        const match = facture.reference?.match(/(\d+)(?!.*\d)/);
        if (!match) return max;

        const numero = Number(match[1]);
        return Number.isFinite(numero) ? Math.max(max, numero) : max;
      }, 0),
    [factures]
  );
  const prochaineFactureInvalide =
    invoiceNumberConfig.invoiceNextNumber < plusGrandNumeroFacture + 1;

  const prestationsArchivees = useMemo(
    () => prestations.filter((prestation) => prestation.archive),
    [prestations]
  );

  useEffect(() => {
    if (!chargementEntreprise && !entrepriseConfiguree) {
      setInfosEntrepriseOuvertes(true);
    }
  }, [chargementEntreprise, entrepriseConfiguree]);

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

  const handleEntrepriseBooleanChange = (
    champ: keyof typeof entrepriseSettings,
    valeur: boolean
  ) => {
    setEntrepriseSettings((prev) => ({
      ...prev,
      [champ]: valeur,
    }));
  };

  const handleLogoChange = async (file: File | null) => {
    if (!file) return;

    if (!entrepriseId) {
      setFeedback({
        tone: "error",
        message: "Impossible d’identifier l’entreprise.",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback({
        tone: "error",
        message: "Le fichier doit être une image.",
      });
      return;
    }

    const tailleMax = 2 * 1024 * 1024;

    if (file.size > tailleMax) {
      setFeedback({
        tone: "error",
        message: "Le logo ne peut pas dépasser 2 Mo.",
      });
      return;
    }

    try {
      setUploadLogoEnCours(true);

      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const chemin = `entreprises/${entrepriseId}/logos/logo-${Date.now()}.${extension}`;
      const reference = storageRef(storage, chemin);

      await uploadBytes(reference, file, {
        contentType: file.type,
      });

      const url = await getDownloadURL(reference);

      setEntrepriseSettings((prev) => ({
        ...prev,
        logoUrl: url,
        logoStoragePath: chemin,
      }));

      setFeedback({
        tone: "success",
        message:
          "Logo envoyé. Clique maintenant sur Enregistrer pour sauvegarder les informations entreprise.",
      });
    } catch (error) {
      console.error("Erreur upload logo :", error);
      setFeedback({
        tone: "error",
        message: "Impossible d’envoyer le logo.",
      });
    } finally {
      setUploadLogoEnCours(false);
    }
  };

  const supprimerLogo = async () => {
    const ancienChemin = entrepriseSettings.logoStoragePath;

    setEntrepriseSettings((prev) => ({
      ...prev,
      logoUrl: "",
      logoStoragePath: "",
      logoRemplaceNomEntreprise: false,
    }));

    if (!ancienChemin) return;

    try {
      await deleteObject(storageRef(storage, ancienChemin));
    } catch (error) {
      console.error("Erreur suppression logo Storage :", error);
    }
  };

  const handleSauvegardeEntreprise = async () => {
    if (prochaineFactureInvalide) {
      setFeedback({
        tone: "error",
        message: `Le prochain numéro de facture doit être au moins ${plusGrandNumeroFacture + 1}.`,
      });
      return;
    }

    const succes = await enregistrerEntreprise();

    if (succes) {
      setFeedback({
        tone: "success",
        message: "Informations entreprise enregistrées.",
      });
    }
  };

  const enregistrerPrestation = async () => {
    if (!entrepriseId || !createdByUid) {
      setFeedback({
        tone: "error",
        message: "Impossible d’identifier l’entreprise ou l’utilisateur.",
      });
      return;
    }

    if (!formulairePrestation.designation.trim()) {
      setFeedback({
        tone: "error",
        message: "La désignation est obligatoire.",
      });
      return;
    }

    const prixUnitaire = Number(formulairePrestation.prixUnitaire);
    const tvaTaux = Number(formulairePrestation.tvaTaux);

    if (Number.isNaN(prixUnitaire) || prixUnitaire < 0) {
      setFeedback({
        tone: "error",
        message: "Le prix unitaire doit être valide.",
      });
      return;
    }

    if (Number.isNaN(tvaTaux) || tvaTaux < 0) {
      setFeedback({
        tone: "error",
        message: "Le taux de TVA doit être valide.",
      });
      return;
    }

    const maintenant = Date.now();

    try {
      setSauvegardePrestationEnCours(true);

      if (prestationEditionId) {
        const prestationExistante =
          prestations.find((item) => item.id === prestationEditionId) ?? null;

        if (!prestationExistante) {
          setFeedback({
            tone: "error",
            message: "La prestation à modifier est introuvable.",
          });
          return;
        }

        await updateDoc(doc(db, "prestationsBibliotheque", prestationEditionId), {
          ...prestationExistante,
          designation: formulairePrestation.designation.trim(),
          unite: formulairePrestation.unite,
          prixUnitaire,
          tvaTaux,
          description: formulairePrestation.description.trim(),
          updatedAt: maintenant,
        });

        resetPrestationFormulaire();
        setFeedback({
          tone: "success",
          message: "Prestation mise à jour.",
        });
        return;
      }

      const nouvelId = `${entrepriseId}-pre-${crypto.randomUUID()}`;
      const reference = genererReferencePrestation(prestations);

      const nouvellePrestation: PrestationBibliotheque = {
        id: nouvelId,
        reference,
        designation: formulairePrestation.designation.trim(),
        unite: formulairePrestation.unite,
        prixUnitaire,
        tvaTaux,
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
      setFeedback({
        tone: "success",
        message: "Prestation ajoutée à la bibliothèque.",
      });
    } catch (error) {
      console.error("Erreur enregistrement prestation :", error);
      setFeedback({
        tone: "error",
        message: "Impossible d’enregistrer la prestation.",
      });
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
      tvaTaux: String(prestation.tvaTaux ?? 21),
      description: prestation.description,
    });
    setBibliothequeOuverte(true);
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
      setFeedback({
        tone: "success",
        message: "Prestation archivée.",
      });
    } catch (error) {
      console.error("Erreur archivage prestation :", error);
      setFeedback({
        tone: "error",
        message: "Impossible d’archiver la prestation.",
      });
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
      setFeedback({
        tone: "success",
        message: "Prestation restaurée.",
      });
    } catch (error) {
      console.error("Erreur restauration prestation :", error);
      setFeedback({
        tone: "error",
        message: "Impossible de restaurer la prestation.",
      });
    } finally {
      setSauvegardePrestationEnCours(false);
    }
  };

  const supprimerPrestation = async () => {
    if (!prestationASupprimer) return;

    try {
      setSauvegardePrestationEnCours(true);

      await deleteDoc(
        doc(db, "prestationsBibliotheque", prestationASupprimer.id)
      );

      if (prestationEditionId === prestationASupprimer.id) {
        resetPrestationFormulaire();
      }
      setFeedback({
        tone: "success",
        message: "Prestation supprimée définitivement.",
      });
      setPrestationASupprimer(null);
    } catch (error) {
      console.error("Erreur suppression prestation :", error);
      setFeedback({
        tone: "error",
        message: "Impossible de supprimer la prestation.",
      });
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

      {feedback && (
        <FeedbackMessage
          tone={feedback.tone}
          className="mt-4 sm:mt-6"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-lg px-2 py-1 text-xs font-bold underline-offset-4 transition duration-150 hover:bg-black/5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current motion-reduce:transition-none"
            >
              Fermer
            </button>
          </div>
        </FeedbackMessage>
      )}

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card
          padding="lg"
          className="overflow-hidden shadow-[0_12px_35px_rgba(15,23,42,0.06)]"
        >
          <button
            type="button"
            onClick={() => setInfosEntrepriseOuvertes((prev) => !prev)}
            className="-m-2 flex w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-2xl p-2 text-left transition duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 motion-reduce:transition-none"
            aria-expanded={infosEntrepriseOuvertes}
          >
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">
                Paramètres
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                Entreprise
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {entrepriseConfiguree
                  ? "Profil prêt pour les devis, factures, PDF et emails"
                  : "Configuration entreprise à finaliser"}
                {entrepriseSettings.logoUrl ? " - Logo chargé" : " - Aucun logo"}
              </p>
            </div>

            <span className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
              {infosEntrepriseOuvertes ? "Masquer ↑" : "Afficher ↓"}
            </span>
          </button>

          {infosEntrepriseOuvertes && (
            <>
              {!entrepriseConfiguree && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Complète ces informations une fois pour les réutiliser
                  automatiquement dans les devis, factures, PDF et emails.
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Profil entreprise
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Ces informations servent pour les PDF et emails.
                  </p>
                </div>

                <Button
                  onClick={handleSauvegardeEntreprise}
                  disabled={
                    chargementEntreprise ||
                    sauvegardeEntrepriseEnCours ||
                    uploadLogoEnCours
                  }
                  loading={sauvegardeEntrepriseEnCours}
                  loadingLabel="Enregistrement…"
                  className="w-full sm:w-auto"
                >
                  Enregistrer
                </Button>
              </div>

              {chargementEntreprise ? (
                <LoadingState
                  compact
                  label="Chargement des informations entreprise…"
                  className="mt-6 rounded-2xl border border-slate-200 bg-slate-50"
                />
              ) : (
                <>
                  <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2">
                    <div className="min-w-0 md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Nom de l’entreprise
                      </label>
                      <Input
                        type="text"
                        value={entrepriseSettings.nom}
                        onChange={(e) =>
                          handleEntrepriseChange("nom", e.target.value)
                        }
                        placeholder="Ex. Entreprise Dupont"
                        autoComplete="organization"
                      />
                    </div>

                    <div className="min-w-0 md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Adresse
                      </label>
                      <Input
                        type="text"
                        value={entrepriseSettings.adresse}
                        onChange={(e) =>
                          handleEntrepriseChange("adresse", e.target.value)
                        }
                        placeholder="Rue et numéro"
                        autoComplete="street-address"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Code postal
                      </label>
                      <Input
                        type="text"
                        value={entrepriseSettings.codePostal ?? ""}
                        onChange={(e) =>
                          handleEntrepriseChange("codePostal", e.target.value)
                        }
                        placeholder="1000"
                        autoComplete="postal-code"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Ville / commune
                      </label>
                      <Input
                        type="text"
                        value={entrepriseSettings.ville ?? ""}
                        onChange={(e) =>
                          handleEntrepriseChange("ville", e.target.value)
                        }
                        placeholder="Bruxelles"
                        autoComplete="address-level2"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={entrepriseSettings.email}
                        onChange={(e) =>
                          handleEntrepriseChange("email", e.target.value)
                        }
                        placeholder="contact@entreprise.be"
                        autoComplete="email"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Téléphone
                      </label>
                      <Input
                        type="text"
                        value={entrepriseSettings.telephone}
                        onChange={(e) =>
                          handleEntrepriseChange("telephone", e.target.value)
                        }
                        placeholder="+32 4 00 00 00 00"
                        autoComplete="tel"
                      />
                    </div>

                    <div className="min-w-0 md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        TVA
                      </label>
                      <Input
                        type="text"
                        value={entrepriseSettings.tva}
                        onChange={(e) =>
                          handleEntrepriseChange("tva", e.target.value)
                        }
                        placeholder="BE0123.456.789"
                      />
                    </div>

                    <div className="min-w-0 md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        IBAN
                      </label>
                      <Input
                        type="text"
                        value={entrepriseSettings.iban}
                        onChange={(e) =>
                          handleEntrepriseChange("iban", e.target.value)
                        }
                        placeholder="BE00 0000 0000 0000"
                      />
                      {!entrepriseSettings.iban.trim() && (
                        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                          IBAN manquant : une facture reste exportable, mais
                          un IBAN est attendu pour une facture crédible.
                        </p>
                      )}
                    </div>

                    <div className="min-w-0 md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Mentions légales facture
                      </label>
                      <Textarea
                        value={entrepriseSettings.mentionsLegalesFacture}
                        onChange={(e) =>
                          handleEntrepriseChange(
                            "mentionsLegalesFacture",
                            e.target.value
                          )
                        }
                        rows={4}
                        placeholder="Délais de paiement, indemnités et mentions applicables…"
                      />
                    </div>

                    <div className="min-w-0 md:col-span-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Numérotation des factures
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Ce réglage s’applique uniquement aux nouvelles
                              factures. Les anciennes conservent leur numéro.
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                            {apercuProchaineFacture}
                          </div>
                        </div>

                        {prochaineFactureInvalide && (
                          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                            Le prochain numéro doit être au moins{" "}
                            {plusGrandNumeroFacture + 1} pour éviter une
                            réutilisation apparente.
                          </p>
                        )}

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="min-w-0">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Préfixe
                            </label>
                            <Input
                              type="text"
                              value={invoiceNumberConfig.invoiceNumberPrefix}
                              onChange={(e) =>
                                setEntrepriseSettings((prev) => ({
                                  ...prev,
                                  invoiceNumberPrefix: e.target.value,
                                }))
                              }
                              placeholder="FAC"
                            />
                          </div>

                          <div className="min-w-0">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Format
                            </label>
                            <Select
                              value={invoiceNumberConfig.invoiceNumberFormat}
                              onChange={(e) =>
                                setEntrepriseSettings((prev) => ({
                                  ...prev,
                                  invoiceNumberFormat: e.target.value,
                                }))
                              }
                            >
                              <option value="{prefix}-{year}-{number}">
                                FAC-2026-001
                              </option>
                              <option value="{year}-{number}">2026-152</option>
                              <option value="{prefix}-{number}">F-152</option>
                              <option value="{prefix}-{year}-{rawNumber}">
                                FAC-2026-152
                              </option>
                            </Select>
                          </div>

                          <div className="min-w-0">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Chiffres minimum
                            </label>
                            <Input
                              type="number"
                              min={1}
                              max={8}
                              value={invoiceNumberConfig.invoiceNumberPadding}
                              onChange={(e) =>
                                setEntrepriseSettings((prev) => ({
                                  ...prev,
                                  invoiceNumberPadding: Math.max(
                                    1,
                                    Math.floor(Number(e.target.value) || 1)
                                  ),
                                }))
                              }
                            />
                          </div>

                          <div className="min-w-0">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Prochain numéro
                            </label>
                            <Input
                              type="number"
                              min={1}
                              value={invoiceNumberConfig.invoiceNextNumber}
                              onChange={(e) =>
                                setEntrepriseSettings((prev) => ({
                                  ...prev,
                                  invoiceNextNumber: Math.max(
                                    1,
                                    Math.floor(Number(e.target.value) || 1)
                                  ),
                                }))
                              }
                            />
                          </div>
                        </div>

                        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                          <input
                            type="checkbox"
                            checked={invoiceNumberConfig.invoiceResetYearly}
                            onChange={(e) =>
                              setEntrepriseSettings((prev) => ({
                                ...prev,
                                invoiceResetYearly: e.target.checked,
                              }))
                            }
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">
                              Réinitialiser chaque année
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              Si activé, le compteur repart à 1 quand
                              l’année change.
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Logo entreprise
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadLogoEnCours}
                      onChange={(e) =>
                        handleLogoChange(e.target.files?.[0] ?? null)
                      }
                      className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      {uploadLogoEnCours
                        ? "Upload du logo en cours..."
                        : "Le logo est envoyé dans Firebase Storage pour être visible dans les emails."}
                    </p>
                  </div>

                  {entrepriseSettings.logoUrl && (
                    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <input
                        type="checkbox"
                        checked={
                          entrepriseSettings.logoRemplaceNomEntreprise === true
                        }
                        onChange={(e) =>
                          handleEntrepriseBooleanChange(
                            "logoRemplaceNomEntreprise",
                            e.target.checked
                          )
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">
                          Utiliser le logo à la place du nom de l’entreprise
                          dans les emails
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Si cette option est cochée, le logo remplacera le gros
                          nom de l’entreprise dans les emails devis et factures.
                          Les coordonnées resteront affichées en dessous.
                        </span>
                      </span>
                    </label>
                  )}

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

                        <div className="rounded-xl bg-white p-3 text-xs text-slate-500">
                          <p className="font-semibold text-slate-700">
                            URL logo utilisée dans les emails :
                          </p>
                          <p className="mt-1 break-all">
                            {entrepriseSettings.logoUrl}
                          </p>
                        </div>

                        <Button
                          variant="danger"
                          onClick={() => void supprimerLogo()}
                          disabled={uploadLogoEnCours}
                          className="w-full"
                        >
                          Supprimer le logo
                        </Button>
                      </div>
                    ) : (
                      <EmptyState
                        icon="▧"
                        title="Aucun logo chargé"
                        description="Ajoute le logo de l’entreprise pour l’afficher dans les emails et les documents."
                        className="border-0 bg-transparent"
                      />
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </Card>

        <Card
          padding="lg"
          className="overflow-hidden shadow-[0_12px_35px_rgba(15,23,42,0.06)]"
        >
          <button
            type="button"
            onClick={() => setBibliothequeOuverte((prev) => !prev)}
            className="-m-2 flex w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-2xl p-2 text-left transition duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 motion-reduce:transition-none"
            aria-expanded={bibliothequeOuverte}
          >
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">
                Catalogue
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                Bibliothèque de prestations
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {prestationsActives.length} active
                {prestationsActives.length > 1 ? "s" : ""} ·{" "}
                {prestationsArchivees.length} archivée
                {prestationsArchivees.length > 1 ? "s" : ""}
                {prestationEditionId ? " · Édition en cours" : ""}
              </p>
            </div>

            <span className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
              {bibliothequeOuverte ? "Masquer ↑" : "Afficher ↓"}
            </span>
          </button>

          {bibliothequeOuverte && (
            <>
              <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Gestion des prestations
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Prépare tes prestations réutilisables pour les devis.
                  </p>
                </div>

                {prestationEditionId && (
                  <Button
                    variant="secondary"
                    onClick={resetPrestationFormulaire}
                  >
                    Annuler l’édition
                  </Button>
                )}
              </div>

              <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2">
                <div className="min-w-0 md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Désignation
                  </label>
                  <Input
                    type="text"
                    value={formulairePrestation.designation}
                    onChange={(e) =>
                      setFormulairePrestation((prev) => ({
                        ...prev,
                        designation: e.target.value,
                      }))
                    }
                    placeholder="Ex. Pose de carrelage"
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Unité
                  </label>
                  <Select
                    value={formulairePrestation.unite}
                    onChange={(e) =>
                      setFormulairePrestation((prev) => ({
                        ...prev,
                        unite: e.target.value as UnitePrestation,
                      }))
                    }
                  >
                    {UNITES_PREDEFINIES.map((unite) => (
                      <option key={unite} value={unite}>
                        {unite}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Prix unitaire
                  </label>
                  <Input
                    type="number"
                    value={formulairePrestation.prixUnitaire}
                    onChange={(e) =>
                      setFormulairePrestation((prev) => ({
                        ...prev,
                        prixUnitaire: e.target.value,
                      }))
                    }
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    TVA par défaut (%)
                  </label>
                  <Select
                    value={formulairePrestation.tvaTaux}
                    onChange={(e) =>
                      setFormulairePrestation((prev) => ({
                        ...prev,
                        tvaTaux: e.target.value,
                      }))
                    }
                  >
                    {obtenirOptionsTvaAvecValeur(
                      formulairePrestation.tvaTaux
                    ).map((taux) => (
                      <option key={taux} value={taux}>
                        {taux}%
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="min-w-0 md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <Textarea
                    value={formulairePrestation.description}
                    onChange={(e) =>
                      setFormulairePrestation((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Détail de la prestation, fournitures incluses…"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={enregistrerPrestation}
                  disabled={sauvegardePrestationEnCours}
                  loading={sauvegardePrestationEnCours}
                  loadingLabel="Enregistrement…"
                  className="w-full sm:w-auto"
                >
                  {prestationEditionId
                    ? "Enregistrer les modifications"
                    : "Ajouter la prestation"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={resetPrestationFormulaire}
                  disabled={sauvegardePrestationEnCours}
                  className="w-full sm:w-auto"
                >
                  Réinitialiser
                </Button>
              </div>

              <div className="mt-6">
                {chargementPrestations ? (
                  <LoadingState
                    compact
                    label="Chargement des prestations…"
                    className="rounded-2xl border border-slate-200 bg-slate-50"
                  />
                ) : prestations.length === 0 ? (
                  <EmptyState
                    icon="+"
                    title="Aucune prestation enregistrée"
                    description="Ajoute une première prestation pour la réutiliser rapidement dans tes prochains devis."
                  />
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
                            <h4 className="mt-1 break-words text-base font-semibold text-slate-900">
                              {prestation.designation}
                            </h4>
                            <p className="mt-1 text-sm text-slate-600">
                              {formatMontant(prestation.prixUnitaire)} ·{" "}
                              {prestation.unite} · TVA {prestation.tvaTaux ?? 21}%
                            </p>
                            <p className="mt-2 break-words text-sm text-slate-500">
                              {prestation.description || "Aucune description"}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => modifierPrestation(prestation)}
                            >
                              Modifier
                            </Button>

                            {!prestation.archive ? (
                              <Button
                                size="sm"
                                variant="warning"
                                onClick={() => archiverPrestation(prestation)}
                              >
                                Archiver
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => restaurerPrestation(prestation)}
                              >
                                Restaurer
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setPrestationASupprimer(prestation)}
                              className="col-span-2 sm:col-span-1"
                            >
                              Supprimer
                            </Button>
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
            </>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(prestationASupprimer)}
        title="Supprimer cette prestation ?"
        description={`La prestation « ${prestationASupprimer?.designation ?? ""} » sera supprimée définitivement de la bibliothèque. Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        loading={sauvegardePrestationEnCours}
        onCancel={() => setPrestationASupprimer(null)}
        onConfirm={() => void supprimerPrestation()}
      />
    </>
  );
}
