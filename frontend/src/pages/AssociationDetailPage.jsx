import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function AssociationDetailPage() {
  const { associationId } = useParams();
  const [association, setAssociation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAssociation() {
      setLoading(true);
      setError('');

      try {
        const data = await api(`/associations/${associationId}`);
        if (active) {
          setAssociation(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAssociation();

    return () => {
      active = false;
    };
  }, [associationId]);

  if (loading) {
    return (
      <section className="page-block detail-shell association-theme">
        <div className="section-header-block">
          <p className="kicker">ASSOCIATION</p>
          <h2>Chargement de la fiche...</h2>
        </div>
      </section>
    );
  }

  if (error || !association) {
    return (
      <section className="page-block detail-shell association-theme">
        <div className="section-header-block">
          <p className="kicker">ASSOCIATION</p>
          <h2>Fiche indisponible</h2>
          <p>{error || 'Association introuvable.'}</p>
        </div>
        <Link className="ghost action-link back-link association-link-button" to="/associations">Retour a la liste</Link>
      </section>
    );
  }

  return (
    <section className="page-block detail-shell association-theme">
      <div className="detail-hero card">
        <div>
          <p className="kicker">ASSOCIATION</p>
          <h2>{association.name}</h2>
          <p className="detail-copy">
            {association.description || 'Cette association n\'a pas encore ajoute de presentation detaillee sur Donnify.'}
          </p>
          <div className="chips-inline">
            <span className="badge">RNA {association.rnaNumber}</span>
            <span className="badge">{association.offers?.length || 0} mission(s)</span>
          </div>
        </div>
        <div className="detail-aside">
          <div className="detail-meta card-soft">
            <strong>Adresse</strong>
            <span>{association.address}</span>
          </div>
          <div className="detail-meta card-soft">
            <strong>Email</strong>
            <span>{association.email || 'Non renseigne'}</span>
          </div>
          <div className="detail-meta card-soft">
            <strong>Telephone</strong>
            <span>{association.phone || 'Non renseigne'}</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <article className="card detail-section">
          <div className="section-header-block">
            <p className="kicker">MISSIONS</p>
            <h3>Opportunites de benevolat</h3>
          </div>
          <div className="detail-stack">
            {association.offers?.length ? association.offers.map((offer) => (
              <div className="offer-card" key={offer.id}>
                <div className="offer-head">
                  <h3>{offer.title}</h3>
                  <span className="badge">{offer.location}</span>
                </div>
                <p>{offer.description}</p>
                <small>
                  Date : {new Date(offer.startDate).toLocaleDateString('fr-FR')} - Duree : {offer.durationHours || '-'} h
                </small>
                <div className="actions-row">
                  <Link className="solid action-link association-link-button" to={`/benevolat?offerId=${offer.id}`}>
                    Voir cette offre
                  </Link>
                </div>
              </div>
            )) : <p className="muted">Aucune mission publiee pour le moment.</p>}
          </div>
        </article>
      </div>

      <Link className="ghost action-link back-link association-link-button" to="/associations">Retour a la liste des associations</Link>
    </section>
  );
}