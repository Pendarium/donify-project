import { useEffect } from 'react';
import { Link } from 'react-router-dom';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('fr-FR');
}

export default function HistoryPage({ history, onLoadHistory }) {
  useEffect(() => {
    onLoadHistory?.();
  }, []);

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">HISTORIQUE</p>
        <h2>Mes experiences de benevolat</h2>
        <p>{history.length} mission(s) archivee(s)</p>
      </div>

      <div className="cards-grid wide">
        {history.map((entry) => {
          const offer = entry.offer;

          return (
            <article className="offer-card" key={entry.id}>
              <div className="offer-head">
                <span className="badge">Effectue le {formatDate(entry.completedAt)}</span>
                <span className="badge">{offer.location}</span>
              </div>
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              <small>
                Mission: {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
              </small>
              {entry.note && <p className="history-note">Note: {entry.note}</p>}
              <p className="offer-meta-line">
                Association: <Link className="inline-link" to={`/associations/${offer.associationId}`}>{offer.association?.name || 'Voir la fiche'}</Link>
              </p>
              <div className="actions-row">
                <Link className="solid action-link" to={`/associations/${offer.associationId}`}>Voir l'association</Link>
              </div>
            </article>
          );
        })}
        {history.length === 0 && (
          <article className="offer-card empty-state-card">
            <h3>Historique vide</h3>
            <p>Ajoutez une mission a votre historique depuis l'onglet benevolat quand elle est terminee.</p>
            <Link className="solid action-link" to="/benevolat">Voir les missions</Link>
          </article>
        )}
      </div>
    </section>
  );
}