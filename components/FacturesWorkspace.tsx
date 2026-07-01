"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { deleteDoc, doc, runTransaction, setDoc, updateDoc } from "firebase/firestore";
import DevisPreviewModal from "./DevisPreviewModal";
import FactureKpiCards from "./FactureKpiCards";
import MobileFullscreenModal from "./MobileFullscreenModal";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";
import ConfirmDialog from "./ui/ConfirmDialog";
import EmptyState from "./ui/EmptyState";
import SectionHeader from "./ui/SectionHeader";
import { useEntrepriseChantiers } from "../hooks/useEntrepriseChantiers";
import { useEntrepriseClients } from "../hooks/useEntrepriseClients";
import { useEntrepriseFactures } from "../hooks/useEntrepriseFactures";
import { useEntrepriseSettings } from "../hooks/useEntrepriseSettings";
import { useEntrepriseDevis } from "../hooks/useEntrepriseDevis";
import { useEntreprisePrestations } from "../hooks/useEntreprisePrestations";
import { exporterFacturePdf } from "../lib/export-facture-pdf";
import { auth, db } from "../lib/firebase";
import { obtenirOptionsTvaAvecValeur } from "../lib/devis-constants";
import {
  calculerTotalHt,
  calculerTotalTvac,
  formatMontant,
  normaliserLignesDevis,
} from "../lib/devis-helpers";
import {
  arrondirMontant,
  calculerTotauxDepuisFacture,
  calculerTotauxFacture,
  convertirLignesFactureFormEnLignes,
  convertirNombre,
  creerLigneFactureFormVide,
  genererIdLigneFacture,
  genererReferenceFactureDepuisConfig,
  getInvoiceNumberSettings,
  normaliserLignesFacture,
  TAUX_TVA_FACTURE,
  type LigneFactureFormState,
} from "../lib/facture-helpers";
import type { Facture, StatutFacture } from "../types/factures";
import type { Chantier, StatutChantier } from "../types/chantiers";
import type { Client, TypeClient } from "../types/clients";

type FiltreArchivage = "actifs" | "archives" | "tous";
type FiltreStatut = "Tous" | StatutFacture;
type FactureFormSectionKey =
  | "informations"
  | "client"
  | "chantier"
  | "lignes"
  | "bibliotheque"
  | "totaux";

type Props = {
  entrepriseId?: string;
  createdByUid?: string;
  onFeedback?: (message: string) => void;
};

type FactureFormState = {
  devisId: string;
  objet: string;
  clientId: string;
  chantierId: string;
  dateEmission: string;
  dateEcheance: string;
  datePaiement: string;
  statut: StatutFacture;
  montantHt: string;
  tvaTaux: string;
  acompteDeduit: string;
  notes: string;
  lignes: LigneFactureFormState[];
  nouveauClientNom: string;
  nouveauClientType: TypeClient;
  nouveauClientSociete: string;
  nouveauClientTva: string;
  nouveauClientEmail: string;
  nouveauClientTelephone: string;
  nouveauClientAdresse: string;
  nouveauClientCodePostal: string;
  nouveauClientVille: string;
  nouveauClientPays: string;
  nouveauChantierTitre: string;
  nouveauChantierAdresse: string;
  nouveauChantierCodePostal: string;
  nouveauChantierVille: string;
  nouveauChantierDateDebut: string;
  nouveauChantierDateFin: string;
  nouveauChantierStatut: StatutChantier;
};

const STATUTS_FACTURE: StatutFacture[] = [
  "Brouillon",
  "Envoyée",
  "Payée",
  "En retard",
  "Annulée",
];

const STATUTS_CHANTIER: StatutChantier[] = [
  "À planifier",
  "Planifié",
  "En cours",
  "Terminé",
  "Suspendu",
];

const PAYS_CLIENT_PAR_DEFAUT = "Belgique";
const SECTIONS_FACTURE_DEFAUT: Record<FactureFormSectionKey, boolean> = {
  informations: true,
  client: true,
  chantier: false,
  lignes: true,
  bibliotheque: false,
  totaux: true,
};

const creerFormulaireVide = (): FactureFormState => ({
  devisId: "",
  objet: "",
  clientId: "",
  chantierId: "",
  dateEmission: "",
  dateEcheance: "",
  datePaiement: "",
  statut: "Brouillon",
  montantHt: "0",
  tvaTaux: "21",
  acompteDeduit: "0",
  notes: "",
  lignes: [creerLigneFactureFormVide(21)],
  nouveauClientNom: "",
  nouveauClientType: "Particulier",
  nouveauClientSociete: "",
  nouveauClientTva: "",
  nouveauClientEmail: "",
  nouveauClientTelephone: "",
  nouveauClientAdresse: "",
  nouveauClientCodePostal: "",
  nouveauClientVille: "",
  nouveauClientPays: PAYS_CLIENT_PAR_DEFAUT,
  nouveauChantierTitre: "",
  nouveauChantierAdresse: "",
  nouveauChantierCodePostal: "",
  nouveauChantierVille: "",
  nouveauChantierDateDebut: "",
  nouveauChantierDateFin: "",
  nouveauChantierStatut: "À planifier",
});

const champFormulaireClasses =
  "block w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

const champDateClasses =
  "block w-full min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-slate-400";

const filtreFactureClasses =
  "block min-h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-900/[0.02] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100";

const styleDateMobile = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  WebkitAppearance: "none",
  appearance: "none",
} as const;

function FactureFormSection({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 sm:px-5"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">
            {title}
          </span>
          {subtitle && (
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              {subtitle}
            </span>
          )}
        </span>
        <span className="shrink-0 text-lg font-semibold text-slate-500">
          {open ? "-" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
          {children}
        </div>
      )}
    </section>
  );
}

function calculerNetAPayer(facture: Facture) {
  return calculerTotauxDepuisFacture(facture).netAPayer;
}

