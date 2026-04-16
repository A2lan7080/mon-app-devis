"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import AdminDashboard from "../components/AdminDashboard";
import DevisForm from "../components/DevisForm";
import DevisList from "../components/DevisList";
import DevisSearch from "../components/DevisSearch";
import {
  entreprise,
  STATUTS_DEVIS,
  TVA_PAR_DEFAUT,
} from "../lib/devis-constants";
import { auth, db } from "../lib/firebase";
import {
  calculerMontantTva,
  calculerTotalHt,
  calculerTotalTvac,
  convertirDateVersInput,
  convertirLignesFormStateEnLignesMetier,
  formaterDate,
  formatMontant,
  genererNumeroDevis,
} from "../lib/devis-helpers";
import type { Devis, NouvelleLigneState, StatutDevis } from "../types/devis";

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
};

type EditFormState = {
  client: string;
  statut: StatutDevis;
  date: string;
  adresse: string;
  email: string;
  telephone: string;
  tvaTaux: string;
  acomptePourcentage: string;
  validiteJours: string;
  conditions: string;
};

type VuePrincipale = "devis" | "admin";

type ProfilUtilisateur = {
  uid: string;
  email: string;
  role: string;
  active: boolean;
  entrepriseId: string;
  displayName: string;
  createdAt?: number;
};

