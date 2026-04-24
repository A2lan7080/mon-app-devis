"use client";

import { useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import MobileFullscreenModal from "./MobileFullscreenModal";
import { useEntrepriseChantiers } from "../hooks/useEntrepriseChantiers";
import { useEntrepriseClients } from "../hooks/useEntrepriseClients";
import { useEntrepriseFactures } from "../hooks/useEntrepriseFactures";
import { useEntrepriseSettings } from "../hooks/useEntrepriseSettings";
import { useEntrepriseDevis } from "../hooks/useEntrepriseDevis";
import { exporterFacturePdf } from "../lib/export-facture-pdf";
import { db } from "../lib/firebase";
import {
  calculerTotalHt,
  calculerTotalTvac,
  formatMontant,
} from "../lib/devis-helpers";
import type { Facture, StatutFacture } from "../types/factures";

type FiltreArchivage = "actifs" | "archives" | "tous";
type FiltreStatut = "Tous" | StatutFacture;

type Props = {
  entrepriseId?: string;
  createdByUid?: string;
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
};

const STATUTS_FACTURE: StatutFacture[] = [
  "Brouillon",
  "Envoyée",
  "Payée",
  "En retard",
  "Annulée",
];

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
});

const champFormulaireClasses =
  "block w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

const champDateClasses =
  "block w-full min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-slate-400";

const styleDateMobile = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  WebkitAppearance: "none",
  appearance: "none",
} as const;

