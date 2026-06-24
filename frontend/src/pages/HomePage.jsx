const stats = [
  { value: '1/3', label: 'associations manquent de benevoles' },
  { value: '12M', label: 'benevoles actifs' },
  { value: '7,5MdEUR', label: 'dons annuels' },
];

const guestHighlights = [
  'Acceder aux fiches associations et a leurs missions',
  'Enregistrer des offres dans vos favoris',
  'Retrouver votre historique benevole dans un espace dedie',
];

export default function HomePage({ isAuthenticated = false, onGoLogin, onGoSignup }) {
  return (
    <>
      <section className="hero card">
        <div className="hero-left">
          <span className="pill">Plateforme de benevolat et dons</span>
          <h1>
            Ensemble, <span>faisons la difference</span>
          </h1>
          <p>
            Donnify connecte les associations qui ont besoin de vous avec des citoyens prets a s'engager,
            localement ou a distance.
          </p>
          <div className="stats-row">
            {stats.map((s) => (
              <div key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-right">
          <img src="/hero.png" alt="Benevoles sur le terrain" />
        </div>
      </section>

      {!isAuthenticated && (
        <section className="guest-banner card">
          <div className="guest-banner-copy">
            <p className="kicker">ACCES MEMBRE</p>
            <h2>Connectez-vous pour ouvrir tout l'univers Donnify</h2>
            <p>
              En tant que visiteur, vous voyez l'accueil. Une connexion debloque les associations, les offres,
              les favoris et votre suivi benevole.
            </p>
          </div>

          <div className="guest-banner-panel">
            <div className="guest-highlight-list">
              {guestHighlights.map((item) => (
                <div className="guest-highlight-item" key={item}>
                  <span className="guest-highlight-dot" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="guest-banner-actions">
              <button className="solid" type="button" onClick={() => onGoSignup?.()}>
                Creer un compte
              </button>
              <button className="ghost" type="button" onClick={() => onGoLogin?.()}>
                J'ai deja un compte
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
