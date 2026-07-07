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
  onCreateOffer,
  onDeleteOffer,
}) {
  const todayIso = new Date().toISOString().split('T')[0];
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get('city') || '');
  const selectedOfferId = searchParams.get('offerId') || '';
  const [activeChip, setActiveChip] = useState('Toutes');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [applicationDrafts, setApplicationDrafts] = useState({});
  const [activeApplicationOfferId, setActiveApplicationOfferId] = useState(null);
  const [activeAcceptedOfferId, setActiveAcceptedOfferId] = useState(null);
  const [deletingOfferId, setDeletingOfferId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const emptyForm = {
    title: '',
    description: '',
    location: '',
    missionDate: '',
    durationHours: '2',
    volunteersNeeded: '1',
    isUrgent: false,
  };
  const [createDraft, setCreateDraft] = useState(emptyForm);

  useEffect(() => {
    onLoadOffers(city);
  }, [city]);

  const filtered = useMemo(() => {
    const filteredOffers = offers.filter((offer) => {
      const text = `${offer.title} ${offer.description} ${offer.location}`.toLowerCase();
      const matchesChip =
        activeChip === 'Toutes' ? true : text.includes(activeChip.toLowerCase().replace('aide ', ''));
      const isUrgent = Boolean(offer.isUrgent) || /urgent|urgence/i.test(offer.title + ' ' + offer.description);
      const matchesUrgent = urgentOnly ? isUrgent : true;
      return matchesChip && matchesUrgent;
    });

    if (!selectedOfferId) {
      return filteredOffers;
    }

    return [...filteredOffers].sort((left, right) => {
      if (left.id === selectedOfferId) return -1;
      if (right.id === selectedOfferId) return 1;
      return 0;
    });
  }, [offers, activeChip, urgentOnly, selectedOfferId]);

  const activeApplicationOffer = filtered.find((offer) => offer.id === activeApplicationOfferId) || null;

  const closeApplicationModal = () => {
    if (activeApplicationOfferId) {
      setApplicationDrafts((prev) => {
        const next = { ...prev };
        delete next[activeApplicationOfferId];
        return next;
      });
    }

    setActiveApplicationOfferId(null);
  };

  const closeCreateModal = () => {
    setCreateDraft(emptyForm);
    setShowCreateModal(false);
  };

  const handleOpenApplication = (offerId) => {
    if (role !== 'user') {
      return;
    }

    const offer = filtered.find((item) => item.id === offerId);
    if ((offer?.volunteersNeeded || 0) < 1) {
      return;
    }

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

  const handleCreateFieldChange = (e) => {
    const { checked, name, type, value } = e.target;
    setCreateDraft((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmitCreate = async () => {
    const startDate = new Date(createDraft.missionDate);
    const durationHours = Number(createDraft.durationHours);
    const volunteersNeeded = Number(createDraft.volunteersNeeded);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(startDate.getTime())
      || !Number.isInteger(durationHours)
      || durationHours < 1
      || !Number.isInteger(volunteersNeeded)
      || volunteersNeeded < 1
      || startDay < today
    ) {
      return;
    }

    const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000));

    await onCreateOffer?.({
      title: createDraft.title,
      description: createDraft.description,
      location: createDraft.location,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      durationHours,
      volunteersNeeded,
      isUrgent: Boolean(createDraft.isUrgent),
    });
    closeCreateModal();
  };

  const handleDeleteOffer = async (offerId) => {
    if (!offerId || deletingOfferId) {
      return;
    }

    const confirmed = window.confirm('Confirmer la suppression de cette offre ?');
    if (!confirmed) {
      return;
    }

    setDeletingOfferId(offerId);
    await onDeleteOffer?.(offerId);
    setDeletingOfferId(null);
  };

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">BENEVOLAT</p>
        <h2>Offres de benevolat</h2>
        <p>{filtered.length} missions disponibles</p>
        {isAuthenticated && role === 'association' && (
          <button className="solid" type="button" onClick={() => setShowCreateModal(true)}>
            + Creer une offre
          </button>
        )}
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
          <article className={offer.id === selectedOfferId ? 'offer-card active-outline' : 'offer-card'} key={offer.id}>
            <div className="offer-head">
              <div className="offer-head-meta">
                <span className="badge">{offer.location}</span>
                {(Boolean(offer.isUrgent) || /urgent|urgence/i.test(offer.title + ' ' + offer.description)) && <span className="badge warning">Urgent</span>}
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
              Date : {new Date(offer.startDate).toLocaleDateString('fr-FR')}
            </small>
            <p className="offer-meta-line">Duree : {offer.durationHours || '-'} h</p>
            <p className="offer-meta-line">Benevoles necessaires : {offer.volunteersNeeded || '-'}</p>
            <p className="offer-meta-line">
              Association : {role === 'association'
                ? 'Votre association'
                : <Link className="inline-link" to={`/associations/${offer.associationId}`}>{offer.association?.name || 'Association'}</Link>}
            </p>
            {role === 'user' && (
              <div className="actions-row">
                {(() => {
                  const isFull = (offer.volunteersNeeded || 0) < 1;
                  const alreadyApplied = applicationIds.includes(offer.id);
                  const disabled = isFull || alreadyApplied;

                  return (
                    <button
                      className={disabled ? 'solid action-link active-outline' : 'solid action-link'}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleOpenApplication(offer.id)}
                    >
                      {isFull ? 'Complet' : alreadyApplied ? 'Candidature envoyee' : 'Postuler'}
                    </button>
                  );
                })()}
              </div>
            )}
            {role === 'association' && (
              <>
                <div className="actions-row">
                  <button
                    className={activeAcceptedOfferId === offer.id ? 'solid action-link active-outline' : 'solid action-link'}
                    type="button"
                    onClick={() => setActiveAcceptedOfferId((prev) => (prev === offer.id ? null : offer.id))}
                  >
                    Acceptees ({(offer.historyUsers || []).length})
                  </button>
                  <button
                    className="danger action-link"
                    type="button"
                    disabled={deletingOfferId === offer.id}
                    onClick={() => handleDeleteOffer(offer.id)}
                  >
                    {deletingOfferId === offer.id ? 'Suppression...' : "Supprimer l'offre"}
                  </button>
                </div>

                {activeAcceptedOfferId === offer.id && (
                  <div className="detail-stack">
                    {(offer.historyUsers || []).length ? (offer.historyUsers || []).map((entry) => (
                      <div className="application-card" key={entry.id}>
                        <div className="offer-head">
                          <span className="badge">{entry.user?.username || 'Benevole'}</span>
                          <span className="badge">Valide le {new Date(entry.completedAt).toLocaleDateString()}</span>
                        </div>
                        <p>{entry.note || 'Participation validee sans commentaire.'}</p>
                      </div>
                    )) : <p className="muted">Aucun benevole valide pour cette offre pour le moment.</p>}
                  </div>
                )}
              </>
            )}
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
              Ajoutez un petit message pour expliquer votre motivation avant d'envoyer votre candidature.
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

      {isAuthenticated && role === 'association' && showCreateModal && (
        <div className="modal-backdrop" role="presentation" onClick={closeCreateModal}>
          <div
            className="modal-card card create-offer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-offer-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="kicker">ASSOCIATION</p>
                <h3 id="create-offer-modal-title">Nouvelle offre de benevolat</h3>
              </div>
              <button className="ghost modal-close" type="button" onClick={closeCreateModal}>
                Fermer
              </button>
            </div>

            <div className="modal-form">
              <label>
                Titre
                <input
                  name="title"
                  value={createDraft.title}
                  onChange={handleCreateFieldChange}
                  placeholder="Titre de la mission"
                  maxLength={120}
                />
              </label>
              <label>
                Description
                <textarea
                  className="modal-textarea"
                  name="description"
                  value={createDraft.description}
                  onChange={handleCreateFieldChange}
                  placeholder="Decrivez la mission..."
                  maxLength={600}
                  rows={4}
                />
              </label>
              <label>
                Ville / lieu
                <input
                  name="location"
                  value={createDraft.location}
                  onChange={handleCreateFieldChange}
                  placeholder="Paris, Lyon..."
                />
              </label>
              <label>
                Date de mission
                <input
                  name="missionDate"
                  type="date"
                  min={todayIso}
                  value={createDraft.missionDate}
                  onChange={handleCreateFieldChange}
                />
              </label>
              <label>
                Duree (heures)
                <input
                  name="durationHours"
                  type="number"
                  min={1}
                  value={createDraft.durationHours}
                  onChange={handleCreateFieldChange}
                />
              </label>
              <label>
                Nombre de benevoles necessaires
                <input
                  name="volunteersNeeded"
                  type="number"
                  min={1}
                  value={createDraft.volunteersNeeded}
                  onChange={handleCreateFieldChange}
                />
              </label>
              <label className="modal-checkbox-row">
                <input
                  name="isUrgent"
                  type="checkbox"
                  checked={Boolean(createDraft.isUrgent)}
                  onChange={handleCreateFieldChange}
                />
                Mission urgente
              </label>
            </div>

            <div className="modal-footer">
              <div className="modal-actions">
                <button className="ghost" type="button" onClick={closeCreateModal}>
                  Annuler
                </button>
                <button
                  className="solid"
                  type="button"
                  disabled={
                    !createDraft.title
                    || !createDraft.description
                    || !createDraft.location
                    || !createDraft.missionDate
                    || createDraft.missionDate < todayIso
                    || !Number.isInteger(Number(createDraft.durationHours))
                    || Number(createDraft.durationHours) < 1
                    || !Number.isInteger(Number(createDraft.volunteersNeeded))
                    || Number(createDraft.volunteersNeeded) < 1
                  }
                  onClick={handleSubmitCreate}
                >
                  Publier l'offre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