export default function Home() {
  const router = useRouter();

  const [vuePrincipale, setVuePrincipale] = useState<VuePrincipale>("devis");
  const [recherche, setRecherche] = useState("");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [profilUtilisateur, setProfilUtilisateur] =
    useState<ProfilUtilisateur | null>(null);
  const [authChargee, setAuthChargee] = useState(false);
  const [erreurAcces, setErreurAcces] = useState<string | null>(null);

  const [devis, setDevis] = useState<DevisBusiness[]>([]);
  const [devisSelectionneId, setDevisSelectionneId] = useState<string | null>(
    null
  );
  const [chargement, setChargement] = useState(true);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);

  const [editForm, setEditForm] = useState<EditFormState>({
    client: "",
    statut: "Brouillon",
    date: "",
    adresse: "",
    email: "",
    telephone: "",
    tvaTaux: String(TVA_PAR_DEFAUT),
    acomptePourcentage: "30",
    validiteJours: "30",
    conditions: "",
  });

  const [editLignes, setEditLignes] = useState<NouvelleLigneState[]>([]);

  const estAdmin = profilUtilisateur?.role === "admin";
  const entrepriseIdCourante = profilUtilisateur?.entrepriseId ?? null;
  const getDevisDocRef = (devisId: string) => doc(db, "devis", devisId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const chargerProfilUtilisateur = async () => {
        if (!currentUser) {
          setUser(null);
          setProfilUtilisateur(null);
          setErreurAcces(null);
          setAuthChargee(true);
          router.push("/login");
          return;
        }

        try {
          setErreurAcces(null);

          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces(
              "Ton profil utilisateur n’existe pas dans Firestore. Crée d’abord le document users/{uid} avec un rôle, un statut actif et un entrepriseId valide."
            );
            return;
          }

          const data = userSnap.data() as Partial<ProfilUtilisateur>;

          if (data.uid !== currentUser.uid) {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces("Le profil utilisateur est invalide.");
            return;
          }

          if (data.active !== true) {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces("Ce compte est désactivé.");
            return;
          }

          if (!data.entrepriseId || typeof data.entrepriseId !== "string") {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces(
              "Aucun entrepriseId valide n’est défini sur ce compte."
            );
            return;
          }

          if (data.role !== "admin" && data.role !== "ouvrier") {
            setUser(currentUser);
            setProfilUtilisateur(null);
            setErreurAcces("Le rôle utilisateur est invalide.");
            return;
          }

          const profil: ProfilUtilisateur = {
            uid: currentUser.uid,
            email:
              typeof data.email === "string" ? data.email : currentUser.email ?? "",
            role: data.role,
            active: true,
            entrepriseId: data.entrepriseId,
            displayName:
              typeof data.displayName === "string" && data.displayName.trim()
                ? data.displayName
                : currentUser.displayName ??
                  currentUser.email?.split("@")[0] ??
                  "Utilisateur",
            createdAt:
              typeof data.createdAt === "number" ? data.createdAt : undefined,
          };

          setUser(currentUser);
          setProfilUtilisateur(profil);
        } catch (error) {
          console.error("Erreur chargement profil utilisateur :", error);
          setUser(currentUser);
          setProfilUtilisateur(null);
          setErreurAcces("Impossible de charger le profil utilisateur.");
        } finally {
          setAuthChargee(true);
        }
      };

      void chargerProfilUtilisateur();
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!authChargee) return;

    if (!user || !profilUtilisateur) {
      setDevis([]);
      setChargement(false);
      return;
    }

    if (!estAdmin) {
      setDevis([]);
      setChargement(false);
      return;
    }

    if (!entrepriseIdCourante) {
      setDevis([]);
      setChargement(false);
      return;
    }

    setChargement(true);

    const devisQuery = query(
      collection(db, "devis"),
      where("entrepriseId", "==", entrepriseIdCourante)
    );

    const unsubscribe = onSnapshot(
      devisQuery,
      (snapshot) => {
        const donnees = snapshot.docs
          .map((item) => item.data() as DevisBusiness)
          .filter((item) => item && item.id && item.client)
          .sort((a, b) => {
            const aCreated = a.createdAt ?? 0;
            const bCreated = b.createdAt ?? 0;
            return bCreated - aCreated;
          });

        setDevis(donnees);
        setChargement(false);
      },
      (error) => {
        console.error("Erreur lecture devis :", error);
        setChargement(false);
      }
    );

    return () => unsubscribe();
  }, [authChargee, user, profilUtilisateur, entrepriseIdCourante, estAdmin]);

  useEffect(() => {
    if (!estAdmin && vuePrincipale === "admin") {
      setVuePrincipale("devis");
    }
  }, [estAdmin, vuePrincipale]);

  const devisSelectionne = useMemo(() => {
    if (devis.length === 0) return null;

    const trouve = devis.find((item) => item.id === devisSelectionneId) ?? null;
    return trouve ?? devis[0];
  }, [devis, devisSelectionneId]);

  const totalDevis = devis.filter((item) => !item.archive).length;
  const totalBrouillons = devis.filter(
    (item) => item.statut === "Brouillon" && !item.archive
  ).length;
  const totalAcceptes = devis.filter(
    (item) => item.statut === "Accepté" && !item.archive
  ).length;
  const totalEnvoyes = devis.filter(
    (item) => item.statut === "Envoyé" && !item.archive
  ).length;
  const totalRefuses = devis.filter(
    (item) => item.statut === "Refusé" && !item.archive
  ).length;
  const totalArchives = devis.filter((item) => item.archive).length;

  const caSigne = devis
    .filter((item) => item.statut === "Accepté" && !item.archive)
    .reduce((total, item) => total + calculerTotalTvac(item), 0);

  const pipeEnvoye = devis
    .filter((item) => item.statut === "Envoyé" && !item.archive)
    .reduce((total, item) => total + calculerTotalTvac(item), 0);

  const pipeBrouillon = devis
    .filter((item) => item.statut === "Brouillon" && !item.archive)
    .reduce((total, item) => total + calculerTotalTvac(item), 0);

  const valeurBusinessTotale = devis
    .filter((item) => item.statut !== "Refusé" && !item.archive)
    .reduce((total, item) => total + calculerTotalTvac(item), 0);

  const tauxConversion =
    totalDevis > 0 ? Math.round((totalAcceptes / totalDevis) * 100) : 0;

  const ticketMoyen =
    totalAcceptes > 0 ? Math.round(caSigne / totalAcceptes) : 0;

  const getStatutClasses = (statut: StatutDevis) => {
    switch (statut) {
      case "Brouillon":
        return "bg-slate-200 text-slate-700";
      case "Envoyé":
        return "bg-blue-100 text-blue-700";
      case "Accepté":
        return "bg-emerald-100 text-emerald-700";
      case "Refusé":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-200 text-slate-700";
    }
  };

  const handleDeconnexion = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Erreur déconnexion :", error);
      alert("Impossible de se déconnecter.");
    }
  };

  const handleChangerStatut = async (nouveauStatut: StatutDevis) => {
    if (!devisSelectionne || !estAdmin) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(getDevisDocRef(devisSelectionne.id), {
        ...devisSelectionne,
        statut: nouveauStatut,
      });
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const ouvrirEdition = () => {
    if (!devisSelectionne || !estAdmin) return;

    setEditForm({
      client: devisSelectionne.client,
      statut: devisSelectionne.statut,
      date: convertirDateVersInput(devisSelectionne.date),
      adresse: devisSelectionne.adresse,
      email: devisSelectionne.email,
      telephone: devisSelectionne.telephone,
      tvaTaux: String(devisSelectionne.tvaTaux),
      acomptePourcentage: String(devisSelectionne.acomptePourcentage),
      validiteJours: String(devisSelectionne.validiteJours),
      conditions: devisSelectionne.conditions,
    });

    setEditLignes(
      devisSelectionne.lignes.map((ligne) => ({
        designation: ligne.designation,
        quantite: String(ligne.quantite),
        unite: ligne.unite,
        prixUnitaire: String(ligne.prixUnitaire),
      }))
    );

    setModeEdition(true);
  };

  const annulerEdition = () => {
    setModeEdition(false);
    setEditLignes([]);
  };

  const ajouterLigneEdition = () => {
    setEditLignes((prev) => [
      ...prev,
      {
        designation: "",
        quantite: "1",
        unite: "",
        prixUnitaire: "0",
      },
    ]);
  };

  const supprimerLigneEdition = (index: number) => {
    setEditLignes((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const mettreAJourLigneEdition = (
    index: number,
    champ: keyof NouvelleLigneState,
    valeur: string
  ) => {
    setEditLignes((prev) =>
      prev.map((ligne, i) =>
        i === index ? { ...ligne, [champ]: valeur } : ligne
      )
    );
  };

  const enregistrerEdition = async () => {
    if (!devisSelectionne || !estAdmin) return;

    if (!editForm.client.trim() || !editForm.date) {
      alert("Le client et la date sont obligatoires.");
      return;
    }

    const tvaTaux = Number(editForm.tvaTaux);
    const acomptePourcentage = Number(editForm.acomptePourcentage);
    const validiteJours = Number(editForm.validiteJours);

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

    const lignesValides = convertirLignesFormStateEnLignesMetier(editLignes);

    if (lignesValides.length === 0) {
      alert("Garde au moins une ligne valide.");
      return;
    }

    try {
      setSauvegardeEnCours(true);
      await updateDoc(getDevisDocRef(devisSelectionne.id), {
        ...devisSelectionne,
        client: editForm.client.trim(),
        statut: editForm.statut,
        date: formaterDate(editForm.date),
        adresse: editForm.adresse.trim(),
        email: editForm.email.trim(),
        telephone: editForm.telephone.trim(),
        tvaTaux,
        lignes: lignesValides,
        acomptePourcentage,
        validiteJours,
        conditions: editForm.conditions.trim(),
      });
      setModeEdition(false);
      setEditLignes([]);
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const dupliquerDevis = async () => {
    if (!devisSelectionne || !user || !entrepriseIdCourante || !estAdmin) return;

    const nouveauId = genererNumeroDevis(devis);

    const copie: DevisBusiness = {
      ...devisSelectionne,
      id: nouveauId,
      statut: "Brouillon",
      archive: false,
      createdAt: Date.now(),
      createdByUid: user.uid,
      entrepriseId: entrepriseIdCourante,
      lignes: devisSelectionne.lignes.map((ligne, index) => ({
        ...ligne,
        id: `${nouveauId}-L-${index + 1}`,
      })),
    };

    try {
      setSauvegardeEnCours(true);
      await setDoc(getDevisDocRef(copie.id), copie);
      setDevisSelectionneId(copie.id);
      setModeEdition(false);
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const supprimerDevis = async () => {
    if (!devisSelectionne || !estAdmin) return;

    const confirmation = window.confirm(
      `Supprimer définitivement le devis ${devisSelectionne.id} ?`
    );

    if (!confirmation) return;

    try {
      setSauvegardeEnCours(true);
      await deleteDoc(getDevisDocRef(devisSelectionne.id));
      setModeEdition(false);
      setDevisSelectionneId(null);
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const archiverDevis = async () => {
    if (!devisSelectionne || !estAdmin) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(getDevisDocRef(devisSelectionne.id), {
        ...devisSelectionne,
        archive: true,
      });
      setModeEdition(false);
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const restaurerDevis = async () => {
    if (!devisSelectionne || !estAdmin) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(getDevisDocRef(devisSelectionne.id), {
        ...devisSelectionne,
        archive: false,
      });
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const handleExporterPdf = () => {
    if (!devisSelectionne) return;

    const totalHt = calculerTotalHt(devisSelectionne);
    const montantTva = calculerMontantTva(devisSelectionne);
    const totalTvac = calculerTotalTvac(devisSelectionne);
    const montantAcompte =
      totalTvac * (devisSelectionne.acomptePourcentage / 100);
    const soldeRestant = totalTvac - montantAcompte;

    const lignesHtml = devisSelectionne.lignes
      .map((ligne) => {
        const sousTotal = ligne.quantite * ligne.prixUnitaire;

        return `
          <tr>
            <td>${ligne.designation}</td>
            <td style="text-align:center;">${ligne.quantite}</td>
            <td style="text-align:center;">${ligne.unite}</td>
            <td style="text-align:right;">${formatMontant(
              ligne.prixUnitaire
            )}</td>
            <td style="text-align:right;">${formatMontant(sousTotal)}</td>
          </tr>
        `;
      })
      .join("");

    const fenetre = window.open("", "_blank", "width=1100,height=900");

    if (!fenetre) {
      alert("Impossible d’ouvrir la fenêtre d’export PDF.");
      return;
    }

    fenetre.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <title>${devisSelectionne.id}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              color: #0f172a;
              background: #ffffff;
            }
            .page {
              max-width: 980px;
              margin: 0 auto;
              padding: 40px;
            }
            .topbar {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              margin-bottom: 32px;
            }
            .bloc { flex: 1; }
            .title {
              font-size: 30px;
              font-weight: 700;
              margin: 0 0 8px;
            }
            .subtitle {
              font-size: 14px;
              color: #475569;
              margin: 0;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .label {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              color: #64748b;
              margin-bottom: 6px;
            }
            .value {
              font-size: 16px;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              text-align: left;
              font-size: 12px;
              color: #64748b;
              padding: 12px 10px;
              border-bottom: 1px solid #e2e8f0;
            }
            td {
              padding: 14px 10px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
            }
            .total-box {
              margin-top: 24px;
              margin-left: auto;
              width: 360px;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 15px;
            }
            .total-row.final {
              margin-top: 14px;
              padding-top: 14px;
              border-top: 1px solid #e2e8f0;
              font-size: 22px;
              font-weight: 700;
            }
            .signature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 24px;
            }
            .signature-box {
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 20px;
              min-height: 140px;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="topbar">
              <div class="bloc">
                <h1 class="title">${entreprise.nom}</h1>
                <p class="subtitle">${entreprise.adresse}</p>
                <p class="subtitle">${entreprise.email} · ${entreprise.telephone}</p>
                <p class="subtitle">TVA ${entreprise.tva}</p>
              </div>
              <div class="bloc" style="text-align:right;">
                <h2 class="title">Devis</h2>
                <p class="subtitle">N° ${devisSelectionne.id}</p>
                <p class="subtitle">Date : ${devisSelectionne.date}</p>
                <p class="subtitle">Statut : ${devisSelectionne.statut}</p>
                <p class="subtitle">Validité : ${devisSelectionne.validiteJours} jours</p>
              </div>
            </div>

            <div class="card">
              <div class="label">Client</div>
              <div class="value">${devisSelectionne.client}</div>
              <div style="height:12px;"></div>
              <div class="grid">
                <div>
                  <div class="label">Adresse</div>
                  <div class="value">${devisSelectionne.adresse || "-"}</div>
                </div>
                <div>
                  <div class="label">Contact</div>
                  <div class="value">${devisSelectionne.email || "-"}</div>
                  <div class="value" style="margin-top:6px;">${devisSelectionne.telephone || "-"}</div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="label">Prestations</div>
              <table>
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th style="text-align:center;">Qté</th>
                    <th style="text-align:center;">Unité</th>
                    <th style="text-align:right;">PU</th>
                    <th style="text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lignesHtml}
                </tbody>
              </table>

              <div class="total-box">
                <div class="total-row">
                  <span>Total HT</span>
                  <span>${formatMontant(totalHt)}</span>
                </div>
                <div class="total-row">
                  <span>TVA (${devisSelectionne.tvaTaux}%)</span>
                  <span>${formatMontant(montantTva)}</span>
                </div>
                <div class="total-row final">
                  <span>Total TVAC</span>
                  <span>${formatMontant(totalTvac)}</span>
                </div>
                <div class="total-row" style="margin-top:18px;">
                  <span>Acompte (${devisSelectionne.acomptePourcentage}%)</span>
                  <span>${formatMontant(montantAcompte)}</span>
                </div>
                <div class="total-row">
                  <span>Solde à la livraison</span>
                  <span>${formatMontant(soldeRestant)}</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="label">Conditions</div>
              <div class="value" style="font-size:14px; font-weight:400; line-height:1.6;">
                ${devisSelectionne.conditions || "Aucune condition particulière."}
              </div>
            </div>

            <div class="signature-grid">
              <div class="signature-box">
                <div class="label">Pour le client</div>
                <div class="value" style="font-size:14px; font-weight:400;">
                  Bon pour accord, date, nom et signature
                </div>
              </div>
              <div class="signature-box">
                <div class="label">Pour l’entreprise</div>
                <div class="value" style="font-size:14px; font-weight:400;">
                  ${entreprise.nom}
                </div>
              </div>
            </div>

            <div class="footer">
              Merci pour votre confiance. Ce devis est valable ${devisSelectionne.validiteJours} jours à compter de sa date d’émission.
            </div>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    fenetre.document.close();
  };

  const totalHtSelectionne = devisSelectionne
    ? calculerTotalHt(devisSelectionne)
    : 0;
  const totalTvaSelectionne = devisSelectionne
    ? calculerMontantTva(devisSelectionne)
    : 0;
  const totalTvacSelectionne = devisSelectionne
    ? calculerTotalTvac(devisSelectionne)
    : 0;
  const acompteSelectionne = devisSelectionne
    ? totalTvacSelectionne * (devisSelectionne.acomptePourcentage / 100)
    : 0;

  if (!authChargee || chargement) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Chargement...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (erreurAcces || !profilUtilisateur) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Accès impossible</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {erreurAcces ??
              "Le profil utilisateur est introuvable ou incomplet."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleDeconnexion}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Se déconnecter
            </button>
            <button
              onClick={() => router.push("/login")}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Retour login
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!estAdmin) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-6 md:flex">
            <div>
              <h1 className="text-2xl font-bold leading-tight">Batiflow</h1>
              <p className="mt-1 text-sm text-slate-500">
                Espace ouvrier
              </p>
              <p className="mt-3 text-xs text-slate-400">
                {profilUtilisateur.displayName} · {profilUtilisateur.entrepriseId}
              </p>
            </div>
          </aside>

          <section className="flex-1 p-6 md:p-8">
            <div className="mx-auto max-w-4xl">
              <header className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Espace ouvrier</h2>
                  <p className="mt-2 text-slate-500">
                    Le module devis est réservé aux administrateurs.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Entreprise : {profilUtilisateur.entrepriseId} · Rôle :{" "}
                    {profilUtilisateur.role}
                  </p>
                </div>

                <button
                  onClick={handleDeconnexion}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Déconnexion
                </button>
              </header>

              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">
                  Module en préparation
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Cet espace servira plus tard au suivi des chantiers, aux tâches,
                  aux heures prestées, aux notes terrain et aux photos.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-6 md:flex">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Batiflow</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestion devis & pilotage
            </p>
            <p className="mt-3 text-xs text-slate-400">
              {profilUtilisateur.displayName} · {profilUtilisateur.entrepriseId}
            </p>
          </div>

          <nav className="mt-10 space-y-2">
            <button
              onClick={() => setVuePrincipale("devis")}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                vuePrincipale === "devis"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Devis
            </button>

            <button
              onClick={() => setVuePrincipale("admin")}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                vuePrincipale === "admin"
                  ? "bg-amber-100 text-amber-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Admin
            </button>

            <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-400">
              Clients
            </button>
            <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-400">
              Chantiers
            </button>
            <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-400">
              Factures
            </button>
          </nav>
        </aside>

        <section className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <header className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold">
                  {vuePrincipale === "devis" ? "Devis" : "Espace admin"}
                </h2>
                <p className="mt-2 text-slate-500">
                  {vuePrincipale === "devis"
                    ? "Gère tes devis, leur statut et leur suivi."
                    : "Pilote la valeur business, le pipe et la conversion."}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Entreprise : {profilUtilisateur.entrepriseId} · Rôle :{" "}
                  {profilUtilisateur.role}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {sauvegardeEnCours && (
                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                    Synchronisation...
                  </div>
                )}

                <button
                  onClick={handleDeconnexion}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Déconnexion
                </button>

                {vuePrincipale === "devis" && (
                  <button
                    onClick={() => {
                      setAfficherFormulaire((prev) => !prev);
                      setModeEdition(false);
                    }}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    {afficherFormulaire ? "Fermer" : "Nouveau devis"}
                  </button>
                )}
              </div>
            </header>

            {vuePrincipale === "admin" ? (
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
            ) : (
              <>
                {afficherFormulaire && (
                  <DevisForm
                    devis={devis}
                    onDevisCree={(id) => {
                      setDevisSelectionneId(id);
                      setAfficherFormulaire(false);
                      setRecherche("");
                    }}
                    onClose={() => setAfficherFormulaire(false)}
                  />
                )}

                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Total devis</p>
                    <p className="mt-2 text-3xl font-bold">{totalDevis}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Brouillons</p>
                    <p className="mt-2 text-3xl font-bold">{totalBrouillons}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Acceptés</p>
                    <p className="mt-2 text-3xl font-bold">{totalAcceptes}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">CA signé</p>
                    <p className="mt-2 text-3xl font-bold">
                      {formatMontant(caSigne)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,1fr)]">
                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <DevisSearch
                      recherche={recherche}
                      setRecherche={setRecherche}
                      filtreStatut={"Tous"}
                      setFiltreStatut={() => {}}
                      filtreArchivage={"tous"}
                      setFiltreArchivage={() => {}}
                      statuts={STATUTS_DEVIS}
                    />

                    <DevisList
                      devis={devis}
                      devisSelectionneId={devisSelectionne?.id ?? null}
                      setDevisSelectionneId={setDevisSelectionneId}
                      setModeEdition={setModeEdition}
                    />
                  </div>

                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    {devisSelectionne ? (
                      !modeEdition ? (
                        <>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm text-slate-500">Fiche devis</p>
                              <h3 className="mt-1 text-2xl font-bold">
                                {devisSelectionne.id}
                              </h3>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatutClasses(
                                  devisSelectionne.statut
                                )}`}
                              >
                                {devisSelectionne.statut}
                              </span>

                              <button
                                onClick={ouvrirEdition}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={dupliquerDevis}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Dupliquer
                              </button>
                              {!devisSelectionne.archive ? (
                                <button
                                  onClick={archiverDevis}
                                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                                >
                                  Archiver
                                </button>
                              ) : (
                                <button
                                  onClick={restaurerDevis}
                                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                                >
                                  Restaurer
                                </button>
                              )}
                              <button
                                onClick={supprimerDevis}
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                              >
                                Supprimer
                              </button>
                              <button
                                onClick={handleExporterPdf}
                                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                              >
                                Export PDF
                              </button>
                            </div>
                          </div>

                          <div className="mt-6 space-y-4">
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-sm text-slate-500">Client</p>
                              <p className="mt-1 text-lg font-semibold">
                                {devisSelectionne.client}
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Adresse</p>
                                <p className="mt-1 font-semibold">
                                  {devisSelectionne.adresse || "Non renseignée"}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Contact</p>
                                <p className="mt-1 font-semibold">
                                  {devisSelectionne.email || "Non renseigné"}
                                </p>
                                <p className="mt-1 font-semibold">
                                  {devisSelectionne.telephone || "Non renseigné"}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Date</p>
                                <p className="mt-1 font-semibold">
                                  {devisSelectionne.date}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">TVA</p>
                                <p className="mt-1 font-semibold">
                                  {devisSelectionne.tvaTaux}%
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Validité</p>
                                <p className="mt-1 font-semibold">
                                  {devisSelectionne.validiteJours} jours
                                </p>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-slate-500">Prestations</p>
                                <p className="text-sm font-semibold text-slate-700">
                                  {devisSelectionne.lignes.length} ligne
                                  {devisSelectionne.lignes.length > 1 ? "s" : ""}
                                </p>
                              </div>

                              <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                                      <th className="px-3 py-3 font-medium">
                                        Désignation
                                      </th>
                                      <th className="px-3 py-3 font-medium">Qté</th>
                                      <th className="px-3 py-3 font-medium">
                                        Unité
                                      </th>
                                      <th className="px-3 py-3 font-medium">PU</th>
                                      <th className="px-3 py-3 font-medium">
                                        Total
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {devisSelectionne.lignes.map((ligne) => {
                                      const totalLigne =
                                        ligne.quantite * ligne.prixUnitaire;

                                      return (
                                        <tr
                                          key={ligne.id}
                                          className="border-b border-slate-200 last:border-b-0"
                                        >
                                          <td className="px-3 py-3 text-sm font-medium">
                                            {ligne.designation}
                                          </td>
                                          <td className="px-3 py-3 text-sm">
                                            {ligne.quantite}
                                          </td>
                                          <td className="px-3 py-3 text-sm">
                                            {ligne.unite}
                                          </td>
                                          <td className="px-3 py-3 text-sm whitespace-nowrap">
                                            {formatMontant(ligne.prixUnitaire)}
                                          </td>
                                          <td className="px-3 py-3 text-sm font-semibold whitespace-nowrap">
                                            {formatMontant(totalLigne)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Total HT</p>
                                <p className="mt-1 font-semibold">
                                  {formatMontant(totalHtSelectionne)}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">
                                  TVA ({devisSelectionne.tvaTaux}%)
                                </p>
                                <p className="mt-1 font-semibold">
                                  {formatMontant(totalTvaSelectionne)}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Total TVAC</p>
                                <p className="mt-1 font-semibold">
                                  {formatMontant(totalTvacSelectionne)}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Acompte</p>
                                <p className="mt-1 font-semibold">
                                  {formatMontant(acompteSelectionne)}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-sm text-slate-500">Conditions</p>
                              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                                {devisSelectionne.conditions ||
                                  "Aucune condition particulière."}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-sm text-slate-500">Actions rapides</p>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleChangerStatut("Brouillon")}
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                  Mettre en brouillon
                                </button>
                                <button
                                  onClick={() => handleChangerStatut("Envoyé")}
                                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                  Marquer envoyé
                                </button>
                                <button
                                  onClick={() => handleChangerStatut("Accepté")}
                                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  Marquer accepté
                                </button>
                                <button
                                  onClick={() => handleChangerStatut("Refusé")}
                                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                >
                                  Marquer refusé
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm text-slate-500">Édition devis</p>
                              <h3 className="mt-1 text-2xl font-bold">
                                {devisSelectionne.id}
                              </h3>
                            </div>

                            <button
                              onClick={annulerEdition}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Fermer
                            </button>
                          </div>

                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Client
                              </label>
                              <input
                                type="text"
                                value={editForm.client}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    client: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Date
                              </label>
                              <input
                                type="date"
                                value={editForm.date}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    date: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Adresse
                              </label>
                              <input
                                type="text"
                                value={editForm.adresse}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    adresse: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Statut
                              </label>
                              <select
                                value={editForm.statut}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    statut: e.target.value as StatutDevis,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              >
                                {STATUTS_DEVIS.map((statut) => (
                                  <option key={statut} value={statut}>
                                    {statut}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Email
                              </label>
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
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
                                value={editForm.telephone}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    telephone: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                TVA (%)
                              </label>
                              <input
                                type="number"
                                value={editForm.tvaTaux}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    tvaTaux: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Acompte (%)
                              </label>
                              <input
                                type="number"
                                value={editForm.acomptePourcentage}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    acomptePourcentage: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Validité (jours)
                              </label>
                              <input
                                type="number"
                                value={editForm.validiteJours}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    validiteJours: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Conditions
                            </label>
                            <textarea
                              value={editForm.conditions}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  conditions: e.target.value,
                                }))
                              }
                              rows={4}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
                          </div>

                          <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <h4 className="text-lg font-semibold">
                                Lignes de prestation
                              </h4>
                              <button
                                onClick={ajouterLigneEdition}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Ajouter une ligne
                              </button>
                            </div>

                            <div className="mt-4 space-y-4">
                              {editLignes.map((ligne, index) => (
                                <div
                                  key={`edition-${index}`}
                                  className="rounded-2xl border border-slate-200 bg-white p-4"
                                >
                                  <div className="mb-4 flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-slate-700">
                                      Ligne {index + 1}
                                    </p>
                                    <button
                                      onClick={() => supprimerLigneEdition(index)}
                                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                    >
                                      Supprimer
                                    </button>
                                  </div>

                                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="xl:col-span-2">
                                      <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Désignation
                                      </label>
                                      <input
                                        type="text"
                                        value={ligne.designation}
                                        onChange={(e) =>
                                          mettreAJourLigneEdition(
                                            index,
                                            "designation",
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                      />
                                    </div>

                                    <div>
                                      <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Quantité
                                      </label>
                                      <input
                                        type="number"
                                        value={ligne.quantite}
                                        onChange={(e) =>
                                          mettreAJourLigneEdition(
                                            index,
                                            "quantite",
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                      />
                                    </div>

                                    <div>
                                      <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Unité
                                      </label>
                                      <input
                                        type="text"
                                        value={ligne.unite}
                                        onChange={(e) =>
                                          mettreAJourLigneEdition(
                                            index,
                                            "unite",
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                      />
                                    </div>

                                    <div>
                                      <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Prix unitaire
                                      </label>
                                      <input
                                        type="number"
                                        value={ligne.prixUnitaire}
                                        onChange={(e) =>
                                          mettreAJourLigneEdition(
                                            index,
                                            "prixUnitaire",
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                      />
                                    </div>

                                    <div className="xl:col-span-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                      Total ligne :{" "}
                                      <span className="font-semibold text-slate-900">
                                        {formatMontant(
                                          (Number(ligne.quantite) || 0) *
                                            (Number(ligne.prixUnitaire) || 0)
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                              onClick={enregistrerEdition}
                              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                            >
                              Enregistrer les modifications
                            </button>

                            <button
                              onClick={annulerEdition}
                              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Annuler
                            </button>
                          </div>
                        </>
                      )
                    ) : (
                      <div className="flex min-h-80 items-center justify-center text-center text-sm text-slate-500">
                        Aucun devis pour cette entreprise.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}