function genererReferenceClient(clients: Client[]) {
  const plusGrandNumero = clients.reduce((max, client) => {
    const match = client.reference?.match(/CLI-(\d+)/);
    if (!match) return max;
    const numero = Number(match[1]);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);

  return `CLI-${String(plusGrandNumero + 1).padStart(4, "0")}`;
}

function genererReferenceChantier(chantiers: Chantier[]) {
  const plusGrandNumero = chantiers.reduce((max, chantier) => {
    const match = chantier.reference?.match(/CH-(\d+)/);
    if (!match) return max;
    const numero = Number(match[1]);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);

  return `CH-${String(plusGrandNumero + 1).padStart(4, "0")}`;
}

function factureADejaEteEnvoyee(facture: Facture) {
  return facture.statut === "Envoyée";
}

export default function FacturesWorkspace({
  entrepriseId,
  createdByUid,
  onFeedback,
}: Props) {
  const [recherche, setRecherche] = useState("");
  const [filtreArchivage, setFiltreArchivage] =
    useState<FiltreArchivage>("actifs");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("Tous");
  const [factureSelectionneeId, setFactureSelectionneeId] = useState<
    string | null
  >(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [confirmation, setConfirmation] = useState<
    "fermeture" | "selection" | "suppression" | null
  >(null);
  const [factureASelectionnerId, setFactureASelectionnerId] = useState<
    string | null
  >(null);
  const [recherchePrestation, setRecherchePrestation] = useState("");
  const [afficherActionsFactureMobile, setAfficherActionsFactureMobile] =
    useState(false);
  const [sectionsFactureOuvertes, setSectionsFactureOuvertes] = useState(
    SECTIONS_FACTURE_DEFAUT
  );
  const [formulaire, setFormulaire] = useState<FactureFormState>(
    creerFormulaireVide()
  );

  const { factures, chargement } = useEntrepriseFactures({
    authChargee: true,
    userId: createdByUid ?? null,
    entrepriseIdCourante: entrepriseId ?? null,
    estAdmin: true,
  });

  const { clients } = useEntrepriseClients({
    authChargee: true,
    userId: createdByUid ?? null,
    entrepriseIdCourante: entrepriseId ?? null,
    estAdmin: true,
  });

  const { chantiers } = useEntrepriseChantiers({
    authChargee: true,
    userId: createdByUid ?? null,
    entrepriseIdCourante: entrepriseId ?? null,
    estAdmin: true,
  });

  const { devis } = useEntrepriseDevis({
    authChargee: true,
    userId: createdByUid ?? null,
    entrepriseIdCourante: entrepriseId ?? null,
    estAdmin: true,
  });

  const { entrepriseSettings } = useEntrepriseSettings({
    entrepriseIdCourante: entrepriseId ?? null,
    userId: createdByUid ?? null,
    authChargee: true,
  });

  const { prestations, chargement: chargementPrestations } =
    useEntreprisePrestations({
      authChargee: true,
      userId: createdByUid ?? null,
      entrepriseIdCourante: entrepriseId ?? null,
      estAdmin: true,
    });

  const clientsActifs = useMemo(
    () => clients.filter((client) => !client.archive),
    [clients]
  );

  const chantiersActifs = useMemo(
    () => chantiers.filter((chantier) => !chantier.archive),
    [chantiers]
  );

  const devisActifs = useMemo(
    () => devis.filter((item) => !item.archive),
    [devis]
  );

  const prestationsActives = useMemo(
    () => prestations.filter((prestation) => !prestation.archive),
    [prestations]
  );

  const prestationsFiltrees = useMemo(() => {
    const recherche = recherchePrestation.trim().toLowerCase();

    if (!recherche) return prestationsActives;

    return prestationsActives.filter((prestation) => {
      const designation = prestation.designation?.toLowerCase() ?? "";
      const description = prestation.description?.toLowerCase() ?? "";
      const unite = prestation.unite?.toLowerCase() ?? "";
      const prix = String(prestation.prixUnitaire ?? "").toLowerCase();

      return (
        designation.includes(recherche) ||
        description.includes(recherche) ||
        unite.includes(recherche) ||
        prix.includes(recherche)
      );
    });
  }, [prestationsActives, recherchePrestation]);

  const trouverClientDuDevis = (devisId: string) => {
    const devisSelectionne = devisActifs.find((item) => item.id === devisId);
    if (!devisSelectionne) return null;

    return (
      clientsActifs.find((client) => {
        const memeNom = client.nom === devisSelectionne.client;
        const memeEmail =
          devisSelectionne.email &&
          client.email &&
          client.email === devisSelectionne.email;

        return memeNom || memeEmail;
      }) ?? null
    );
  };

  const devisCorrespondAuClient = (devisId: string, clientId: string) => {
    const client = clientsActifs.find((item) => item.id === clientId);
    const devisSelectionne = devisActifs.find((item) => item.id === devisId);

    if (!client || !devisSelectionne) return false;

    const memeNom = devisSelectionne.client === client.nom;
    const memeEmail =
      devisSelectionne.email &&
      client.email &&
      devisSelectionne.email === client.email;

    return Boolean(memeNom || memeEmail);
  };

  const chantiersDisponibles = useMemo(() => {
    if (!formulaire.clientId) return chantiersActifs;

    return chantiersActifs.filter(
      (chantier) => chantier.clientId === formulaire.clientId
    );
  }, [chantiersActifs, formulaire.clientId]);

  const devisDisponibles = useMemo(() => {
    if (formulaire.chantierId) {
      return devisActifs.filter(
        (item) => item.chantierId === formulaire.chantierId
      );
    }

    if (formulaire.clientId) {
      return devisActifs.filter((item) =>
        devisCorrespondAuClient(item.id, formulaire.clientId)
      );
    }

    return devisActifs;
  }, [devisActifs, formulaire.chantierId, formulaire.clientId]);

  const creerLignesDepuisDevis = (devisId: string): LigneFactureFormState[] => {
    const devisSelectionne = devisActifs.find((item) => item.id === devisId);

    if (!devisSelectionne?.lignes?.length) {
      return [creerLigneFactureFormVide()];
    }

    return normaliserLignesDevis(devisSelectionne).map((ligne) => ({
      id: genererIdLigneFacture(),
      description: ligne.designation,
      quantite: String(ligne.quantite),
      unite: ligne.unite,
      prixUnitaireHt: String(ligne.prixUnitaire),
      tvaTaux: String(ligne.tvaTaux ?? devisSelectionne.tvaTaux ?? 21),
    }));
  };

  const creerLignesDepuisFacture = (facture: Facture): LigneFactureFormState[] => {
    const lignes = normaliserLignesFacture(facture);

    if (lignes.length === 0) {
      return [creerLigneFactureFormVide(facture.tvaTaux ?? 21)];
    }

    return lignes.map((ligne) => ({
      id: ligne.id || genererIdLigneFacture(),
      description: ligne.description,
      quantite: String(ligne.quantite),
      unite: ligne.unite,
      prixUnitaireHt: String(ligne.prixUnitaireHt),
      tvaTaux: String(ligne.tvaTaux),
    }));
  };

  const appliquerDevisAuFormulaire = (
    devisId: string,
    options?: { forcerObjet?: boolean }
  ) => {
    const devisSelectionne =
      devisActifs.find((item) => item.id === devisId) ?? null;

    if (!devisSelectionne) {
      setFormulaire((prev) => ({
        ...prev,
        devisId: "",
      }));
      return;
    }

    const clientAssocie = trouverClientDuDevis(devisSelectionne.id);

    const chantierAssocie = devisSelectionne.chantierId
      ? chantiersActifs.find(
          (chantier) => chantier.id === devisSelectionne.chantierId
        ) ?? null
      : null;

    const acompte = arrondirMontant(
      calculerTotalTvac(devisSelectionne) *
        ((devisSelectionne.acomptePourcentage ?? 0) / 100)
    );

    setFormulaire((prev) => ({
      ...prev,
      devisId: devisSelectionne.id,
      objet:
        options?.forcerObjet || !prev.objet.trim()
          ? `Facture - ${devisSelectionne.id}`
          : prev.objet,
      clientId: clientAssocie?.id ?? prev.clientId,
      chantierId: chantierAssocie?.id ?? devisSelectionne.chantierId ?? "",
      montantHt: String(arrondirMontant(calculerTotalHt(devisSelectionne))),
      tvaTaux: String(devisSelectionne.tvaTaux),
      acompteDeduit: String(acompte),
      notes: devisSelectionne.conditions ?? prev.notes,
      lignes: creerLignesDepuisDevis(devisSelectionne.id),
    }));
  };

  const handleSelectionClient = (clientId: string) => {
    if (!clientId) {
      setFormulaire((prev) => ({
        ...prev,
        clientId: "",
        chantierId: "",
        devisId: "",
      }));
      return;
    }

    const chantiersDuClient = chantiersActifs.filter(
      (chantier) => chantier.clientId === clientId
    );

    const devisDuClient = devisActifs.filter((item) =>
      devisCorrespondAuClient(item.id, clientId)
    );

    const chantierUnique =
      chantiersDuClient.length === 1 ? chantiersDuClient[0] : null;

    const devisCompatibles = chantierUnique
      ? devisDuClient.filter((item) => item.chantierId === chantierUnique.id)
      : devisDuClient;

    const devisUnique =
      devisCompatibles.length === 1 ? devisCompatibles[0] : null;

    setFormulaire((prev) => ({
      ...prev,
      clientId,
      chantierId: chantierUnique?.id ?? "",
      devisId: devisUnique?.id ?? "",
      nouveauClientNom: "",
      nouveauClientType: "Particulier",
      nouveauClientSociete: "",
      nouveauClientTva: "",
      nouveauClientEmail: "",
      nouveauClientTelephone: "",
      nouveauClientAdresse: "",
      nouveauClientCodePostal: "",
      nouveauClientVille: "",
      nouveauClientPays: PAYS_CLIENT_PAR_DEFAUT,
      ...(chantierUnique
        ? {
            nouveauChantierTitre: "",
            nouveauChantierAdresse: "",
            nouveauChantierCodePostal: "",
            nouveauChantierVille: "",
            nouveauChantierDateDebut: "",
            nouveauChantierDateFin: "",
            nouveauChantierStatut: "À planifier" as StatutChantier,
          }
        : {}),
      objet:
        devisUnique && !prev.objet.trim()
          ? `Facture - ${devisUnique.id}`
          : prev.objet,
      montantHt: devisUnique
        ? String(arrondirMontant(calculerTotalHt(devisUnique)))
        : prev.montantHt,
      tvaTaux: devisUnique ? String(devisUnique.tvaTaux) : prev.tvaTaux,
      acompteDeduit: devisUnique
        ? String(
            arrondirMontant(
              calculerTotalTvac(devisUnique) *
                ((devisUnique.acomptePourcentage ?? 0) / 100)
            )
          )
        : prev.acompteDeduit,
      notes: devisUnique?.conditions ?? prev.notes,
      lignes: devisUnique ? creerLignesDepuisDevis(devisUnique.id) : prev.lignes,
    }));
  };

  const handleSelectionDevis = (devisId: string) => {
    appliquerDevisAuFormulaire(devisId, { forcerObjet: true });
  };

  const handleSelectionChantier = (chantierId: string) => {
    const chantier =
      chantiersActifs.find((item) => item.id === chantierId) ?? null;

    if (!chantier) {
      setFormulaire((prev) => ({
        ...prev,
        chantierId: "",
        devisId: "",
      }));
      return;
    }

    const devisDuChantier = devisActifs
      .filter((item) => item.chantierId === chantier.id)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    const devisAssocie = devisDuChantier[0] ?? null;

    if (devisAssocie) {
      const acompte = arrondirMontant(
        calculerTotalTvac(devisAssocie) *
          ((devisAssocie.acomptePourcentage ?? 0) / 100)
      );

      setFormulaire((prev) => ({
        ...prev,
        chantierId: chantier.id,
        clientId: chantier.clientId ?? prev.clientId,
        nouveauClientNom: "",
        nouveauClientType: "Particulier",
        nouveauClientSociete: "",
        nouveauClientTva: "",
        nouveauClientEmail: "",
        nouveauClientTelephone: "",
        nouveauClientAdresse: "",
        nouveauClientCodePostal: "",
        nouveauClientVille: "",
        nouveauClientPays: PAYS_CLIENT_PAR_DEFAUT,
        nouveauChantierTitre: "",
        nouveauChantierAdresse: "",
        nouveauChantierCodePostal: "",
        nouveauChantierVille: "",
        nouveauChantierDateDebut: "",
        nouveauChantierDateFin: "",
        nouveauChantierStatut: "À planifier",
        devisId: devisAssocie.id,
        objet: `Facture - ${devisAssocie.id}`,
        montantHt: String(arrondirMontant(calculerTotalHt(devisAssocie))),
        tvaTaux: String(devisAssocie.tvaTaux),
        acompteDeduit: String(acompte),
        notes: devisAssocie.conditions ?? prev.notes,
        lignes: creerLignesDepuisDevis(devisAssocie.id),
      }));

      return;
    }

    setFormulaire((prev) => ({
      ...prev,
      chantierId: chantier.id,
      clientId: chantier.clientId ?? prev.clientId,
      nouveauClientNom: "",
      nouveauClientType: "Particulier",
      nouveauClientSociete: "",
      nouveauClientTva: "",
      nouveauClientEmail: "",
      nouveauClientTelephone: "",
      nouveauClientAdresse: "",
      nouveauClientCodePostal: "",
      nouveauClientVille: "",
      nouveauClientPays: PAYS_CLIENT_PAR_DEFAUT,
      nouveauChantierTitre: "",
      nouveauChantierAdresse: "",
      nouveauChantierCodePostal: "",
      nouveauChantierVille: "",
      nouveauChantierDateDebut: "",
      nouveauChantierDateFin: "",
      nouveauChantierStatut: "À planifier",
      devisId: "",
      objet: prev.objet.trim() ? prev.objet : `Facture - ${chantier.titre}`,
    }));
  };

  const facturesFiltrees = useMemo(() => {
    const valeur = recherche.trim().toLowerCase();

    return factures.filter((facture) => {
      const texte = [
        facture.reference ?? "",
        facture.objet ?? "",
        facture.clientNom ?? "",
        facture.chantierTitre ?? "",
        facture.devisReference ?? "",
        facture.statut ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchRecherche = !valeur || texte.includes(valeur);
      const matchStatut =
        filtreStatut === "Tous" ? true : facture.statut === filtreStatut;

      const estArchive = facture.archive === true;
      const matchArchivage =
        filtreArchivage === "tous"
          ? true
          : filtreArchivage === "archives"
          ? estArchive
          : !estArchive;

      return matchRecherche && matchStatut && matchArchivage;
    });
  }, [factures, recherche, filtreStatut, filtreArchivage]);

  const factureSelectionnee = useMemo(() => {
    if (facturesFiltrees.length === 0) return null;
    if (!factureSelectionneeId) return null;

    return (
      facturesFiltrees.find(
        (facture) => facture.id === factureSelectionneeId
      ) ?? null
    );
  }, [facturesFiltrees, factureSelectionneeId]);

  const totalFactures = useMemo(
    () => factures.filter((facture) => !facture.archive).length,
    [factures]
  );

  const totalPayees = useMemo(
    () =>
      factures.filter(
        (facture) => facture.statut === "Payée" && !facture.archive
      ).length,
    [factures]
  );

  const totalRetard = useMemo(
    () =>
      factures.filter(
        (facture) => facture.statut === "En retard" && !facture.archive
      ).length,
    [factures]
  );

  const totalNetFacture = useMemo(
    () =>
      factures
        .filter((facture) => !facture.archive && facture.statut !== "Annulée")
        .reduce((total, facture) => total + calculerNetAPayer(facture), 0),
    [factures]
  );

  const resetFormulaire = () => {
    setFormulaire(creerFormulaireVide());
    setRecherchePrestation("");
  };

  const formulaireFactureContientSaisie = useMemo(
    () =>
      modeEdition ||
      [
        formulaire.devisId,
        formulaire.objet,
        formulaire.clientId,
        formulaire.chantierId,
        formulaire.dateEmission,
        formulaire.dateEcheance,
        formulaire.datePaiement,
        formulaire.notes,
        formulaire.nouveauClientNom,
        formulaire.nouveauClientSociete,
        formulaire.nouveauClientTva,
        formulaire.nouveauClientEmail,
        formulaire.nouveauClientTelephone,
        formulaire.nouveauClientAdresse,
        formulaire.nouveauClientCodePostal,
        formulaire.nouveauClientVille,
        formulaire.nouveauChantierTitre,
        formulaire.nouveauChantierAdresse,
        formulaire.nouveauChantierCodePostal,
        formulaire.nouveauChantierVille,
        formulaire.nouveauChantierDateDebut,
        formulaire.nouveauChantierDateFin,
      ].some((valeur) => valeur.trim()) ||
      formulaire.statut !== "Brouillon" ||
      formulaire.tvaTaux !== "21" ||
      formulaire.acompteDeduit !== "0" ||
      formulaire.nouveauClientType !== "Particulier" ||
      formulaire.nouveauClientPays !== PAYS_CLIENT_PAR_DEFAUT ||
      formulaire.nouveauChantierStatut !== "À planifier" ||
      formulaire.lignes.length > 1 ||
      formulaire.lignes.some(
        (ligne) =>
          ligne.description.trim() ||
          ligne.prixUnitaireHt.trim() ||
          ligne.quantite !== "1" ||
          ligne.unite !== "forfait" ||
          ligne.tvaTaux !== "21"
      ),
    [formulaire, modeEdition]
  );

  const ouvrirCreation = () => {
    resetFormulaire();
    setSectionsFactureOuvertes(SECTIONS_FACTURE_DEFAUT);
    setFactureSelectionneeId(null);
    setAfficherActionsFactureMobile(false);
    setAfficherFormulaire(true);
    setModeEdition(false);
  };

  const fermerFormulaire = () => {
    setAfficherActionsFactureMobile(false);
    setAfficherFormulaire(false);
    setModeEdition(false);
    resetFormulaire();
  };

  const demanderFermetureFormulaire = () => {
    if (!sauvegardeEnCours && formulaireFactureContientSaisie) {
      setConfirmation("fermeture");
      return;
    }

    fermerFormulaire();
  };

  const fermerDetailMobile = () => {
    setAfficherActionsFactureMobile(false);
    setModeEdition(false);
    setFactureSelectionneeId(null);
  };

  const selectionnerFacture = (factureId: string) => {
    if (afficherFormulaireFacture && formulaireFactureContientSaisie) {
      setFactureASelectionnerId(factureId);
      setConfirmation("selection");
      return;
    }

    setAfficherActionsFactureMobile(false);
    setFactureSelectionneeId(factureId);
    setModeEdition(false);
    setAfficherFormulaire(false);
  };

  const ouvrirEdition = () => {
    setAfficherActionsFactureMobile(false);
    if (!factureSelectionnee) return;

    setFormulaire({
      devisId: factureSelectionnee.devisId ?? "",
      objet: factureSelectionnee.objet,
      clientId: factureSelectionnee.clientId,
      chantierId: factureSelectionnee.chantierId,
      dateEmission: factureSelectionnee.dateEmission,
      dateEcheance: factureSelectionnee.dateEcheance,
      datePaiement: factureSelectionnee.datePaiement,
      statut: factureSelectionnee.statut,
      montantHt: String(factureSelectionnee.montantHt),
      tvaTaux: String(factureSelectionnee.tvaTaux),
      acompteDeduit: String(factureSelectionnee.acompteDeduit),
      notes: factureSelectionnee.notes,
      lignes: creerLignesDepuisFacture(factureSelectionnee),
      nouveauClientNom: "",
      nouveauClientType: "Particulier",
      nouveauClientSociete: "",
      nouveauClientTva: "",
      nouveauClientEmail: "",
      nouveauClientTelephone: "",
      nouveauClientAdresse: "",
      nouveauClientCodePostal: "",
      nouveauClientVille: "",
      nouveauClientPays: PAYS_CLIENT_PAR_DEFAUT,
      nouveauChantierTitre: "",
      nouveauChantierAdresse: "",
      nouveauChantierCodePostal: "",
      nouveauChantierVille: "",
      nouveauChantierDateDebut: "",
      nouveauChantierDateFin: "",
      nouveauChantierStatut: "À planifier",
    });

    setSectionsFactureOuvertes({
      ...SECTIONS_FACTURE_DEFAUT,
      chantier: Boolean(factureSelectionnee.chantierId),
      totaux: true,
    });
    setModeEdition(true);
    setAfficherFormulaire(false);
  };

  useEffect(() => {
    const handleNouvelleFacture = () => {
      ouvrirCreation();
    };

    window.addEventListener("batiflow:nouvelle-facture", handleNouvelleFacture);

    return () => {
      window.removeEventListener(
        "batiflow:nouvelle-facture",
        handleNouvelleFacture
      );
    };
  }, []);

  const enregistrerFacture = async () => {
    if (!entrepriseId || !createdByUid) {
      alert("Impossible d’identifier l’entreprise ou l’utilisateur.");
      return;
    }

    if (!formulaire.objet.trim()) {
      setSectionsFactureOuvertes((prev) => ({ ...prev, informations: true }));
      alert("L’objet de la facture est obligatoire.");
      return;
    }

    if (!formulaire.clientId && !formulaire.nouveauClientNom.trim()) {
      setSectionsFactureOuvertes((prev) => ({ ...prev, client: true }));
      alert("Sélectionne un client ou saisis un nouveau client.");
      return;
    }

    if (!formulaire.dateEmission) {
      setSectionsFactureOuvertes((prev) => ({ ...prev, informations: true }));
      alert("La date d’émission est obligatoire.");
      return;
    }

    const clientExistantSimple =
      !formulaire.clientId && formulaire.nouveauClientNom.trim()
        ? clientsActifs.find((client) => {
            const memeNom =
              client.nom.trim().toLowerCase() ===
              formulaire.nouveauClientNom.trim().toLowerCase();
            const memeEmail =
              formulaire.nouveauClientEmail.trim() &&
              client.email.trim().toLowerCase() ===
                formulaire.nouveauClientEmail.trim().toLowerCase();

            return memeNom || Boolean(memeEmail);
          }) ?? null
        : null;

    const clientAssocie =
      clientsActifs.find((client) => client.id === formulaire.clientId) ??
      clientExistantSimple;

    if (!clientAssocie && !formulaire.nouveauClientNom.trim()) {
      alert("Le client sélectionné est introuvable.");
      return;
    }

    const maintenant = Date.now();
    const clientCree: Client | null = clientAssocie
      ? null
      : {
          id: `${entrepriseId}-cli-${crypto.randomUUID()}`,
          reference: genererReferenceClient(clients),
          nom: formulaire.nouveauClientNom.trim(),
          typeClient: formulaire.nouveauClientType,
          societe: formulaire.nouveauClientSociete.trim(),
          email: formulaire.nouveauClientEmail.trim(),
          telephone: formulaire.nouveauClientTelephone.trim(),
          adresse: formulaire.nouveauClientAdresse.trim(),
          codePostal: formulaire.nouveauClientCodePostal.trim(),
          ville: formulaire.nouveauClientVille.trim(),
          pays:
            formulaire.nouveauClientPays.trim() || PAYS_CLIENT_PAR_DEFAUT,
          tva: formulaire.nouveauClientTva.trim(),
          notes: "",
          entrepriseId,
          createdByUid,
          archive: false,
          createdAt: maintenant,
          updatedAt: maintenant,
        };
    const clientFinal = clientAssocie ?? clientCree;

    if (!clientFinal) {
      alert("Impossible de préparer le client de la facture.");
      return;
    }

    const chantierAssocie =
      chantiersActifs.find((chantier) => chantier.id === formulaire.chantierId) ??
      null;

    const devisAssocie =
      devisActifs.find((item) => item.id === formulaire.devisId) ?? null;

    const chantierAssocieFinal =
      chantierAssocie ??
      (devisAssocie?.chantierId
        ? chantiersActifs.find(
            (chantier) => chantier.id === devisAssocie.chantierId
          ) ?? null
        : null);
    const chantierExistantSimple =
      !chantierAssocieFinal && formulaire.nouveauChantierTitre.trim()
        ? chantiersActifs.find(
            (chantier) =>
              chantier.clientId === clientFinal.id &&
              chantier.titre.trim().toLowerCase() ===
                formulaire.nouveauChantierTitre.trim().toLowerCase()
          ) ?? null
        : null;
    const chantierCree: Chantier | null =
      !chantierAssocieFinal &&
      !chantierExistantSimple &&
      formulaire.nouveauChantierTitre.trim()
        ? {
            id: `${entrepriseId}-ch-${crypto.randomUUID()}`,
            reference: genererReferenceChantier(chantiers),
            titre: formulaire.nouveauChantierTitre.trim(),
            clientId: clientFinal.id,
            clientNom: clientFinal.nom,
            adresse:
              formulaire.nouveauChantierAdresse.trim() ||
              clientFinal.adresse ||
              "",
            codePostal:
              formulaire.nouveauChantierCodePostal.trim() ||
              clientFinal.codePostal ||
              "",
            ville:
              formulaire.nouveauChantierVille.trim() ||
              clientFinal.ville ||
              "",
            dateDebut: formulaire.nouveauChantierDateDebut,
            dateFin: formulaire.nouveauChantierDateFin,
            statut: formulaire.nouveauChantierStatut,
            description: "",
            notes: "",
            entrepriseId,
            createdByUid,
            archive: false,
            createdAt: maintenant,
            updatedAt: maintenant,
          }
        : null;
    const chantierFinal =
      chantierAssocieFinal ?? chantierExistantSimple ?? chantierCree;

    const lignes = convertirLignesFactureFormEnLignes(formulaire.lignes);
    const acompteDeduit = arrondirMontant(
      convertirNombre(formulaire.acompteDeduit)
    );
    const totaux = calculerTotauxFacture(lignes, acompteDeduit);
    const montantHt = totaux.montantHt;
    const tvaTaux =
      totaux.detailTva.length === 1
        ? totaux.detailTva[0].taux
        : arrondirMontant(convertirNombre(formulaire.tvaTaux));

    if (lignes.length === 0) {
      setSectionsFactureOuvertes((prev) => ({ ...prev, lignes: true }));
      alert("Ajoute au moins une ligne de facture valide.");
      return;
    }

    if (montantHt < 0 || tvaTaux < 0 || acompteDeduit < 0) {
      alert("Les montants doivent être valides.");
      return;
    }

    if (
      devisAssocie &&
      factures.some(
        (facture) =>
          facture.devisId === devisAssocie.id &&
          facture.id !== factureSelectionnee?.id
      )
    ) {
      alert("Ce devis est déjà lié à une facture.");
      return;
    }

    try {
      setSauvegardeEnCours(true);

      if (modeEdition && factureSelectionnee) {
        if (clientCree) {
          await setDoc(doc(db, "clients", clientCree.id), clientCree);
        }

        if (chantierCree) {
          await setDoc(doc(db, "chantiers", chantierCree.id), chantierCree);
        }

        await updateDoc(doc(db, "factures", factureSelectionnee.id), {
          ...factureSelectionnee,
          objet: formulaire.objet.trim(),
          clientId: clientFinal.id,
          clientNom: clientFinal.nom,
          clientAdresse: clientFinal.adresse ?? "",
          clientCodePostal: clientFinal.codePostal ?? "",
          clientVille: clientFinal.ville ?? "",
          clientEmail: clientFinal.email ?? "",
          clientTelephone: clientFinal.telephone ?? "",
          chantierId: chantierFinal?.id ?? devisAssocie?.chantierId ?? "",
          chantierTitre:
            chantierFinal?.titre ?? devisAssocie?.chantierTitre ?? "",
          devisId: devisAssocie?.id ?? "",
          devisReference: devisAssocie?.id ?? "",
          dateEmission: formulaire.dateEmission,
          dateEcheance: formulaire.dateEcheance,
          datePaiement: formulaire.datePaiement,
          statut: formulaire.statut,
          montantHt,
          tvaTaux,
          lignes,
          detailTva: totaux.detailTva,
          totalTva: totaux.totalTva,
          totalTtc: totaux.totalTtc,
          typeFacture: devisAssocie ? "depuis_devis" : "libre",
          acompteDeduit,
          notes: formulaire.notes.trim(),
          updatedAt: maintenant,
        });

        setModeEdition(false);
        setAfficherFormulaire(false);
        resetFormulaire();
        return;
      }

      const nouvelId = `${entrepriseId}-fa-${crypto.randomUUID()}`;
      const factureRef = doc(db, "factures", nouvelId);
      const entrepriseRef = doc(db, "entreprises", entrepriseId);
      const devisRef = devisAssocie
        ? doc(db, "devis", devisAssocie.id)
        : null;
      let reference = "";

      await runTransaction(db, async (transaction) => {
        const entrepriseSnap = await transaction.get(entrepriseRef);
        const factureSnap = await transaction.get(factureRef);
        const devisSnap = devisRef ? await transaction.get(devisRef) : null;

        if (!entrepriseSnap.exists()) {
          throw new Error("Entreprise introuvable.");
        }

        if (factureSnap.exists()) {
          throw new Error("Collision d'identifiant facture.");
        }

        if (devisRef) {
          const devisData = devisSnap?.data() as
            | {
                entrepriseId?: string;
                statut?: string;
                factureId?: string;
              }
            | undefined;

          if (
            !devisSnap?.exists() ||
            devisData?.entrepriseId !== entrepriseId ||
            devisData.statut !== "Accepté"
          ) {
            throw new Error(
              "Seul un devis accepté de cette entreprise peut être facturé."
            );
          }

          if (devisData.factureId) {
            throw new Error("Ce devis est déjà lié à une facture.");
          }
        }

        const entrepriseData = entrepriseSnap.exists() ? entrepriseSnap.data() : {};
        const config = getInvoiceNumberSettings({
          ...entrepriseSettings,
          ...entrepriseData,
        });
        const annee = new Date().getFullYear();
        let numero =
          config.invoiceResetYearly && config.invoiceLastYear !== annee
            ? 1
            : config.invoiceNextNumber;
        const plusGrandNumeroExistant = factures.reduce((max, facture) => {
          const match = facture.reference?.match(/(\d+)(?!.*\d)/);
          if (!match) return max;

          const numeroExistant = Number(match[1]);
          return Number.isFinite(numeroExistant)
            ? Math.max(max, numeroExistant)
            : max;
        }, 0);

        numero = Math.max(numero, plusGrandNumeroExistant + 1);

        do {
          reference = genererReferenceFactureDepuisConfig(
            {
              ...config,
              invoiceNextNumber: numero,
              invoiceLastYear: annee,
            },
            new Date()
          );
          numero += 1;
        } while (factures.some((facture) => facture.reference === reference));

        const nouvelleFacture: Facture = {
          id: nouvelId,
          reference,
          objet: formulaire.objet.trim(),
          clientId: clientFinal.id,
          clientNom: clientFinal.nom,
          clientAdresse: clientFinal.adresse ?? "",
          clientCodePostal: clientFinal.codePostal ?? "",
          clientVille: clientFinal.ville ?? "",
          clientEmail: clientFinal.email ?? "",
          clientTelephone: clientFinal.telephone ?? "",
          chantierId:
            chantierFinal?.id ?? devisAssocie?.chantierId ?? "",
          chantierTitre:
            chantierFinal?.titre ?? devisAssocie?.chantierTitre ?? "",
          devisId: devisAssocie?.id ?? "",
          devisReference: devisAssocie?.id ?? "",
          dateEmission: formulaire.dateEmission,
          dateEcheance: formulaire.dateEcheance,
          datePaiement: formulaire.datePaiement,
          statut: "Brouillon",
          montantHt,
          tvaTaux,
          lignes,
          detailTva: totaux.detailTva,
          totalTva: totaux.totalTva,
          totalTtc: totaux.totalTtc,
          typeFacture: devisAssocie ? "depuis_devis" : "libre",
          acompteDeduit,
          notes: formulaire.notes.trim(),
          entrepriseId,
          createdByUid,
          archive: false,
          createdAt: maintenant,
          updatedAt: maintenant,
        };

        if (clientCree) {
          transaction.set(doc(db, "clients", clientCree.id), clientCree);
        }

        if (chantierCree) {
          transaction.set(doc(db, "chantiers", chantierCree.id), chantierCree);
        }

        if (devisRef) {
          transaction.update(devisRef, {
            factureId: nouvelId,
          });
        }

        transaction.set(factureRef, nouvelleFacture);
        transaction.set(
          entrepriseRef,
          {
            entrepriseId,
            invoiceNumberPrefix: config.invoiceNumberPrefix,
            invoiceNumberPadding: config.invoiceNumberPadding,
            invoiceNumberFormat: config.invoiceNumberFormat,
            invoiceResetYearly: config.invoiceResetYearly,
            invoiceNextNumber: numero,
            invoiceLastYear: annee,
            updatedAt: maintenant,
            updatedByUid: createdByUid,
          },
          { merge: true }
        );
      });

      setFactureSelectionneeId(nouvelId);
      setAfficherFormulaire(false);
      onFeedback?.("Facture créée.");
      resetFormulaire();
    } catch (error) {
      console.error("Erreur enregistrement facture :", error);
      alert("Impossible d’enregistrer la facture.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const archiverFacture = async () => {
    if (!factureSelectionnee) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(doc(db, "factures", factureSelectionnee.id), {
        ...factureSelectionnee,
        archive: true,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Erreur archivage facture :", error);
      alert("Impossible d’archiver la facture.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const restaurerFacture = async () => {
    if (!factureSelectionnee) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(doc(db, "factures", factureSelectionnee.id), {
        ...factureSelectionnee,
        archive: false,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Erreur restauration facture :", error);
      alert("Impossible de restaurer la facture.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const supprimerFacture = async () => {
    if (!factureSelectionnee) return;

    try {
      setSauvegardeEnCours(true);
      await deleteDoc(doc(db, "factures", factureSelectionnee.id));
      setFactureSelectionneeId(null);
      setModeEdition(false);
      setAfficherFormulaire(false);
      setConfirmation(null);
      resetFormulaire();
    } catch (error) {
      console.error("Erreur suppression facture :", error);
      alert("Impossible de supprimer la facture.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const handleExporterPdf = () => {
    if (!factureSelectionnee) return;
    void exporterFacturePdf(factureSelectionnee);
  };

  const handleEnvoyerParMail = async () => {
    if (!factureSelectionnee) return;

    const emailClient = factureSelectionnee.clientEmail?.trim();

    if (!emailClient) {
      alert("Ce client n’a pas d’adresse email renseignée.");
      return;
    }

    try {
      setEnvoiEnCours(true);

      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error("Authentification requise.");
      }

      const response = await fetch("/api/factures/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          factureId: factureSelectionnee.id,
          toEmail: emailClient,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Impossible d’envoyer la facture.");
      }

      alert(`Facture envoyée à ${emailClient}.`);
    } catch (error) {
      console.error("Erreur envoi facture :", error);
      alert(
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer la facture."
      );
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const lignesFormulaireCalculees = useMemo(
    () => convertirLignesFactureFormEnLignes(formulaire.lignes),
    [formulaire.lignes]
  );
  const acompteFormulaire = useMemo(
    () => arrondirMontant(convertirNombre(formulaire.acompteDeduit)),
    [formulaire.acompteDeduit]
  );
  const totauxFormulaire = useMemo(
    () => calculerTotauxFacture(lignesFormulaireCalculees, acompteFormulaire),
    [lignesFormulaireCalculees, acompteFormulaire]
  );

  const ajouterLigneFacture = () => {
    setFormulaire((prev) => ({
      ...prev,
      lignes: [
        ...prev.lignes,
        creerLigneFactureFormVide(
          TAUX_TVA_FACTURE.includes(convertirNombre(prev.tvaTaux))
            ? convertirNombre(prev.tvaTaux)
            : 21
        ),
      ],
    }));
  };

  const ajouterPrestationFacture = (prestationId: string) => {
    const prestation =
      prestationsActives.find((item) => item.id === prestationId) ?? null;

    if (!prestation) return;

    const prestationAvecChampsOptionnels = prestation as typeof prestation & {
      quantite?: number;
      tvaTaux?: number;
    };
    const tvaTaux =
      typeof prestationAvecChampsOptionnels.tvaTaux === "number" &&
      Number.isFinite(prestationAvecChampsOptionnels.tvaTaux)
        ? prestationAvecChampsOptionnels.tvaTaux
        : TAUX_TVA_FACTURE.includes(convertirNombre(formulaire.tvaTaux))
        ? convertirNombre(formulaire.tvaTaux)
        : 21;
    const description = prestation.description?.trim()
      ? `${prestation.designation} - ${prestation.description.trim()}`
      : prestation.designation;

    setFormulaire((prev) => ({
      ...prev,
      lignes: [
        ...prev.lignes,
        {
          id: genererIdLigneFacture(),
          description,
          quantite: String(prestationAvecChampsOptionnels.quantite ?? 1),
          unite: prestation.unite || "forfait",
          prixUnitaireHt: String(prestation.prixUnitaire ?? 0),
          tvaTaux: String(
            TAUX_TVA_FACTURE.includes(tvaTaux)
              ? tvaTaux
              : TAUX_TVA_FACTURE.includes(convertirNombre(formulaire.tvaTaux))
              ? convertirNombre(formulaire.tvaTaux)
              : 21
          ),
        },
      ],
    }));
  };

  const modifierLigneFacture = (
    ligneId: string,
    champ: keyof LigneFactureFormState,
    valeur: string
  ) => {
    setFormulaire((prev) => ({
      ...prev,
      lignes: prev.lignes.map((ligne) =>
        ligne.id === ligneId ? { ...ligne, [champ]: valeur } : ligne
      ),
    }));
  };

  const supprimerLigneFacture = (ligneId: string) => {
    setFormulaire((prev) => ({
      ...prev,
      lignes:
        prev.lignes.length > 1
          ? prev.lignes.filter((ligne) => ligne.id !== ligneId)
          : prev.lignes,
    }));
  };

  const afficherFormulaireFacture = afficherFormulaire || modeEdition;

  const totalTvaSelectionnee = factureSelectionnee
    ? calculerTotauxDepuisFacture(factureSelectionnee).totalTva
    : 0;
  const totalTtcSelectionnee = factureSelectionnee
    ? calculerTotauxDepuisFacture(factureSelectionnee).totalTtc
    : 0;
  const netAPayerSelectionnee = factureSelectionnee
    ? calculerNetAPayer(factureSelectionnee)
    : 0;
  const detailTvaSelectionnee = factureSelectionnee
    ? calculerTotauxDepuisFacture(factureSelectionnee).detailTva
    : [];
  const lignesSelectionnee = factureSelectionnee
    ? normaliserLignesFacture(factureSelectionnee)
    : [];
  const ibanEntreprise = entrepriseSettings.iban.trim();
  const mentionsLegalesFacture =
    entrepriseSettings.mentionsLegalesFacture.trim();
  const libelleEnvoiFacture =
    factureSelectionnee && factureADejaEteEnvoyee(factureSelectionnee)
      ? "Renvoyer"
      : "Envoyer";
  const messageVideFactures =
    factures.length === 0
      ? "Aucune facture pour le moment."
      : "Aucune facture ne correspond à cette recherche.";

  const toggleSectionFacture = (section: FactureFormSectionKey) => {
    setSectionsFactureOuvertes((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const contenuFormulaire = (
    <div data-testid="facture-form" className="max-w-full overflow-hidden pb-28 md:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">
            {modeEdition ? "Édition facture" : "Nouvelle facture"}
          </p>
          <h3 className="mt-1 text-xl font-bold sm:text-2xl">
            {modeEdition && factureSelectionnee
              ? factureSelectionnee.reference
              : "Créer une facture"}
          </h3>
        </div>

        <button
          onClick={demanderFermetureFormulaire}
          className="bf-button-secondary w-full sm:w-auto"
        >
          Fermer
        </button>
      </div>

      <div className="mt-6 grid min-w-0 max-w-full gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] xl:items-start">
        <div className="order-1 min-w-0 md:col-span-2 xl:col-span-1 xl:col-start-1">
          <button
            type="button"
            onClick={() => toggleSectionFacture("informations")}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900"
            aria-expanded={sectionsFactureOuvertes.informations}
          >
            <span>Informations</span>
            <span className="text-lg text-slate-500">
              {sectionsFactureOuvertes.informations ? "-" : "+"}
            </span>
          </button>
        </div>

        <div className={`order-2 min-w-0 overflow-hidden md:col-span-2 xl:col-span-1 xl:col-start-1 ${sectionsFactureOuvertes.informations ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Devis lié
          </label>
          <select
            data-testid="facture-devis-select"
            value={formulaire.devisId}
            onChange={(e) => handleSelectionDevis(e.target.value)}
            className={champFormulaireClasses}
          >
            <option value="">Aucun devis lié</option>
            {devisDisponibles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} — {item.client}
                {item.chantierTitre ? ` — ${item.chantierTitre}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="order-9 min-w-0 xl:col-start-1">
          <button
            type="button"
            onClick={() => toggleSectionFacture("client")}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900"
            aria-expanded={sectionsFactureOuvertes.client}
          >
            <span>Client</span>
            <span className="text-lg text-slate-500">
              {sectionsFactureOuvertes.client ? "-" : "+"}
            </span>
          </button>
        </div>

        <div className={`order-10 min-w-0 overflow-hidden xl:col-start-1 ${sectionsFactureOuvertes.client ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Client
          </label>
          <select
            data-testid="facture-client-select"
            value={formulaire.clientId}
            onChange={(e) => handleSelectionClient(e.target.value)}
            className={champFormulaireClasses}
          >
            <option value="">Créer un nouveau client depuis cette facture</option>
            {clientsActifs.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom}
                {client.societe ? ` — ${client.societe}` : ""}
              </option>
            ))}
          </select>
        </div>

        {!formulaire.clientId && (
          <div className={`order-11 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-1 xl:col-start-1 ${sectionsFactureOuvertes.client ? "" : "hidden"}`}>
            <p className="text-sm font-semibold text-slate-800">
              Nouveau client
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Si le client n’existe pas encore, il sera créé automatiquement à
              l’enregistrement.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Nom / raison sociale
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauClientNom}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauClientNom: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Type de client
                </label>
                <select
                  value={formulaire.nouveauClientType}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauClientType: e.target.value as TypeClient,
                      nouveauClientTva:
                        e.target.value === "Professionnel"
                          ? prev.nouveauClientTva
                          : "",
                    }))
                  }
                  className={champFormulaireClasses}
                >
                  <option value="Particulier">Particulier</option>
                  <option value="Professionnel">Professionnel</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Société
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauClientSociete}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauClientSociete: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              {formulaire.nouveauClientType === "Professionnel" && (
                <div className="min-w-0">
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    TVA client
                  </label>
                  <input
                    type="text"
                    value={formulaire.nouveauClientTva}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        nouveauClientTva: e.target.value,
                      }))
                    }
                    className={champFormulaireClasses}
                  />
                </div>
              )}

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  value={formulaire.nouveauClientEmail}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauClientEmail: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauClientTelephone}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauClientTelephone: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <details className="min-w-0 md:col-span-2">
                <summary className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  Coordonnees completes
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="min-w-0 md:col-span-2">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauClientAdresse}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauClientAdresse: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Code postal
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauClientCodePostal}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauClientCodePostal: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Ville / commune
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauClientVille}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauClientVille: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Pays
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauClientPays}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauClientPays: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>
                </div>
              </details>
            </div>
          </div>
        )}

        <div className="order-12 min-w-0 xl:col-start-1">
          <button
            type="button"
            onClick={() => toggleSectionFacture("chantier")}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900"
            aria-expanded={sectionsFactureOuvertes.chantier}
          >
            <span>Chantier</span>
            <span className="text-lg text-slate-500">
              {sectionsFactureOuvertes.chantier ? "-" : "+"}
            </span>
          </button>
        </div>

        <div className={`order-13 min-w-0 overflow-hidden xl:col-start-1 ${sectionsFactureOuvertes.chantier ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Chantier lié
          </label>
          <select
            data-testid="facture-chantier-select"
            value={formulaire.chantierId}
            onChange={(e) => handleSelectionChantier(e.target.value)}
            className={champFormulaireClasses}
          >
            <option value="">Créer un nouveau chantier depuis cette facture</option>
            {chantiersDisponibles.map((chantier) => (
              <option key={chantier.id} value={chantier.id}>
                {chantier.titre}
                {chantier.clientNom ? ` — ${chantier.clientNom}` : ""}
              </option>
            ))}
          </select>
        </div>

        {!formulaire.chantierId && (
          <div className={`order-14 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-1 xl:col-start-1 ${sectionsFactureOuvertes.chantier ? "" : "hidden"}`}>
            <p className="text-sm font-semibold text-slate-800">
              Nouveau chantier
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Optionnel. Le chantier sera lié au client de la facture.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Nom chantier
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauChantierTitre}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauChantierTitre: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauChantierAdresse}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauChantierAdresse: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <details className="min-w-0 md:col-span-2">
                <summary className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  Details chantier
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Code postal
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauChantierCodePostal}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauChantierCodePostal: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Ville / commune
                </label>
                <input
                  type="text"
                  value={formulaire.nouveauChantierVille}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauChantierVille: e.target.value,
                    }))
                  }
                  className={champFormulaireClasses}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Statut du chantier
                </label>
                <select
                  value={formulaire.nouveauChantierStatut}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauChantierStatut: e.target.value as StatutChantier,
                    }))
                  }
                  className={champFormulaireClasses}
                >
                  {STATUTS_CHANTIER.map((statut) => (
                    <option key={statut} value={statut}>
                      {statut}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Date début chantier
                </label>
                <input
                  type="date"
                  value={formulaire.nouveauChantierDateDebut}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauChantierDateDebut: e.target.value,
                    }))
                  }
                  className={champDateClasses}
                  style={styleDateMobile}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Date fin chantier
                </label>
                <input
                  type="date"
                  value={formulaire.nouveauChantierDateFin}
                  onChange={(e) =>
                    setFormulaire((prev) => ({
                      ...prev,
                      nouveauChantierDateFin: e.target.value,
                    }))
                  }
                  className={champDateClasses}
                  style={styleDateMobile}
                />
              </div>
                </div>
              </details>
            </div>
          </div>
        )}

        <div className={`order-2 min-w-0 overflow-hidden md:col-span-2 xl:col-span-1 xl:col-start-1 ${sectionsFactureOuvertes.informations ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Objet
          </label>
          <input
            data-testid="facture-objet"
            type="text"
            value={formulaire.objet}
            onChange={(e) =>
              setFormulaire((prev) => ({
                ...prev,
                objet: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className={`order-3 min-w-0 overflow-hidden xl:col-start-1 ${sectionsFactureOuvertes.informations ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date émission
          </label>
          <input
            data-testid="facture-date-emission"
            type="date"
            value={formulaire.dateEmission}
            onChange={(e) =>
              setFormulaire((prev) => ({
                ...prev,
                dateEmission: e.target.value,
              }))
            }
            className={champDateClasses}
            style={styleDateMobile}
          />
        </div>

        <div className={`order-4 min-w-0 overflow-hidden xl:col-start-1 ${sectionsFactureOuvertes.informations ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date échéance
          </label>
          <input
            data-testid="facture-date-echeance"
            type="date"
            value={formulaire.dateEcheance}
            onChange={(e) =>
              setFormulaire((prev) => ({
                ...prev,
                dateEcheance: e.target.value,
              }))
            }
            className={champDateClasses}
            style={styleDateMobile}
          />
        </div>

        <div className={`order-5 min-w-0 overflow-hidden xl:col-start-1 ${sectionsFactureOuvertes.informations ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date paiement
          </label>
          <input
            type="date"
            value={formulaire.datePaiement}
            onChange={(e) =>
              setFormulaire((prev) => ({
                ...prev,
                datePaiement: e.target.value,
              }))
            }
            className={champDateClasses}
            style={styleDateMobile}
          />
        </div>

        <div className={`order-6 min-w-0 overflow-hidden xl:col-start-1 ${sectionsFactureOuvertes.informations ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Statut
          </label>
          <select
            value={formulaire.statut}
            onChange={(e) =>
              setFormulaire((prev) => ({
                ...prev,
                statut: e.target.value as StatutFacture,
              }))
            }
            className={champFormulaireClasses}
          >
            {STATUTS_FACTURE.map((statut) => (
              <option key={statut} value={statut}>
                {statut}
              </option>
            ))}
          </select>
        </div>

        <div className={`order-7 min-w-0 overflow-hidden xl:col-start-1 ${sectionsFactureOuvertes.totaux ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Montant HT calculé
          </label>
          <input
            data-testid="facture-montant-ht"
            type="number"
            step="0.01"
            value={totauxFormulaire.montantHt}
            readOnly
            className={champFormulaireClasses}
          />
        </div>

        <div className={`order-8 min-w-0 overflow-hidden xl:col-start-1 ${sectionsFactureOuvertes.informations ? "" : "hidden"}`}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            TVA par défaut (%)
          </label>
          <select
            data-testid="facture-tva-taux"
            value={formulaire.tvaTaux}
            onChange={(e) =>
              setFormulaire((prev) => ({
                ...prev,
                tvaTaux: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          >
            {obtenirOptionsTvaAvecValeur(formulaire.tvaTaux).map((taux) => (
              <option key={taux} value={taux}>
                {taux}%
              </option>
            ))}
          </select>
        </div>

        <div className="order-15 min-w-0 md:col-span-2 xl:hidden">
          <button
            type="button"
            onClick={() => toggleSectionFacture("lignes")}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900"
            aria-expanded={sectionsFactureOuvertes.lignes}
          >
            <span>Lignes</span>
            <span className="text-lg text-slate-500">
              {sectionsFactureOuvertes.lignes ? "-" : "+"}
            </span>
          </button>
        </div>

        <div className={`order-16 min-w-0 overflow-hidden md:col-span-2 xl:order-1 xl:col-start-2 xl:row-span-[16] xl:row-start-1 ${sectionsFactureOuvertes.lignes ? "" : "hidden xl:block"}`}>
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 xl:sticky xl:top-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Lignes de facture
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Chaque ligne peut avoir son propre taux de TVA.
                </p>
              </div>

              <div className="grid gap-2 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={() => toggleSectionFacture("bibliotheque")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
                >
                  Ajouter depuis la bibliothèque
                </button>

                <button
                  type="button"
                  onClick={ajouterLigneFacture}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
                >
                  Ajouter une ligne
                </button>
              </div>
            </div>

            <FactureFormSection
              title="Bibliotheque"
              subtitle="Prestations enregistrees"
              open={sectionsFactureOuvertes.bibliotheque}
              onToggle={() => toggleSectionFacture("bibliotheque")}
            >
              <div>
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Bibliothèque de prestations
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Ajoute rapidement une prestation enregistrée, puis ajuste
                      la quantité ou la TVA si besoin.
                    </p>
                  </div>

                  <div className="min-w-0 md:w-80">
                    <label className="mb-2 block text-xs font-medium text-slate-500">
                      Rechercher une prestation
                    </label>
                    <input
                      type="search"
                      value={recherchePrestation}
                      onChange={(e) => setRecherchePrestation(e.target.value)}
                      placeholder="Ex. pose, déplacement, forfait..."
                      className={champFormulaireClasses}
                    />
                  </div>
                </div>

                {chargementPrestations ? (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Chargement des prestations...
                  </div>
                ) : prestationsActives.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Aucune prestation enregistrée dans la bibliothèque.
                  </div>
                ) : prestationsFiltrees.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Aucune prestation ne correspond à cette recherche.
                  </div>
                ) : (
                  <div className="mt-3 grid max-h-72 gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                    {prestationsFiltrees.map((prestation) => (
                      <button
                        key={prestation.id}
                        type="button"
                        onClick={() => ajouterPrestationFacture(prestation.id)}
                        className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        <span className="block break-words text-sm font-semibold text-slate-900">
                          {prestation.designation}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-white px-2.5 py-1 font-medium">
                            {formatMontant(prestation.prixUnitaire)} HT
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 font-medium">
                            {prestation.unite}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 font-medium">
                            TVA {TAUX_TVA_FACTURE.includes(
                              Number(prestation.tvaTaux)
                            )
                              ? prestation.tvaTaux
                              : TAUX_TVA_FACTURE.includes(
                                  convertirNombre(formulaire.tvaTaux)
                                )
                              ? convertirNombre(formulaire.tvaTaux)
                              : 21}%
                          </span>
                        </span>
                        {prestation.description && (
                          <span className="mt-2 block line-clamp-2 text-xs leading-5 text-slate-500">
                            {prestation.description}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FactureFormSection>

            <div className="space-y-3">
              {formulaire.lignes.map((ligne, index) => {
                const ligneCalculee =
                  lignesFormulaireCalculees.find(
                    (item) => item.id === ligne.id
                  ) ?? null;

                return (
                  <div
                    key={ligne.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Ligne {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => supprimerLigneFacture(ligne.id)}
                        disabled={formulaire.lignes.length === 1}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-6">
                      <div className="min-w-0 md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Description
                        </label>
                        <input
                          type="text"
                          value={ligne.description}
                          onChange={(e) =>
                            modifierLigneFacture(
                              ligne.id,
                              "description",
                              e.target.value
                            )
                          }
                          className={champFormulaireClasses}
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Quantité
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ligne.quantite}
                          onChange={(e) =>
                            modifierLigneFacture(
                              ligne.id,
                              "quantite",
                              e.target.value
                            )
                          }
                          className={champFormulaireClasses}
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Unité
                        </label>
                        <input
                          type="text"
                          value={ligne.unite}
                          onChange={(e) =>
                            modifierLigneFacture(
                              ligne.id,
                              "unite",
                              e.target.value
                            )
                          }
                          className={champFormulaireClasses}
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          PU HT
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ligne.prixUnitaireHt}
                          onChange={(e) =>
                            modifierLigneFacture(
                              ligne.id,
                              "prixUnitaireHt",
                              e.target.value
                            )
                          }
                          className={champFormulaireClasses}
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          TVA
                        </label>
                        <select
                          value={ligne.tvaTaux}
                          onChange={(e) =>
                            modifierLigneFacture(
                              ligne.id,
                              "tvaTaux",
                              e.target.value
                            )
                          }
                          className={champFormulaireClasses}
                        >
                          {obtenirOptionsTvaAvecValeur(ligne.tvaTaux).map((taux) => (
                            <option key={taux} value={taux}>
                              {taux}%
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                      <p>HT : {formatMontant(ligneCalculee?.totalHt ?? 0)}</p>
                      <p>
                        TVA : {formatMontant(ligneCalculee?.montantTva ?? 0)}
                      </p>
                      <p>
                        TTC : {formatMontant(ligneCalculee?.totalTtc ?? 0)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={ajouterLigneFacture}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              Ajouter une ligne
            </button>

            <div className="grid gap-3 rounded-2xl bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Total HT</p>
                <p className="font-semibold">
                  {formatMontant(totauxFormulaire.montantHt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total TVA</p>
                <p className="font-semibold">
                  {formatMontant(totauxFormulaire.totalTva)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total TTC</p>
                <p className="font-semibold">
                  {formatMontant(totauxFormulaire.totalTtc)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Net à payer</p>
                <p className="font-semibold">
                  {formatMontant(totauxFormulaire.netAPayer)}
                </p>
              </div>
            </div>

            {totauxFormulaire.detailTva.length > 0 && (
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Récapitulatif TVA
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {totauxFormulaire.detailTva.map((ligne) => (
                    <p key={ligne.taux} className="text-sm text-slate-700">
                      TVA {ligne.taux}% : {formatMontant(ligne.montantTva)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="order-14 min-w-0 overflow-hidden md:col-span-2 lg:max-w-xs xl:col-span-1 xl:col-start-1">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Acompte déduit
          </label>
          <input
            data-testid="facture-acompte-deduit"
            type="number"
            step="0.01"
            value={formulaire.acompteDeduit}
            onChange={(e) =>
              setFormulaire((prev) => ({
                ...prev,
                acompteDeduit: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>
      </div>

      <div className="mt-4 min-w-0 overflow-hidden">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Notes
        </label>
        <textarea
          value={formulaire.notes}
          onChange={(e) =>
            setFormulaire((prev) => ({
              ...prev,
              notes: e.target.value,
            }))
          }
          rows={5}
          className={champFormulaireClasses}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_24px_rgba(15,23,42,0.12)] md:sticky md:inset-x-auto md:bottom-0 md:z-20 md:mt-6 md:flex md:flex-col md:gap-3 md:rounded-2xl md:border md:bg-white/95 md:px-4 md:py-3 md:shadow-[0_-8px_20px_rgba(15,23,42,0.10)] md:backdrop-blur xl:flex-row">
        <div className="mb-2 flex items-center justify-between gap-3 md:mb-0 md:flex-1">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-slate-500">
              Net à payer
            </p>
            <p className="break-words text-lg font-bold leading-tight text-slate-950 md:text-base">
              {formatMontant(totauxFormulaire.netAPayer)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:flex md:shrink-0">
        <Button
          data-testid="facture-save"
          onClick={enregistrerFacture}
          disabled={sauvegardeEnCours}
          loading={sauvegardeEnCours}
          loadingLabel="Enregistrement..."
          variant="accent"
          className="w-full md:w-auto"
        >
          {modeEdition
            ? "Enregistrer les modifications"
            : "Créer la facture"}
        </Button>

        <Button
          onClick={demanderFermetureFormulaire}
          disabled={sauvegardeEnCours}
          variant="secondary"
          className="w-full md:w-auto"
        >
          Annuler
        </Button>
        </div>
      </div>
    </div>
  );

  const contenuDetailFacture = factureSelectionnee ? (
    <>
      <div className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-sky-200 bg-gradient-to-br from-white via-white to-sky-50 p-5 text-slate-950 shadow-[0_18px_44px_rgba(15,23,42,0.10)] sm:p-6">
          <span
            aria-hidden="true"
            className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-orange-500/12 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-sky-500/12 blur-3xl"
          />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">
                Fiche facture
              </p>
              <h3 className="mt-2 break-all text-2xl font-bold tracking-tight sm:text-3xl">
                {factureSelectionnee.reference}
              </h3>
              <p className="mt-2 break-words text-sm text-slate-600">
                {factureSelectionnee.objet} · {factureSelectionnee.clientNom}
              </p>
            </div>

            <Badge status={factureSelectionnee.statut} dot>
              {factureSelectionnee.statut}
            </Badge>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 shadow-sm">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-orange-700">
                Net à payer
              </p>
              <p className="mt-2 break-words text-xl font-bold text-slate-950 sm:text-2xl">
                {formatMontant(netAPayerSelectionnee)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                Échéance
              </p>
              <p className="mt-2 text-sm font-bold text-slate-950 sm:text-base">
                {factureSelectionnee.dateEcheance || "Non renseignée"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Émise le {factureSelectionnee.dateEmission || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:hidden">
          <Button
            onClick={ouvrirEdition}
            variant="secondary"
            size="sm"
            fullWidth
          >
            Modifier
          </Button>

          <Button
            data-testid="facture-export-pdf"
            onClick={handleExporterPdf}
            size="sm"
            fullWidth
          >
            PDF
          </Button>

          <Button
            onClick={() => setAfficherActionsFactureMobile((prev) => !prev)}
            variant="secondary"
            size="sm"
            fullWidth
          >
            Plus
          </Button>
        </div>

        {afficherActionsFactureMobile && (
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-3 shadow-lg md:hidden">
            <Button
              onClick={handleEnvoyerParMail}
              disabled={envoiEnCours}
              loading={envoiEnCours}
              loadingLabel="Envoi..."
              variant="accent"
              fullWidth
            >
              {libelleEnvoiFacture}
            </Button>

            {!factureSelectionnee.archive ? (
              <Button
                onClick={archiverFacture}
                variant="warning"
                fullWidth
              >
                Archiver
              </Button>
            ) : (
              <Button
                onClick={restaurerFacture}
                variant="success"
                fullWidth
              >
                Restaurer
              </Button>
            )}

            <button
              onClick={() => setConfirmation("suppression")}
              className="bf-button-secondary bf-button-danger w-full"
            >
              Supprimer
            </button>
          </div>
        )}

        <div className="hidden gap-2 md:grid md:grid-cols-3">
          <Button
            onClick={ouvrirEdition}
            variant="secondary"
            fullWidth
          >
            Modifier
          </Button>

          {!factureSelectionnee.archive ? (
            <Button
              onClick={archiverFacture}
              variant="warning"
              fullWidth
            >
              Archiver
            </Button>
          ) : (
            <Button
              onClick={restaurerFacture}
              variant="success"
              fullWidth
            >
              Restaurer
            </Button>
          )}

          <button
            onClick={() => setConfirmation("suppression")}
            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition duration-200 hover:bg-red-100"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm transition duration-200 hover:shadow-md">
          <p className="text-sm text-slate-500">Client</p>
          <p className="mt-1 text-lg font-semibold">
            {factureSelectionnee.clientNom}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {factureSelectionnee.clientAdresse || "Adresse non renseignée"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {[
              factureSelectionnee.clientCodePostal,
              factureSelectionnee.clientVille,
            ]
              .filter(Boolean)
              .join(" · ") || "Coordonnées non renseignées"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {factureSelectionnee.clientEmail || "Email non renseigné"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {factureSelectionnee.clientTelephone || "Téléphone non renseigné"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {factureSelectionnee.chantierTitre || "Sans chantier lié"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Devis : {factureSelectionnee.devisReference || "Aucun devis lié"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
            <p className="text-sm text-slate-500">Émission</p>
            <p className="mt-1 font-semibold">
              {factureSelectionnee.dateEmission || "Non renseignée"}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 shadow-sm transition duration-200 hover:shadow-md">
            <p className="text-sm text-slate-500">Échéance</p>
            <p className="mt-1 font-semibold">
              {factureSelectionnee.dateEcheance || "Non renseignée"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md sm:col-span-3 xl:col-span-1">
            <p className="text-sm text-slate-500">Paiement</p>
            <p className="mt-1 font-semibold">
              {factureSelectionnee.datePaiement || "Non renseignée"}
            </p>
          </div>
        </div>

        {lignesSelectionnee.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">
              Lignes de facture
            </p>
            <div className="mt-3 space-y-3">
              {lignesSelectionnee.map((ligne) => (
                <div
                  key={ligne.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition duration-200 hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-slate-900">
                        {ligne.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ligne.quantite} {ligne.unite} x{" "}
                        {formatMontant(ligne.prixUnitaireHt)} HT - TVA{" "}
                        {ligne.tvaTaux}%
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                      {formatMontant(ligne.totalTtc)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Montant HT</p>
            <p className="mt-1 break-words font-semibold">
              {formatMontant(factureSelectionnee.montantHt)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
              TVA totale
            </p>
            <p className="mt-1 break-words font-semibold">
              {formatMontant(totalTvaSelectionnee)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total TTC</p>
            <p className="mt-1 break-words font-semibold">
              {formatMontant(totalTtcSelectionnee)}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 shadow-sm">
            <p className="text-sm text-slate-500">Net à payer</p>
            <p className="mt-1 break-words text-lg font-bold text-slate-950">
              {formatMontant(netAPayerSelectionnee)}
            </p>
          </div>
        </div>

        {detailTvaSelectionnee.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-sm text-slate-500">Détail TVA par taux</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {detailTvaSelectionnee.map((ligne) => (
                <p key={ligne.taux} className="text-sm font-semibold">
                  TVA {ligne.taux}% : {formatMontant(ligne.montantTva)}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Acompte déduit</p>
          <p className="mt-1 font-semibold">
            {formatMontant(factureSelectionnee.acompteDeduit)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
          <p className="text-sm text-slate-500">Informations facture</p>
          {ibanEntreprise ? (
            <p className="mt-2 break-words text-sm font-semibold text-slate-800">
              IBAN : {ibanEntreprise}
            </p>
          ) : (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              IBAN entreprise manquant : la facture reste consultable et
              exportable, mais un IBAN est attendu pour une facture crédible.
            </p>
          )}

          {mentionsLegalesFacture && (
            <div className="mt-4">
              <p className="text-sm text-slate-500">
                Mentions légales facture
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {mentionsLegalesFacture}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
          <p className="text-sm text-slate-500">Notes</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
            {factureSelectionnee.notes || "Aucune note pour cette facture."}
          </p>
        </div>
      </div>
    </>
  ) : null;
  const actionsFormulaireDesktop = (
    <Button
      onClick={enregistrerFacture}
      disabled={sauvegardeEnCours}
      loading={sauvegardeEnCours}
      loadingLabel="Enregistrement..."
      variant="accent"
    >
      Enregistrer
    </Button>
  );
  const actionsDetailDesktop = factureSelectionnee ? (
    <>
      <Button
        onClick={handleExporterPdf}
        variant="secondary"
      >
        PDF
      </Button>
      <Button
        onClick={handleEnvoyerParMail}
        disabled={envoiEnCours}
        loading={envoiEnCours}
        loadingLabel="Envoi..."
        variant="accent"
      >
        {libelleEnvoiFacture}
      </Button>
    </>
  ) : null;

  const confirmerAction = () => {
    if (confirmation === "suppression") {
      void supprimerFacture();
      return;
    }

    if (confirmation === "fermeture") {
      fermerFormulaire();
      setConfirmation(null);
      return;
    }

    if (confirmation === "selection" && factureASelectionnerId) {
      resetFormulaire();
      setAfficherActionsFactureMobile(false);
      setFactureSelectionneeId(factureASelectionnerId);
      setModeEdition(false);
      setAfficherFormulaire(false);
      setFactureASelectionnerId(null);
      setConfirmation(null);
    }
  };

  const confirmationSuppression = confirmation === "suppression";

  return (
    <>
      <ConfirmDialog
        open={confirmation !== null}
        title={
          confirmationSuppression
            ? "Supprimer cette facture ?"
            : "Fermer sans enregistrer ?"
        }
        description={
          confirmationSuppression
            ? `La facture « ${factureSelectionnee?.reference ?? ""} » sera supprimée définitivement. Cette action est irréversible.`
            : "Les informations saisies depuis le dernier enregistrement seront perdues."
        }
        confirmLabel={
          confirmationSuppression
            ? "Supprimer définitivement"
            : "Fermer sans enregistrer"
        }
        tone={confirmationSuppression ? "danger" : "warning"}
        loading={confirmationSuppression && sauvegardeEnCours}
        onCancel={() => {
          setConfirmation(null);
          setFactureASelectionnerId(null);
        }}
        onConfirm={confirmerAction}
      />

      <MobileFullscreenModal
        open={afficherFormulaireFacture}
        title={modeEdition ? "Modifier la facture" : "Nouvelle facture"}
        onClose={demanderFermetureFormulaire}
        premium
      >
        {contenuFormulaire}
      </MobileFullscreenModal>

      <MobileFullscreenModal
        open={!afficherFormulaireFacture && factureSelectionnee !== null}
        title={
          factureSelectionnee
            ? `Facture ${factureSelectionnee.reference}`
            : "Détail facture"
        }
        onClose={fermerDetailMobile}
        premium
      >
        {contenuDetailFacture}
      </MobileFullscreenModal>

      <DevisPreviewModal
        open={afficherFormulaireFacture}
        title={modeEdition ? "Modifier la facture" : "Nouvelle facture"}
        eyebrow={modeEdition ? "Modification facture" : "Creation facture"}
        actions={actionsFormulaireDesktop}
        onClose={demanderFermetureFormulaire}
        premium
      >
        {contenuFormulaire}
      </DevisPreviewModal>

      <DevisPreviewModal
        open={!afficherFormulaireFacture && factureSelectionnee !== null}
        title={
          factureSelectionnee
            ? `Facture ${factureSelectionnee.reference}`
            : "Detail facture"
        }
        eyebrow="Consultation facture"
        actions={actionsDetailDesktop}
        onClose={fermerDetailMobile}
        premium
      >
        {contenuDetailFacture}
      </DevisPreviewModal>

      <FactureKpiCards
        totalFactures={totalFactures}
        totalPayees={totalPayees}
        totalRetard={totalRetard}
        totalNetFacture={totalNetFacture}
      />

      <div className="grid gap-4 lg:gap-6">
        <Card
          className="min-w-0 overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:p-6"
          padding="md"
        >
          <SectionHeader
            headingLevel={3}
            eyebrow="Portefeuille factures"
            title="Suivi des paiements"
            description="Retrouve rapidement une facture, son échéance et le net à payer."
            actions={
              <Button variant="accent" onClick={ouvrirCreation} fullWidth>
                Nouvelle facture
              </Button>
            }
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]">
            <input
              aria-label="Rechercher une facture"
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une facture, client, chantier..."
              className={filtreFactureClasses}
            />

            <select
              aria-label="Filtrer par statut"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
              className={filtreFactureClasses}
            >
              <option value="Tous">Tous les statuts</option>
              {STATUTS_FACTURE.map((statut) => (
                <option key={statut} value={statut}>
                  {statut}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrer par archivage"
              value={filtreArchivage}
              onChange={(e) =>
                setFiltreArchivage(e.target.value as FiltreArchivage)
              }
              className={filtreFactureClasses}
            >
              <option value="actifs">Factures actives</option>
              <option value="archives">Factures archivées</option>
              <option value="tous">Toutes les factures</option>
            </select>
          </div>

          <div className="mt-4 space-y-2 overflow-hidden sm:mt-6 sm:space-y-3">
            {facturesFiltrees.length === 0 ? (
              <EmptyState
                icon={<span aria-hidden="true">€</span>}
                title={messageVideFactures}
                description="Ajuste les filtres ou crée une nouvelle facture depuis l’action principale."
                action={
                  <Button onClick={ouvrirCreation}>Nouvelle facture</Button>
                }
              />
            ) : (
              <>
                <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_8rem_8rem] gap-3 rounded-t-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] text-slate-500 md:grid">
                  <span>Facture</span>
                  <span>Client / chantier</span>
                  <span>Statut</span>
                  <span className="text-right">Net à payer</span>
                </div>
                {facturesFiltrees.map((facture) => (
                <button
                  key={facture.id}
                  data-testid="facture-list-item"
                  onClick={() => selectionnerFacture(facture.id)}
                  className={`group block w-full min-w-0 overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_8rem_8rem] md:items-center md:gap-3 md:rounded-none md:border-x md:border-t-0 md:px-4 md:py-3.5 md:shadow-none md:hover:translate-y-0 ${
                    factureSelectionnee?.id === facture.id
                      ? "border-sky-300 bg-gradient-to-br from-sky-50 to-white ring-2 ring-sky-100 md:bg-sky-50/70 md:shadow-[inset_3px_0_0_#0284c7] md:ring-0"
                      : "border-slate-200 bg-white hover:border-slate-300 md:hover:bg-sky-50/40"
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-2 sm:gap-3 md:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 sm:text-sm">
                          {facture.reference}
                        </p>
                        <h3 className="mt-0.5 truncate text-sm font-semibold text-slate-900 sm:mt-1 sm:text-base">
                          {facture.objet}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-slate-500 sm:mt-1 sm:text-sm">
                          {facture.clientNom}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1 sm:gap-2">
                        <Badge status={facture.statut} dot>
                          {facture.statut}
                        </Badge>

                        {facture.archive && (
                          <Badge tone="warning">
                            Archivée
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50/70 p-2 sm:gap-2 sm:p-3">
                      <p className="truncate text-xs text-slate-600 sm:text-sm">
                        {facture.chantierTitre || "Sans chantier associé"}
                      </p>
                      <p className="truncate text-xs text-slate-600 sm:text-sm">
                        Devis : {facture.devisReference || "Aucun devis lié"}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-500 sm:text-sm">
                          {facture.dateEmission || "Sans date"}
                        </p>
                        <p className="shrink-0 text-sm font-semibold text-slate-900">
                          {formatMontant(calculerNetAPayer(facture))}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden min-w-0 md:block">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {facture.reference}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {facture.objet}
                    </p>
                  </div>

                  <div className="hidden min-w-0 md:block">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {facture.clientNom}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {facture.chantierTitre || "Sans chantier associé"}
                    </p>
                  </div>

                  <Badge
                    status={facture.statut}
                    dot
                    className="hidden justify-self-start md:inline-flex"
                  >
                    {facture.statut}
                  </Badge>

                  <p className="hidden truncate text-right text-sm font-semibold text-slate-950 md:block">
                    {formatMontant(calculerNetAPayer(facture))}
                  </p>
                </button>
                ))}
              </>
            )}
          </div>
        </Card>

        <div className="hidden">
          {chargement ? (
            <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
              Chargement des factures...
            </div>
          ) : afficherFormulaireFacture ? (
            contenuFormulaire
          ) : factureSelectionnee ? (
            contenuDetailFacture
          ) : (
            <div className="flex min-h-80 items-center justify-center text-center text-sm text-slate-500">
              Sélectionne une facture pour afficher le détail.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
