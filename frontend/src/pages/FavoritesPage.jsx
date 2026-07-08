import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FavoritesPage({ favorites, onLoadFavorites, onRemoveFavorite }) {
  useEffect(() => {
    onLoadFavorites?.();
  }, []);

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">MES FAVORIS</p>
        <h2>Offres enregistrees</h2>
        <p>{favorites.length} offres sauvegardees</p>
      </div>

      <div className="cards-grid wide">
        {favorites.map((favorite) => {
          const offer = favorite.offer;

          return (
            <article className="offer-card" key={favorite.id}>
              <div className="offer-head">
                <span className="badge">{offer.location}</span>
                <span className="badge">Favori</span>
              </div>
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              <small>
                Date : {new Date(offer.startDate).toLocaleDateString('fr-FR')} - Duree : {offer.durationHours || '-'} h
              </small>
              <p className="offer-meta-line">
                Association : <Link className="inline-link association-link" to={`/associations/${offer.associationId}`}>{offer.association?.name || 'Voir la fiche'}</Link>
              </p>
              <div className="actions-row">
                <Link className="solid action-link association-link-button" to={`/associations/${offer.associationId}`}>Voir l'association</Link>
                <button className="ghost" type="button" onClick={() => onRemoveFavorite?.(offer.id)}>
                  Retirer
                </button>
              </div>
            </article>
          );
        })}
        {favorites.length === 0 && (
          <article className="offer-card empty-state-card">
            <h3>Aucun favori pour l'instant</h3>
            <p>Ajoutez des missions depuis l'onglet benevolat pour les retrouver ici.</p>
            <Link className="solid action-link" to="/benevolat">Explorer les offres</Link>
          </article>
        )}
      </div>
    </section>
  );
}