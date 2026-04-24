"use client";

import { useMemo, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useEntrepriseChantiers } from "../hooks/useEntrepriseChantiers";
import { useEntrepriseClients } from "../hooks/useEntrepriseClients";
import { useEntreprisePrestations } from "../hooks/useEntreprisePrestations";
import {
  creerLigneVide,
  STATUTS_DEVIS,
  TVA_PAR_DEFAUT,
} from "../lib/devis-constants";
import {
  convertirLignesFormStateEnLignesMetier,
  formatMontant,
  formaterDate,
  genererNumeroDevis,
} from "../lib/devis-helpers";
import { auth, db } from "../lib/firebase";
import type { Chantier, StatutChantier } from "../types/chantiers";
import type { Client, TypeClient } from "../types/clients";
import type {
  Devis,
  NouvelleLigneState,
  NouveauDevisState,
  StatutDevis,
} from "../types/devis";

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
};

type DevisFormProps = {
  devis: DevisBusiness[];
  entrepriseId?: string;
  createdByUid?: string;
  onDevisCree: (id: string) => void;
  onClose: () => void;
};

const UNITES_PREDEFINIES = ["pièce", "forfait", "m²", "ml", "heure", "jour"];

const STATUTS_CHANTIER: StatutChantier[] = [
  "À planifier",
  "Planifié",
  "En cours",
  "Terminé",
  "Suspendu",
];

const champFormulaireClasses =
  "block w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

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

function creerLigneVideAvecUnite(): NouvelleLigneState {
  return {
    ...creerLigneVide(),
    unite: "forfait",
  };
}

