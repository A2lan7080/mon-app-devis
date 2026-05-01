const authFeatureCards = [
  {
    titre: "PDF",
    description: "exports propres",
  },
  {
    titre: "Mail",
    description: "envoi client",
  },
  {
    titre: "Mobile",
    description: "prêt terrain",
  },
];

export default function AuthFeatureCards() {
  return (
    <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
      {authFeatureCards.map((carte) => (
        <div
          key={carte.titre}
          className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
        >
          <p className="text-2xl font-bold">{carte.titre}</p>
          <p className="mt-1 text-xs text-slate-300">{carte.description}</p>
        </div>
      ))}
    </div>
  );
}
