import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const chips = ['Toutes', 'Aide alimentaire', 'Aide sociale', 'Education', 'Environnement', 'Seniors'];

export default function OffersPage({
  offers,
  onLoadOffers,
  isAuthenticated,
  role,
  favoriteIds = [],
  onToggleFavorite,
  applicationIds = [],
  onSubmitApplication,
}) {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [activeChip, setActiveChip] = useState('Toutes');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [applicationDrafts, setApplicationDrafts] = useState({});
  const [activeApplicationOfferId, setActiveApplicationOfferId] = useState(null);

  useEffect(() => {
    onLoadOffers(city);
  }, [city]);

  const filtered = useMemo(() => {
    return offers.filter((offer) => {
      const text = `${offer.title} ${offer.description} ${offer.location}`.toLowerCase();
      const matchesChip =
        activeChip === 'Toutes' ? true : text.includes(activeChip.toLowerCase().replace('aide ', ''));
      const isUrgent = /urgent|urgence/i.test(offer.title + ' ' + offer.description);
      const matchesUrgent = urgentOnly ? isUrgent : true;
      return matchesChip && matchesUrgent;
    });
  }, [offers, activeChip, urgentOnly]);

  const activeApplicationOffer = filtered.find((offer) => offer.id === activeApplicationOfferId) || null;

  const closeApplicationModal = () => setActiveApplicationOfferId(null);

  const handleOpenApplication = (offerId) => {
    if (applicationIds.includes(offerId)) {
      return;
    }

    setActiveApplicationOfferId(offerId);
  };

  const handleSubmitActiveApplication = () => {
    if (!activeApplicationOffer) {
      return;
    }

    onSubmitApplication?.(activeApplicationOffer.id, applicationDrafts[activeApplicationOffer.id] || '');
    closeApplicationModal();
  };

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">BENEVOLAT</p>
        <h2>Offres de benevolat</h2>
        <p>{filtered.length} missions disponibles</p>
      </div>

      <div className="search card">
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            onLoadOffers(city);
          }}
        >
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville ou code postal" />
          <button type="submit">Rechercher</button>
        </form>
      </div>

      <div className="chips-row split">
        <div className="chips-inline">
          {chips.map((chip) => (
            <button
              key={chip}
              className={chip === activeChip ? 'chip active' : 'chip'}
              onClick={() => setActiveChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
        <button className={urgentOnly ? 'chip active' : 'chip'} onClick={() => setUrgentOnly((v) => !v)}>
          Urgents uniquement
        </button>
      </div>

      <div className="cards-grid wide">
        {filtered.map((offer) => (
          <article className="offer-card" key={offer.id}>
            <div className="offer-head">
              <div className="offer-head-meta">
                <span className="badge">{offer.location}</span>
                {/urgent|urgence/i.test(offer.title + ' ' + offer.description) && <span className="badge warning">Urgent</span>}
              </div>
              {isAuthenticated && role === 'user' && (
                <button
                  className={favoriteIds.includes(offer.id) ? 'heart-favorite is-active' : 'heart-favorite'}
                  type="button"
                  aria-label={favoriteIds.includes(offer.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  title={favoriteIds.includes(offer.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  onClick={() => onToggleFavorite?.(offer.id, favoriteIds.includes(offer.id))}
                >
                  {favoriteIds.includes(offer.id) ? '♥' : '♡'}
                </button>
              )}
            </div>
            <h3>{offer.title}</h3>
            <p>{offer.description}</p>
            <small>
              {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
            </small>
            <p className="offer-meta-line">
              Association: <Link className="inline-link" to={`/associations/${offer.associationId}`}>{offer.association?.name || 'Association'}</Link>
            </p>
            <div className="actions-row">
              <button
                className={applicationIds.includes(offer.id) ? 'solid action-link active-outline' : 'solid action-link'}
                type="button"
                disabled={applicationIds.includes(offer.id)}
                onClick={() => handleOpenApplication(offer.id)}
              >
                {applicationIds.includes(offer.id) ? 'Candidature envoyee' : 'Postuler'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {isAuthenticated && role === 'user' && activeApplicationOffer && (
        <div className="modal-backdrop" role="presentation" onClick={closeApplicationModal}>
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="kicker">CANDIDATURE</p>
                <h3 id="application-modal-title">Postuler a {activeApplicationOffer.title}</h3>
              </div>
              <button className="ghost modal-close" type="button" onClick={closeApplicationModal}>
                Fermer
              </button>
            </div>

            <p className="modal-copy">
              Ajoute un petit message pour expliquer ta motivation avant d'envoyer ta candidature.
            </p>

            <textarea
              className="modal-textarea"
              value={applicationDrafts[activeApplicationOffer.id] || ''}
              onChange={(e) =>
                setApplicationDrafts((prev) => ({ ...prev, [activeApplicationOffer.id]: e.target.value }))
              }
              placeholder="Petit message pour postuler..."
              maxLength={240}
              rows={5}
            />

            <div className="modal-footer">
              <small>{(applicationDrafts[activeApplicationOffer.id] || '').length}/240</small>
              <div className="modal-actions">
                <button className="ghost" type="button" onClick={closeApplicationModal}>
                  Annuler
                </button>
                <button className="solid" type="button" onClick={handleSubmitActiveApplication}>
                  Envoyer la candidature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