export default function DevisForm({
  devis,
  entrepriseId,
  createdByUid,
  onDevisCree,
  onClose,
}: DevisFormProps) {
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [clientSelectionneId, setClientSelectionneId] = useState("");
  const [chantierSelectionneId, setChantierSelectionneId] = useState("");
  const [recherchePrestation, setRecherchePrestation] = useState("");
  const [bibliothequeOuverte, setBibliothequeOuverte] = useState(false);
  const [nouveauChantierDateDebut, setNouveauChantierDateDebut] = useState("");
  const [nouveauChantierDateFin, setNouveauChantierDateFin] = useState("");
  const [nouveauChantierStatut, setNouveauChantierStatut] =
    useState<StatutChantier>("À planifier");

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

  const { prestations } = useEntreprisePrestations({
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

  const prestationsActives = useMemo(
    () => prestations.filter((prestation) => !prestation.archive),
    [prestations]
  );

  const prestationsFiltrees = useMemo(() => {
    const recherche = recherchePrestation.trim().toLowerCase();

    if (!recherche) return prestationsActives;

    return prestationsActives.filter((prestation) => {
      const designation = prestation.designation?.toLowerCase() ?? "";
      const unite = prestation.unite?.toLowerCase() ?? "";
      const prix = String(prestation.prixUnitaire ?? "").toLowerCase();

      return (
        designation.includes(recherche) ||
        unite.includes(recherche) ||
        prix.includes(recherche)
      );
    });
  }, [prestationsActives, recherchePrestation]);

  const [nouveauDevis, setNouveauDevis] = useState<
    NouveauDevisState & {
      acomptePourcentage: string;
      validiteJours: string;
      conditions: string;
    }
  >({
    client: "",
    statut: "Brouillon",
    date: "",
    adresse: "",
    codePostal: "",
    ville: "",
    email: "",
    telephone: "",
    typeClient: "Particulier",
    societe: "",
    tvaClient: "",
    chantierId: "",
    chantierTitre: "",
    tvaTaux: String(TVA_PAR_DEFAUT),
    acomptePourcentage: "30",
    validiteJours: "30",
    conditions:
      "Un acompte est demandé avant lancement. Toute modification complémentaire pourra faire l’objet d’un ajustement de prix.",
  });

  const [lignes, setLignes] = useState<NouvelleLigneState[]>([
    creerLigneVideAvecUnite(),
  ]);

  const reinitialiserFormulaire = () => {
    setClientSelectionneId("");
    setChantierSelectionneId("");
    setRecherchePrestation("");
    setBibliothequeOuverte(false);
    setNouveauChantierDateDebut("");
    setNouveauChantierDateFin("");
    setNouveauChantierStatut("À planifier");
    setNouveauDevis({
      client: "",
      statut: "Brouillon",
      date: "",
      adresse: "",
      codePostal: "",
      ville: "",
      email: "",
      telephone: "",
      typeClient: "Particulier",
      societe: "",
      tvaClient: "",
      chantierId: "",
      chantierTitre: "",
      tvaTaux: String(TVA_PAR_DEFAUT),
      acomptePourcentage: "30",
      validiteJours: "30",
      conditions:
        "Un acompte est demandé avant lancement. Toute modification complémentaire pourra faire l’objet d’un ajustement de prix.",
    });
    setLignes([creerLigneVideAvecUnite()]);
  };

  const ajouterLigne = () => {
    setLignes((prev) => [...prev, creerLigneVideAvecUnite()]);
  };

  const ajouterPrestationDansLignes = (prestationId: string) => {
    if (!prestationId) return;

    const prestation =
      prestationsActives.find((item) => item.id === prestationId) ?? null;

    if (!prestation) return;

    setLignes((prev) => [
      ...prev,
      {
        designation: prestation.designation,
        quantite: "1",
        unite: prestation.unite,
        prixUnitaire: String(prestation.prixUnitaire),
      },
    ]);
  };

  const supprimerLigne = (index: number) => {
    setLignes((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const mettreAJourLigne = (
    index: number,
    champ: keyof NouvelleLigneState,
    valeur: string
  ) => {
    setLignes((prev) =>
      prev.map((ligne, i) =>
        i === index ? { ...ligne, [champ]: valeur } : ligne
      )
    );
  };

  const handleSelectionClient = (clientId: string) => {
    setClientSelectionneId(clientId);

    if (!clientId) return;

    const client = clientsActifs.find((item) => item.id === clientId);
    if (!client) return;

    setNouveauDevis((prev) => ({
      ...prev,
      client: client.nom ?? "",
      adresse: client.adresse ?? "",
      codePostal: client.codePostal ?? "",
      ville: client.ville ?? "",
      email: client.email ?? "",
      telephone: client.telephone ?? "",
      typeClient: client.typeClient ?? "Particulier",
      societe: client.societe ?? "",
      tvaClient: client.tva ?? "",
    }));
  };

  const handleSelectionChantier = (chantierId: string) => {
    setChantierSelectionneId(chantierId);

    if (!chantierId) {
      setNouveauDevis((prev) => ({
        ...prev,
        chantierId: "",
      }));
      return;
    }

    const chantier = chantiersActifs.find((item) => item.id === chantierId);
    if (!chantier) return;

    const clientAssocie =
      clientsActifs.find((client) => client.id === chantier.clientId) ?? null;

    setNouveauDevis((prev) => ({
      ...prev,
      chantierId: chantier.id,
      chantierTitre: chantier.titre ?? "",
      adresse: chantier.adresse ?? prev.adresse,
      codePostal: chantier.codePostal ?? prev.codePostal,
      ville: chantier.ville ?? prev.ville,
      ...(clientAssocie
        ? {
            client: clientAssocie.nom ?? prev.client,
            email: clientAssocie.email ?? prev.email,
            telephone: clientAssocie.telephone ?? prev.telephone,
            typeClient: clientAssocie.typeClient ?? prev.typeClient,
            societe: clientAssocie.societe ?? prev.societe,
            tvaClient: clientAssocie.tva ?? prev.tvaClient,
          }
        : {}),
    }));

    setNouveauChantierDateDebut(chantier.dateDebut ?? "");
    setNouveauChantierDateFin(chantier.dateFin ?? "");
    setNouveauChantierStatut(chantier.statut ?? "À planifier");

    if (clientAssocie) {
      setClientSelectionneId(clientAssocie.id);
    }
  };

  const handleCreerDevis = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Utilisateur non connecté.");
      return;
    }

    if (!entrepriseId || typeof entrepriseId !== "string") {
      alert("Aucune entreprise active pour ce compte.");
      return;
    }

    const uidCreateur = createdByUid ?? currentUser.uid;

    if (!uidCreateur) {
      alert("Impossible d’identifier le créateur du devis.");
      return;
    }

    if (!nouveauDevis.client.trim() || !nouveauDevis.date) {
      alert("Remplis au minimum le client et la date.");
      return;
    }

    const lignesValides = convertirLignesFormStateEnLignesMetier(lignes);

    if (lignesValides.length === 0) {
      alert("Ajoute au moins une ligne de prestation valide.");
      return;
    }

    const tvaTaux = Number(nouveauDevis.tvaTaux);
    const acomptePourcentage = Number(nouveauDevis.acomptePourcentage);
    const validiteJours = Number(nouveauDevis.validiteJours);

    if (Number.isNaN(tvaTaux) || tvaTaux < 0) {
      alert("Le taux de TVA doit être valide.");
      return;
    }

    if (Number.isNaN(acomptePourcentage) || acomptePourcentage < 0) {
      alert("Le pourcentage d’acompte doit être valide.");
      return;
    }

    if (Number.isNaN(validiteJours) || validiteJours <= 0) {
      alert("La durée de validité doit être valide.");
      return;
    }

    const numeroBase = genererNumeroDevis(devis);
    const nouveauId = `${entrepriseId}-${numeroBase}`;
    const maintenant = Date.now();

    try {
      setSauvegardeEnCours(true);

      let finalClientId = clientSelectionneId;
      let finalClientNom = nouveauDevis.client.trim();

      if (!clientSelectionneId) {
        const referenceClient = genererReferenceClient(clients);

        const nouveauClient: Client = {
          id: `${entrepriseId}-cli-${maintenant}`,
          reference: referenceClient,
          nom: nouveauDevis.client.trim(),
          typeClient: nouveauDevis.typeClient,
          societe: nouveauDevis.societe.trim(),
          email: nouveauDevis.email.trim(),
          telephone: nouveauDevis.telephone.trim(),
          adresse: nouveauDevis.adresse.trim(),
          codePostal: nouveauDevis.codePostal.trim(),
          ville: nouveauDevis.ville.trim(),
          pays: "Belgique",
          tva: nouveauDevis.tvaClient.trim(),
          notes: "",
          entrepriseId,
          createdByUid: uidCreateur,
          archive: false,
          createdAt: maintenant,
          updatedAt: maintenant,
        };

        await setDoc(doc(db, "clients", nouveauClient.id), nouveauClient);
        finalClientId = nouveauClient.id;
        finalClientNom = nouveauClient.nom;
      }

      let finalChantierId = chantierSelectionneId;
      let finalChantierTitre = nouveauDevis.chantierTitre.trim();

      if (!chantierSelectionneId && nouveauDevis.chantierTitre.trim()) {
        const referenceChantier = genererReferenceChantier(chantiers);

        const nouveauChantier: Chantier = {
          id: `${entrepriseId}-ch-${maintenant}`,
          reference: referenceChantier,
          titre: nouveauDevis.chantierTitre.trim(),
          clientId: finalClientId,
          clientNom: finalClientNom,
          adresse: nouveauDevis.adresse.trim(),
          codePostal: nouveauDevis.codePostal.trim(),
          ville: nouveauDevis.ville.trim(),
          dateDebut: nouveauChantierDateDebut,
          dateFin: nouveauChantierDateFin,
          statut: nouveauChantierStatut,
          description: "",
          notes: "",
          entrepriseId,
          createdByUid: uidCreateur,
          archive: false,
          createdAt: maintenant,
          updatedAt: maintenant,
        };

        await setDoc(doc(db, "chantiers", nouveauChantier.id), nouveauChantier);
        finalChantierId = nouveauChantier.id;
        finalChantierTitre = nouveauChantier.titre;
      }

      const devisCree: DevisBusiness = {
        id: nouveauId,
        entrepriseId,
        createdByUid: uidCreateur,
        client: nouveauDevis.client.trim(),
        statut: nouveauDevis.statut,
        date: formaterDate(nouveauDevis.date),
        adresse: nouveauDevis.adresse.trim(),
        codePostal: nouveauDevis.codePostal.trim(),
        ville: nouveauDevis.ville.trim(),
        email: nouveauDevis.email.trim(),
        telephone: nouveauDevis.telephone.trim(),
        typeClient: nouveauDevis.typeClient,
        societe: nouveauDevis.societe.trim(),
        tvaClient: nouveauDevis.tvaClient.trim(),
        chantierId: finalChantierId,
        chantierTitre: finalChantierTitre,
        tvaTaux,
        lignes: lignesValides,
        acomptePourcentage,
        validiteJours,
        conditions: nouveauDevis.conditions.trim(),
        archive: false,
        createdAt: maintenant,
      };

      await setDoc(doc(db, "devis", devisCree.id), devisCree);
      onDevisCree(devisCree.id);
      reinitialiserFormulaire();
      onClose();
    } catch (error: unknown) {
      console.error("Erreur création devis :", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        "message" in error
      ) {
        const firebaseError = error as { code?: string; message?: string };
        alert(
          `Erreur création devis : ${firebaseError.code ?? "unknown"} - ${
            firebaseError.message ?? "Erreur inconnue"
          }`
        );
        return;
      }

      if (error instanceof Error) {
        alert(`Erreur création devis : ${error.message}`);
        return;
      }

      alert("Erreur lors de la création du devis.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-xl font-semibold sm:text-2xl">Créer un devis</h3>

      <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2">
        <div className="min-w-0 md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Client existant
          </label>
          <select
            value={clientSelectionneId}
            onChange={(e) => handleSelectionClient(e.target.value)}
            className={champFormulaireClasses}
          >
            <option value="">Créer un nouveau client depuis ce devis</option>
            {clientsActifs.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom}
                {client.societe ? ` — ${client.societe}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Chantier existant
          </label>
          <select
            value={chantierSelectionneId}
            onChange={(e) => handleSelectionChantier(e.target.value)}
            className={champFormulaireClasses}
          >
            <option value="">Créer un nouveau chantier depuis ce devis</option>
            {chantiersActifs.map((chantier) => (
              <option key={chantier.id} value={chantier.id}>
                {chantier.titre}
                {chantier.clientNom ? ` — ${chantier.clientNom}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Titre du chantier
          </label>
          <input
            type="text"
            value={nouveauDevis.chantierTitre}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                chantierTitre: e.target.value,
              }))
            }
            placeholder="Ex. Rénovation cuisine, pose châssis, dressing sur mesure..."
            className={champFormulaireClasses}
          />
          <p className="mt-2 text-xs text-slate-400">
            Si aucun client ni chantier n’est sélectionné, ils pourront être
            créés automatiquement à l’enregistrement du devis selon les
            informations saisies.
          </p>
        </div>

        {!chantierSelectionneId && nouveauDevis.chantierTitre.trim() && (
          <>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Statut du chantier
              </label>
              <select
                value={nouveauChantierStatut}
                onChange={(e) =>
                  setNouveauChantierStatut(e.target.value as StatutChantier)
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
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date début chantier
              </label>
              <input
                type="date"
                value={nouveauChantierDateDebut}
                onChange={(e) => setNouveauChantierDateDebut(e.target.value)}
                className={champFormulaireClasses}
              />
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date fin chantier
              </label>
              <input
                type="date"
                value={nouveauChantierDateFin}
                onChange={(e) => setNouveauChantierDateFin(e.target.value)}
                className={champFormulaireClasses}
              />
            </div>
          </>
        )}

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nom du client
          </label>
          <input
            type="text"
            value={nouveauDevis.client}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                client: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Type de client
          </label>
          <select
            value={nouveauDevis.typeClient}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                typeClient: e.target.value as TypeClient,
              }))
            }
            className={champFormulaireClasses}
          >
            <option value="Particulier">Particulier</option>
            <option value="Professionnel">Professionnel</option>
          </select>
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Société
          </label>
          <input
            type="text"
            value={nouveauDevis.societe}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                societe: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            TVA client
          </label>
          <input
            type="text"
            value={nouveauDevis.tvaClient}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                tvaClient: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            type="date"
            value={nouveauDevis.date}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                date: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Statut
          </label>
          <select
            value={nouveauDevis.statut}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                statut: e.target.value as StatutDevis,
              }))
            }
            className={champFormulaireClasses}
          >
            {STATUTS_DEVIS.map((statut) => (
              <option key={statut} value={statut}>
                {statut}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            TVA (%)
          </label>
          <input
            type="number"
            value={nouveauDevis.tvaTaux}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                tvaTaux: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0 md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Adresse
          </label>
          <input
            type="text"
            value={nouveauDevis.adresse}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                adresse: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Code postal
          </label>
          <input
            type="text"
            value={nouveauDevis.codePostal}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                codePostal: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Ville / commune
          </label>
          <input
            type="text"
            value={nouveauDevis.ville}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                ville: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            value={nouveauDevis.email}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Téléphone
          </label>
          <input
            type="text"
            value={nouveauDevis.telephone}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                telephone: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Acompte (%)
          </label>
          <input
            type="number"
            value={nouveauDevis.acomptePourcentage}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                acomptePourcentage: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Validité (jours)
          </label>
          <input
            type="number"
            value={nouveauDevis.validiteJours}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                validiteJours: e.target.value,
              }))
            }
            className={champFormulaireClasses}
          />
        </div>
      </div>

      <div className="mt-4 min-w-0">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Conditions
        </label>
        <textarea
          value={nouveauDevis.conditions}
          onChange={(e) =>
            setNouveauDevis((prev) => ({
              ...prev,
              conditions: e.target.value,
            }))
          }
          rows={4}
          className={champFormulaireClasses}
        />
      </div>

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold">Prestations du devis</h4>
            <p className="mt-1 text-sm text-slate-500">
              Ajoute des lignes manuellement ou depuis la bibliothèque.
            </p>
          </div>

          <button
            type="button"
            onClick={ajouterLigne}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
          >
            Ajouter une ligne
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {lignes.map((ligne, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">
                  Ligne {index + 1}
                </p>

                {lignes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => supprimerLigne(index)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                )}
              </div>

              <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="min-w-0 xl:col-span-1">
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Désignation
                  </label>
                  <input
                    type="text"
                    placeholder="Ex. Pose porte intérieure"
                    value={ligne.designation}
                    onChange={(e) =>
                      mettreAJourLigne(index, "designation", e.target.value)
                    }
                    className={champFormulaireClasses}
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Quantité
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={ligne.quantite}
                    onChange={(e) =>
                      mettreAJourLigne(index, "quantite", e.target.value)
                    }
                    className={champFormulaireClasses}
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Unité
                  </label>
                  <select
                    value={ligne.unite}
                    onChange={(e) =>
                      mettreAJourLigne(index, "unite", e.target.value)
                    }
                    className={champFormulaireClasses}
                  >
                    {UNITES_PREDEFINIES.map((unite) => (
                      <option key={unite} value={unite}>
                        {unite}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Prix unitaire HT
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={ligne.prixUnitaire}
                    onChange={(e) =>
                      mettreAJourLigne(index, "prixUnitaire", e.target.value)
                    }
                    className={champFormulaireClasses}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Total ligne :{" "}
                <span className="font-semibold text-slate-900">
                  {formatMontant(
                    (Number(ligne.quantite) || 0) *
                      (Number(ligne.prixUnitaire) || 0)
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h5 className="text-base font-semibold text-slate-900">
                Bibliothèque de prestations
              </h5>
              <p className="mt-1 text-sm text-slate-500">
                {prestationsActives.length} prestation
                {prestationsActives.length > 1 ? "s" : ""} disponible
                {prestationsActives.length > 1 ? "s" : ""}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBibliothequeOuverte((prev) => !prev)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              {bibliothequeOuverte
                ? "Masquer la bibliothèque"
                : "Afficher la bibliothèque"}
            </button>
          </div>

          {bibliothequeOuverte && (
            <>
              <div className="mt-4 w-full">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Rechercher une prestation
                </label>
                <input
                  type="search"
                  value={recherchePrestation}
                  onChange={(e) => setRecherchePrestation(e.target.value)}
                  placeholder="Ex. porte, pose, m², forfait..."
                  className={champFormulaireClasses}
                />
              </div>

              {prestationsActives.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Aucune prestation n’est encore enregistrée dans la
                  bibliothèque.
                </div>
              ) : prestationsFiltrees.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Aucune prestation ne correspond à cette recherche.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {prestationsFiltrees.map((prestation) => (
                    <div
                      key={prestation.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {prestation.designation}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatMontant(prestation.prixUnitaire)} HT ·{" "}
                          {prestation.unite}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          ajouterPrestationDansLignes(prestation.id)
                        }
                        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 sm:w-auto"
                      >
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCreerDevis}
          disabled={sauvegardeEnCours}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {sauvegardeEnCours ? "Enregistrement..." : "Enregistrer le devis"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={sauvegardeEnCours}
          className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}