function genererReferenceFacture(factures: Facture[]) {
  const plusGrandNumero = factures.reduce((max, facture) => {
    const match = facture.reference?.match(/FA-(\d+)/);
    if (!match) return max;
    const numero = Number(match[1]);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);

  return `FA-${String(plusGrandNumero + 1).padStart(4, "0")}`;
}

function convertirNombre(valeur: string) {
  const normalisee = valeur.replace(",", ".");
  const nombre = Number(normalisee);

  if (!Number.isFinite(nombre)) {
    return 0;
  }

  return nombre;
}

function arrondirMontant(valeur: number) {
  return Math.round((valeur + Number.EPSILON) * 100) / 100;
}

function calculerMontantTva(facture: {
  montantHt: number;
  tvaTaux: number;
}) {
  return facture.montantHt * (facture.tvaTaux / 100);
}

function calculerTotalTtc(facture: {
  montantHt: number;
  tvaTaux: number;
}) {
  return facture.montantHt + calculerMontantTva(facture);
}

function calculerNetAPayer(facture: {
  montantHt: number;
  tvaTaux: number;
  acompteDeduit: number;
}) {
  return calculerTotalTtc(facture) - facture.acompteDeduit;
}

function getStatutClasses(statut: StatutFacture) {
  switch (statut) {
    case "Brouillon":
      return "bg-slate-100 text-slate-700";
    case "Envoyée":
      return "bg-blue-100 text-blue-700";
    case "Payée":
      return "bg-emerald-100 text-emerald-700";
    case "En retard":
      return "bg-red-100 text-red-700";
    case "Annulée":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function FacturesWorkspace({
  entrepriseId,
  createdByUid,
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
  const [afficherActionsFactureMobile, setAfficherActionsFactureMobile] =
    useState(false);
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
        devisId: devisAssocie.id,
        objet: `Facture - ${devisAssocie.id}`,
        montantHt: String(arrondirMontant(calculerTotalHt(devisAssocie))),
        tvaTaux: String(devisAssocie.tvaTaux),
        acompteDeduit: String(acompte),
        notes: devisAssocie.conditions ?? prev.notes,
      }));

      return;
    }

    setFormulaire((prev) => ({
      ...prev,
      chantierId: chantier.id,
      clientId: chantier.clientId ?? prev.clientId,
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
  };

  const ouvrirCreation = () => {
    resetFormulaire();
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

  const fermerDetailMobile = () => {
    setAfficherActionsFactureMobile(false);
    setModeEdition(false);
    setFactureSelectionneeId(null);
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
    });

    setModeEdition(true);
    setAfficherFormulaire(false);
  };

  const enregistrerFacture = async () => {
    if (!entrepriseId || !createdByUid) {
      alert("Impossible d’identifier l’entreprise ou l’utilisateur.");
      return;
    }

    if (!formulaire.objet.trim()) {
      alert("L’objet de la facture est obligatoire.");
      return;
    }

    if (!formulaire.clientId) {
      alert("Sélectionne un client.");
      return;
    }

    if (!formulaire.dateEmission) {
      alert("La date d’émission est obligatoire.");
      return;
    }

    const clientAssocie =
      clientsActifs.find((client) => client.id === formulaire.clientId) ??
      null;

    if (!clientAssocie) {
      alert("Le client sélectionné est introuvable.");
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

    const montantHt = arrondirMontant(convertirNombre(formulaire.montantHt));
    const tvaTaux = arrondirMontant(convertirNombre(formulaire.tvaTaux));
    const acompteDeduit = arrondirMontant(
      convertirNombre(formulaire.acompteDeduit)
    );

    if (montantHt < 0 || tvaTaux < 0 || acompteDeduit < 0) {
      alert("Les montants doivent être valides.");
      return;
    }

    const maintenant = Date.now();

    try {
      setSauvegardeEnCours(true);

      if (modeEdition && factureSelectionnee) {
        await updateDoc(doc(db, "factures", factureSelectionnee.id), {
          ...factureSelectionnee,
          objet: formulaire.objet.trim(),
          clientId: clientAssocie.id,
          clientNom: clientAssocie.nom,
          clientAdresse: clientAssocie.adresse ?? "",
          clientCodePostal: clientAssocie.codePostal ?? "",
          clientVille: clientAssocie.ville ?? "",
          clientEmail: clientAssocie.email ?? "",
          clientTelephone: clientAssocie.telephone ?? "",
          chantierId: chantierAssocieFinal?.id ?? devisAssocie?.chantierId ?? "",
          chantierTitre:
            chantierAssocieFinal?.titre ?? devisAssocie?.chantierTitre ?? "",
          devisId: devisAssocie?.id ?? "",
          devisReference: devisAssocie?.id ?? "",
          dateEmission: formulaire.dateEmission,
          dateEcheance: formulaire.dateEcheance,
          datePaiement: formulaire.datePaiement,
          statut: formulaire.statut,
          montantHt,
          tvaTaux,
          acompteDeduit,
          notes: formulaire.notes.trim(),
          updatedAt: maintenant,
        });

        setModeEdition(false);
        setAfficherFormulaire(false);
        resetFormulaire();
        return;
      }

      const nouvelId = `${entrepriseId}-fa-${maintenant}`;
      const reference = genererReferenceFacture(factures);

      const nouvelleFacture: Facture = {
        id: nouvelId,
        reference,
        objet: formulaire.objet.trim(),
        clientId: clientAssocie.id,
        clientNom: clientAssocie.nom,
        clientAdresse: clientAssocie.adresse ?? "",
        clientCodePostal: clientAssocie.codePostal ?? "",
        clientVille: clientAssocie.ville ?? "",
        clientEmail: clientAssocie.email ?? "",
        clientTelephone: clientAssocie.telephone ?? "",
        chantierId: chantierAssocieFinal?.id ?? devisAssocie?.chantierId ?? "",
        chantierTitre:
          chantierAssocieFinal?.titre ?? devisAssocie?.chantierTitre ?? "",
        devisId: devisAssocie?.id ?? "",
        devisReference: devisAssocie?.id ?? "",
        dateEmission: formulaire.dateEmission,
        dateEcheance: formulaire.dateEcheance,
        datePaiement: formulaire.datePaiement,
        statut: formulaire.statut,
        montantHt,
        tvaTaux,
        acompteDeduit,
        notes: formulaire.notes.trim(),
        entrepriseId,
        createdByUid,
        archive: false,
        createdAt: maintenant,
        updatedAt: maintenant,
      };

      await setDoc(doc(db, "factures", nouvelId), nouvelleFacture);

      setFactureSelectionneeId(nouvelId);
      setAfficherFormulaire(false);
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

    const confirmation = window.confirm(
      `Supprimer définitivement la facture ${factureSelectionnee.reference} ?`
    );

    if (!confirmation) return;

    try {
      setSauvegardeEnCours(true);
      await deleteDoc(doc(db, "factures", factureSelectionnee.id));
      setFactureSelectionneeId(null);
      setModeEdition(false);
      setAfficherFormulaire(false);
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

      const response = await fetch("/api/factures/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facture: factureSelectionnee,
          toEmail: emailClient,
          entreprise: entrepriseSettings,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Impossible d’envoyer la facture.");
      }

      if (
        factureSelectionnee.statut !== "Payée" &&
        factureSelectionnee.statut !== "Envoyée"
      ) {
        await updateDoc(doc(db, "factures", factureSelectionnee.id), {
          ...factureSelectionnee,
          statut: "Envoyée",
          updatedAt: Date.now(),
        });
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

  const afficherFormulaireFacture = afficherFormulaire || modeEdition;

  const totalTvaSelectionnee = factureSelectionnee
    ? calculerMontantTva(factureSelectionnee)
    : 0;
  const totalTtcSelectionnee = factureSelectionnee
    ? calculerTotalTtc(factureSelectionnee)
    : 0;
  const netAPayerSelectionnee = factureSelectionnee
    ? calculerNetAPayer(factureSelectionnee)
    : 0;

  const contenuFormulaire = (
    <div className="max-w-full overflow-hidden">
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
          onClick={fermerFormulaire}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
        >
          Fermer
        </button>
      </div>

      <div className="mt-6 grid min-w-0 max-w-full gap-4 md:grid-cols-2">
        <div className="min-w-0 overflow-hidden md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Devis lié
          </label>
          <select
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

        <div className="min-w-0 overflow-hidden">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Client
          </label>
          <select
            value={formulaire.clientId}
            onChange={(e) => handleSelectionClient(e.target.value)}
            className={champFormulaireClasses}
          >
            <option value="">Sélectionner un client</option>
            {clientsActifs.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 overflow-hidden">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Chantier lié
          </label>
          <select
            value={formulaire.chantierId}
            onChange={(e) => handleSelectionChantier(e.target.value)}
            className={champFormulaireClasses}
          >
            <option value="">Aucun chantier lié</option>
            {chantiersDisponibles.map((chantier) => (
              <option key={chantier.id} value={chantier.id}>
                {chantier.titre}
                {chantier.clientNom ? ` — ${chantier.clientNom}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 overflow-hidden md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Objet
          </label>
          <input
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

        <div className="min-w-0 overflow-hidden">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date émission
          </label>
          <input
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

        <div className="min-w-0 overflow-hidden">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date échéance
          </label>
          <input
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

        <div className="min-w-0 overflow-hidden">
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

        <div className="min-w-0 overflow-hidden">
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

        <div className="min-w-0 overflow-hidden">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Montant HT
          </label>
          <input
            type="number"
            step="0.01"
            value={formulaire.montantHt}
            onChange={(e) =>
              setFormulaire((prev) => ({
                ...prev,
                montantHt: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0 overflow-hidden">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            TVA (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={formulaire.tvaTaux}
            onChange={(e) =>
              setFormulaire((prev) => ({
                ...prev,
                tvaTaux: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0 overflow-hidden md:col-span-2 lg:max-w-xs">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Acompte déduit
          </label>
          <input
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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={enregistrerFacture}
          disabled={sauvegardeEnCours}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {sauvegardeEnCours
            ? "Enregistrement..."
            : modeEdition
            ? "Enregistrer les modifications"
            : "Créer la facture"}
        </button>

        <button
          onClick={fermerFormulaire}
          disabled={sauvegardeEnCours}
          className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Annuler
        </button>
      </div>
    </div>
  );

  const contenuDetailFacture = factureSelectionnee ? (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Fiche facture</p>
            <h3 className="mt-1 text-xl font-bold sm:text-2xl">
              {factureSelectionnee.reference}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {factureSelectionnee.objet}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatutClasses(
                factureSelectionnee.statut
              )}`}
            >
              {factureSelectionnee.statut}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:hidden">
          <button
            onClick={ouvrirEdition}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Modifier
          </button>

          <button
            onClick={handleExporterPdf}
            className="rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            PDF
          </button>

          <button
            onClick={() => setAfficherActionsFactureMobile((prev) => !prev)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Plus
          </button>
        </div>

        {afficherActionsFactureMobile && (
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:hidden">
            <button
              onClick={handleEnvoyerParMail}
              disabled={envoiEnCours}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {envoiEnCours ? "Envoi..." : "Envoyer par mail"}
            </button>

            {!factureSelectionnee.archive ? (
              <button
                onClick={archiverFacture}
                className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800"
              >
                Archiver
              </button>
            ) : (
              <button
                onClick={restaurerFacture}
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800"
              >
                Restaurer
              </button>
            )}

            <button
              onClick={supprimerFacture}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700"
            >
              Supprimer
            </button>
          </div>
        )}

        <div className="hidden gap-2 md:grid sm:grid-cols-2 xl:grid-cols-3">
          <button
            onClick={ouvrirEdition}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Modifier
          </button>

          <button
            onClick={handleExporterPdf}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Export PDF
          </button>

          <button
            onClick={handleEnvoyerParMail}
            disabled={envoiEnCours}
            className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {envoiEnCours ? "Envoi..." : "Envoyer par mail"}
          </button>

          {!factureSelectionnee.archive ? (
            <button
              onClick={archiverFacture}
              className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              Archiver
            </button>
          ) : (
            <button
              onClick={restaurerFacture}
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              Restaurer
            </button>
          )}

          <button
            onClick={supprimerFacture}
            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:col-span-2 xl:col-span-1"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
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
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Émission</p>
            <p className="mt-1 font-semibold">
              {factureSelectionnee.dateEmission || "Non renseignée"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Échéance</p>
            <p className="mt-1 font-semibold">
              {factureSelectionnee.dateEcheance || "Non renseignée"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-3 xl:col-span-1">
            <p className="text-sm text-slate-500">Paiement</p>
            <p className="mt-1 font-semibold">
              {factureSelectionnee.datePaiement || "Non renseignée"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Montant HT</p>
            <p className="mt-1 break-words font-semibold">
              {formatMontant(factureSelectionnee.montantHt)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              TVA ({factureSelectionnee.tvaTaux}%)
            </p>
            <p className="mt-1 break-words font-semibold">
              {formatMontant(totalTvaSelectionnee)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total TTC</p>
            <p className="mt-1 break-words font-semibold">
              {formatMontant(totalTtcSelectionnee)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Net à payer</p>
            <p className="mt-1 break-words font-semibold">
              {formatMontant(netAPayerSelectionnee)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Acompte déduit</p>
          <p className="mt-1 font-semibold">
            {formatMontant(factureSelectionnee.acompteDeduit)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Notes</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
            {factureSelectionnee.notes || "Aucune note pour cette facture."}
          </p>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <MobileFullscreenModal
        open={afficherFormulaireFacture}
        title={modeEdition ? "Modifier la facture" : "Nouvelle facture"}
        onClose={fermerFormulaire}
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
      >
        {contenuDetailFacture}
      </MobileFullscreenModal>

      <div className="mb-4 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:mb-6 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">
            Gère les factures de ton entreprise.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {chargement
              ? "Chargement des factures..."
              : `${factures.length} facture${
                  factures.length > 1 ? "s" : ""
                } chargée${factures.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <button
          onClick={afficherFormulaireFacture ? fermerFormulaire : ouvrirCreation}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 md:w-auto"
        >
          {afficherFormulaireFacture ? "Fermer" : "Nouvelle facture"}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">Factures actives</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">
            {totalFactures}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">Payées</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">{totalPayees}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">En retard</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">{totalRetard}</p>
        </div>

        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Net facturé</p>
          <p className="mt-2 break-words text-2xl font-bold sm:text-3xl">
            {formatMontant(totalNetFacture)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6">
          <div className="grid gap-4">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une facture, client, chantier..."
              className={champFormulaireClasses}
            />

            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
              className={champFormulaireClasses}
            >
              <option value="Tous">Tous les statuts</option>
              {STATUTS_FACTURE.map((statut) => (
                <option key={statut} value={statut}>
                  {statut}
                </option>
              ))}
            </select>

            <select
              value={filtreArchivage}
              onChange={(e) =>
                setFiltreArchivage(e.target.value as FiltreArchivage)
              }
              className={champFormulaireClasses}
            >
              <option value="actifs">Factures actives</option>
              <option value="archives">Factures archivées</option>
              <option value="tous">Toutes les factures</option>
            </select>
          </div>

          <div className="mt-4 space-y-2 overflow-hidden sm:mt-6 sm:space-y-3">
            {facturesFiltrees.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Aucune facture trouvée.
              </div>
            ) : (
              facturesFiltrees.map((facture) => (
                <button
                  key={facture.id}
                  onClick={() => {
                    setAfficherActionsFactureMobile(false);
                    setFactureSelectionneeId(facture.id);
                    setModeEdition(false);
                    setAfficherFormulaire(false);
                  }}
                  className={`block w-full min-w-0 overflow-hidden rounded-xl border p-3 text-left transition sm:rounded-2xl sm:p-4 ${
                    factureSelectionnee?.id === facture.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
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
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${getStatutClasses(
                            facture.statut
                          )}`}
                        >
                          {facture.statut}
                        </span>

                        {facture.archive && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 sm:px-3 sm:text-xs">
                            Archivée
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-1 rounded-xl bg-slate-50 p-2 sm:gap-2 sm:p-3">
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
                </button>
              ))
            )}
          </div>
        </div>

        <div className="hidden min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:block md:p-6">
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