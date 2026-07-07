import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR');
}

export default function VolunteerProfilePage() {
  const { volunteerId } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadVolunteer() {
      setLoading(true);
      setError('');

      try {
        const data = await api(`/users/volunteers/${volunteerId}`);
        if (active) {
          setProfile(data);
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

    loadVolunteer();

    return () => {
      active = false;
    };
  }, [volunteerId]);

  if (loading) {
    return (
      <section className="page-block">
        <div className="section-header-block">
          <p className="kicker">BENEVOLE</p>
          <h2>Chargement du profil...</h2>
        </div>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="page-block">
        <div className="section-header-block">
          <p className="kicker">BENEVOLE</p>
          <h2>Profil indisponible</h2>
          <p>{error || 'Benevole introuvable.'}</p>
        </div>
        <Link className="ghost action-link back-link" to="/mes-benevoles">Retour a mes benevoles</Link>
      </section>
    );
  }

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">BENEVOLE</p>
        <h2>{profile.username}</h2>
        <p>Consultez le profil du benevole avant de valider sa candidature.</p>
      </div>

      <article className="card profile-card">
        <div className="profile-grid">
          <div>
            <span className="profile-label">Nom</span>
            <p>{profile.lastName || '-'}</p>
          </div>
          <div>
            <span className="profile-label">Prenom</span>
            <p>{profile.firstName || '-'}</p>
          </div>
          <div>
            <span className="profile-label">Age</span>
            <p>{profile.age ?? '-'}</p>
          </div>
          <div>
            <span className="profile-label">Adresse</span>
            <p>{profile.address || '-'}</p>
          </div>
          <div>
            <span className="profile-label">Ville</span>
            <p>{profile.city || '-'}</p>
          </div>
          <div>
            <span className="profile-label">Code postal</span>
            <p>{profile.postalCode || '-'}</p>
          </div>
          <div>
            <span className="profile-label">Telephone</span>
            <p>{profile.phone || '-'}</p>
          </div>
          <div>
            <span className="profile-label">Email</span>
            <p>{profile.email || '-'}</p>
          </div>
          <div>
            <span className="profile-label">Inscrit le</span>
            <p>{formatDate(profile.createdAt)}</p>
          </div>
        </div>
      </article>

      <section className="page-block">
        <div className="section-header-block">
          <h2>Avis recus</h2>
          <p>{profile.associationReviewsReceived?.length || 0} avis</p>
        </div>

        <div className="cards-grid wide">
          {(profile.associationReviewsReceived || []).map((review) => (
            <article className="offer-card" key={review.id}>
              <div className="offer-head">
                <span className="badge">{review.association?.name || 'Association'}</span>
                <span className="badge">Note : {review.rating}/5</span>
              </div>
              <p>{review.comment || 'Pas de commentaire.'}</p>
              <small>{formatDate(review.createdAt)}</small>
            </article>
          ))}
          {(profile.associationReviewsReceived || []).length === 0 && (
            <article className="offer-card">
              <p>Aucun avis pour le moment.</p>
            </article>
          )}
        </div>
      </section>

      <Link className="ghost action-link back-link" to="/mes-benevoles">Retour a mes benevoles</Link>
    </section>
  );
}
