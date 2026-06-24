import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function formatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

export default function ProfilePage({ profile, onLoadProfile, onSaveProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [associationTab, setAssociationTab] = useState('infos');
  const [isEditingAssociation, setIsEditingAssociation] = useState(false);
  const [associationForm, setAssociationForm] = useState({
    name: '',
    description: '',
    address: '',
    email: '',
    phone: '',
  });
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  useEffect(() => {
    onLoadProfile();
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      age: profile.age != null ? String(profile.age) : '',
      address: profile.address || '',
      city: profile.city || '',
      postalCode: profile.postalCode || '',
      phone: profile.phone || '',
    });
    setIsEditing(false);
  }, [profile]);

  useEffect(() => {
    if (!profile?.managedAssociation) {
      return;
    }

    const assoc = profile.managedAssociation;
    setAssociationForm({
      name: assoc.name || '',
      description: assoc.description || '',
      address: assoc.address || '',
      email: assoc.email || profile.email || '',
      phone: assoc.phone || '',
    });
    setIsEditingAssociation(false);
  }, [profile?.managedAssociation]);

  const reviews = profile?.associationReviewsReceived ?? [];
  const managedAssociation = profile?.managedAssociation;
  const initialForm = {
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    age: profile?.age != null ? String(profile.age) : '',
    address: profile?.address || '',
    city: profile?.city || '',
    postalCode: profile?.postalCode || '',
    phone: profile?.phone || '',
  };
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const toOptionalString = (value) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  if (profile?.role === 'association') {
    const volunteerReviews = managedAssociation?.userReviewsAuthored ?? [];
    const associationOffers = managedAssociation?.offers ?? [];
    const volunteerApplications = associationOffers.flatMap((offer) => (
      (offer.applications ?? []).map((application) => ({
        ...application,
        offer,
      }))
    ));

    const associationTabs = [
      { id: 'infos', label: 'Infos' },
      { id: 'missions', label: `Missions (${associationOffers.length})` },
      { id: 'demandes', label: `Demandes (${volunteerApplications.length})` },
      { id: 'avis', label: `Avis (${volunteerReviews.length})` },
    ];

    return (
      <section className="page-block association-profile-shell">
        <div className="section-header-block">
          <p className="kicker">ESPACE ASSOCIATION</p>
          <h2>{managedAssociation?.name || profile.username}</h2>
          <p>Pilotez votre presence Donnify, vos missions et la confiance de vos benevoles.</p>
        </div>

        <article className="card association-profile-hero">
          <div>
            <div className="chips-inline">
              <span className="badge">Compte association</span>
              {managedAssociation?.rnaNumber && <span className="badge">RNA {managedAssociation.rnaNumber}</span>}
              <span className={managedAssociation?.isCertified ? 'badge success' : 'badge warning'}>
                {managedAssociation?.isCertified ? 'Association verifiee' : 'Verification en attente'}
              </span>
            </div>
            <p className="association-profile-copy">
              {managedAssociation?.description || 'Ajoutez une description pour mieux presenter la mission de votre structure.'}
            </p>
          </div>
          <div className="association-kpis">
            <div className="association-kpi">
              <strong>{associationOffers.length}</strong>
              <span>Missions actives</span>
            </div>
            <div className="association-kpi">
              <strong>{volunteerReviews.length}</strong>
              <span>Benevoles evalues</span>
            </div>
            <div className="association-kpi">
              <strong>{managedAssociation?.address ? '1' : '0'}</strong>
              <span>Fiche complete</span>
            </div>
          </div>
        </article>

        <div className="association-tabs">
          {associationTabs.map((tab) => (
            <button
              key={tab.id}
              className={associationTab === tab.id ? 'chip active' : 'chip'}
              type="button"
              onClick={() => setAssociationTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {associationTab === 'infos' && (
          <div className="association-profile-grid">
            <article className="card association-panel">
              <h3>Coordonnees publiques</h3>
              <form
                className="profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isEditingAssociation) {
                    return;
                  }
                  onSaveProfile({
                    associationData: {
                      name: associationForm.name.trim(),
                      description: associationForm.description.trim(),
                      address: associationForm.address.trim(),
                      email: associationForm.email.trim(),
                      phone: associationForm.phone.trim(),
                    },
                  });
                }}
              >
                <div className="profile-grid">
                  <div>
                    <span className="profile-label">Nom de l'association</span>
                    <input
                      value={associationForm.name}
                      onChange={(e) => setAssociationForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nom"
                      disabled={!isEditingAssociation}
                    />
                  </div>
                  <div>
                    <span className="profile-label">Email public</span>
                    <input
                      value={associationForm.email}
                      onChange={(e) => setAssociationForm((prev) => ({ ...prev, email: e.target.value }))}
                      type="email"
                      placeholder="Email"
                      disabled={!isEditingAssociation}
                    />
                  </div>
                  <div>
                    <span className="profile-label">Adresse</span>
                    <input
                      value={associationForm.address}
                      onChange={(e) => setAssociationForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Adresse"
                      disabled={!isEditingAssociation}
                    />
                  </div>
                  <div>
                    <span className="profile-label">Telephone</span>
                    <input
                      value={associationForm.phone}
                      onChange={(e) => setAssociationForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Numero"
                      disabled={!isEditingAssociation}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span className="profile-label">Description</span>
                    <textarea
                      value={associationForm.description}
                      onChange={(e) => setAssociationForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Description de votre mission"
                      disabled={!isEditingAssociation}
                      rows={4}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span className="profile-label">Compte de connexion</span>
                    <p>{profile.email}</p>
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="ghost" type="button" onClick={() => setIsEditingAssociation(true)} disabled={isEditingAssociation}>
                    Modifier
                  </button>
                  <button className="solid" type="submit" disabled={!isEditingAssociation}>
                    Enregistrer
                  </button>
                </div>
              </form>
            </article>

            <article className="card association-panel">
              <h3>Résumé</h3>
              <div className="detail-stack">
                <div className="mini-card">
                  <h3>Missions publiees</h3>
                  <p>{associationOffers.length} mission(s) en ligne</p>
                </div>
                <div className="mini-card">
                  <h3>Demandes recues</h3>
                  <p>{volunteerApplications.length} candidature(s) a traiter</p>
                </div>
                <div className="mini-card">
                  <h3>Avis benevoles</h3>
                  <p>{volunteerReviews.length} avis publie(s)</p>
                </div>
              </div>
            </article>
          </div>
        )}

        {associationTab === 'missions' && (
          <article className="card association-panel">
            <h3>Missions publiees</h3>
            <div className="detail-stack">
              {associationOffers.length ? associationOffers.map((offer) => (
                <div className="offer-card compact" key={offer.id}>
                  <div className="offer-head">
                    <h3>{offer.title}</h3>
                    <span className="badge">{offer.location}</span>
                  </div>
                  <p>{offer.description}</p>
                  <small>Du {formatDate(offer.startDate)} au {formatDate(offer.endDate)}</small>
                </div>
              )) : <p className="muted">Aucune mission publiee pour le moment.</p>}
            </div>
          </article>
        )}

        {associationTab === 'demandes' && (
          <article className="card association-panel">
            <h3>Demandes de benevolat</h3>
            <div className="detail-stack">
              {volunteerApplications.length ? volunteerApplications.map((application) => (
                <div className="application-card" key={application.id}>
                  <div className="offer-head">
                    <Link className="badge inline-badge-link" to={`/benevolat`}>
                      {application.offer?.title || 'Offre de benevolat'}
                    </Link>
                    <span className="badge">{formatDate(application.createdAt)}</span>
                  </div>
                  <p>{application.message || 'Aucun message joint a cette candidature.'}</p>
                  <small>{application.user?.username || 'Benevole'} a postule</small>
                </div>
              )) : <p className="muted">Aucune candidature recu pour le moment.</p>}
            </div>
          </article>
        )}

        {associationTab === 'avis' && (
          <article className="card association-panel">
            <h3>Avis laisses sur des benevoles</h3>
            <div className="cards-grid wide association-reviews-grid">
              {volunteerReviews.length ? volunteerReviews.map((review) => (
                <article className="offer-card review-card" key={review.id}>
                  <div className="offer-head">
                    <span className="badge">{review.user?.username || 'Benevole'}</span>
                    <span className="badge">Note: {review.rating}/5</span>
                  </div>
                  <p>{review.comment || 'Pas de commentaire.'}</p>
                  <small>{formatDate(review.createdAt)}</small>
                </article>
              )) : (
                <article className="offer-card">
                  <p>Vous n'avez encore evalue aucun benevole.</p>
                </article>
              )}
            </div>
          </article>
        )}
      </section>
    );
  }

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">PROFIL</p>
        <h2>Mon profil</h2>
        <p>Consultez vos informations personnelles et les avis recus.</p>
      </div>

      <article className="card profile-card">
        <form
          className="profile-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isEditing || !isDirty) {
              return;
            }

            try {
              await onSaveProfile({
                firstName: toOptionalString(form.firstName),
                lastName: toOptionalString(form.lastName),
                age: form.age.trim() ? Number(form.age) : undefined,
                address: toOptionalString(form.address),
                city: toOptionalString(form.city),
                postalCode: toOptionalString(form.postalCode),
                phone: toOptionalString(form.phone),
              });
              setIsEditing(false);
            } catch {
              // Keep edit mode if API save failed.
            }
          }}
        >
          <h3>Mes informations personnelles</h3>
          <div className="profile-grid">
            <div>
              <span className="profile-label">Nom</span>
              <input
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Nom"
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="profile-label">Prenom</span>
              <input
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="Prenom"
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="profile-label">Age</span>
              <input
                value={form.age}
                onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                type="number"
                min="13"
                max="120"
                placeholder="Age"
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="profile-label">Adresse</span>
              <input
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Adresse"
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="profile-label">Ville</span>
              <input
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="Ville"
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="profile-label">Code postal</span>
              <input
                value={form.postalCode}
                onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                placeholder="Code postal"
                maxLength={5}
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="profile-label">Telephone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Numero de telephone"
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="profile-label">Email</span>
              <p>{profile?.email || '-'}</p>
            </div>
          </div>
          <div className="profile-actions">
            <button className="ghost" type="button" onClick={() => setIsEditing(true)} disabled={isEditing}>
              Modifier
            </button>
            <button className="solid" type="submit" disabled={!isEditing || !isDirty}>
              Enregistrer
            </button>
          </div>
        </form>
      </article>

      <section className="page-block">
        <div className="section-header-block">
          <h2>Avis des associations</h2>
          <p>{reviews.length} avis recus</p>
        </div>

        <div className="cards-grid wide">
          {reviews.map((review) => (
            <article className="offer-card" key={review.id}>
              <div className="offer-head">
                <Link className="badge inline-badge-link" to={`/associations/${review.association?.id}`}>
                  {review.association?.name || 'Association'}
                </Link>
                <span className="badge">Note: {review.rating}/5</span>
              </div>
              <p>{review.comment || 'Pas de commentaire.'}</p>
              <small>{formatDate(review.createdAt)}</small>
            </article>
          ))}
          {reviews.length === 0 && (
            <article className="offer-card">
              <p>Aucun avis recu pour le moment.</p>
            </article>
          )}
        </div>
      </section>
    </section>
  );
}
