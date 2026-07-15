import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api, clearToken, decodeRole, getToken, setToken } from './api';
import AppLayout from './layout/AppLayout';
import AssociationsPage from './pages/AssociationsPage';
import AssociationDetailPage from './pages/AssociationDetailPage';
import AuthPage from './pages/AuthPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import MyMissionsPage from './pages/MyMissionsPage';
import MyVolunteersPage from './pages/MyVolunteersPage';
import OffersPage from './pages/OffersPage';
import ProfilePage from './pages/ProfilePage';
import VolunteerProfilePage from './pages/VolunteerProfilePage';

export default function App() {
  const navigate = useNavigate();
  const [token, setTokenState] = useState(getToken());
  const [associations, setAssociations] = useState([]);
  const [offers, setOffers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);

  const role = useMemo(() => decodeRole(token), [token]);
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    const isAssociation = isAuthenticated && role === 'association';
    document.body.classList.toggle('role-association', isAssociation);

    return () => {
      document.body.classList.remove('role-association');
    };
  }, [isAuthenticated, role]);

  useEffect(() => {
    if (!token || role !== 'user') {
      setFavorites([]);
      setHistory([]);
      setBookings([]);
      setApplications([]);
      return;
    }

    loadFavorites();
    loadHistory();
    loadBookings();
    loadApplications();
  }, [token, role]);

  // Request feedback is intentionally hidden from the UI.
  const setOk = () => {};
  const setErr = () => {};

  const handleRegister = async (payload) => {
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      let accessToken = data?.accessToken || '';
      if (!accessToken) {
        // Fallback: some backend variants return user info without token on register.
        const loginData = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: payload.email, password: payload.password }),
        });
        accessToken = loginData?.accessToken || '';
      }

      if (!accessToken) {
        throw new Error('Aucun token recu apres inscription');
      }

      setToken(accessToken);
      setTokenState(accessToken);
      if (payload.role === 'association') {
        await loadProfile();
        setOk('Association creee avec les infos RNA chargees');
        navigate('/profile');
        return;
      }
      setOk('Inscription OK');
      navigate('/');
    } catch (error) {
      setErr(`Inscription KO: ${error.message}`);
    }
  };

  const handleLogin = async (payload) => {
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setToken(data.accessToken);
      setTokenState(data.accessToken);
      setOk('Connexion OK');
      navigate('/profile');
    } catch (error) {
      setErr(`Connexion KO: ${error.message}`);
    }
  };

  const handleLogout = () => {
    clearToken();
    setTokenState('');
    setProfile(null);
    setFavorites([]);
    setHistory([]);
    setBookings([]);
    setApplications([]);
    setOk('Deconnexion effectuee');
    navigate('/');
  };

  const handleDeleteAccount = async (confirmationWord) => {
    try {
      await api('/users/profile', {
        method: 'DELETE',
        body: JSON.stringify({ confirmationWord }),
      });

      clearToken();
      setTokenState('');
      setProfile(null);
      setFavorites([]);
      setHistory([]);
      setBookings([]);
      setApplications([]);
      setOffers([]);
      setOk('Compte supprime avec succes');
      navigate('/');
    } catch (error) {
      setErr(`Suppression compte KO: ${error.message}`);
      throw error;
    }
  };

  const loadProfile = async () => {
    try {
      const data = await api('/users/profile');
      setProfile(data || null);
    } catch (error) {
      setErr(`Profil KO: ${error.message}`);
    }
  };

  const saveProfile = async (payload) => {
    try {
      if (payload.associationData && profile?.managedAssociation?.id) {
        await api(`/associations/${profile.managedAssociation.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload.associationData),
        });
        setOk('Infos association mises a jour');
        await loadProfile();
        return;
      }

      const data = await api('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setProfile(data || null);
      setOk('Profil mis a jour');
      return data;
    } catch (error) {
      setErr(`Mise a jour profil KO: ${error.message}`);
      throw error;
    }
  };

  const loadAssociations = async () => {
    try {
      const data = await api('/associations');
      const items = Array.isArray(data) ? data : data.data || [];
      setAssociations(items);
    } catch (error) {
      setErr(`Associations KO: ${error.message}`);
    }
  };

  const loadOffers = async (city = '') => {
    try {
      if (role === 'association') {
        const associationProfile = await api('/users/profile');
        setProfile(associationProfile || null);

        const associationOffers = associationProfile?.managedAssociation?.offers || [];
        const activeAssociationOffers = associationOffers.filter((offer) => !offer?.deletedAt);
        const normalizedCity = city.trim().toLowerCase();
        const items = normalizedCity
          ? activeAssociationOffers.filter((offer) => (offer.location || '').toLowerCase().includes(normalizedCity))
          : activeAssociationOffers;

        setOffers(items);
        return;
      }

      const query = city.trim() ? `?city=${encodeURIComponent(city.trim())}` : '';
      const data = await api(`/volunteer-offers${query}`);
      const items = Array.isArray(data) ? data : data.data || [];
      setOffers(items);
    } catch (error) {
      setErr(`Offres KO: ${error.message}`);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await api('/users/favorites');
      const items = Array.isArray(data) ? data : data.data || [];
      setFavorites(items);
    } catch (error) {
      setErr(`Favoris KO: ${error.message}`);
    }
  };

  const toggleFavorite = async (offerId, isFavorite) => {
    try {
      if (isFavorite) {
        await api(`/users/favorites/${offerId}`, { method: 'DELETE' });
      } else {
        await api(`/users/favorites/${offerId}`, { method: 'POST' });
      }
      await loadFavorites();
      setOk(isFavorite ? 'Favori retire' : 'Offre ajoutee aux favoris');
    } catch (error) {
      setErr(`Favoris KO: ${error.message}`);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api('/users/history');
      const items = Array.isArray(data) ? data : data.data || [];
      setHistory(items);
    } catch (error) {
      setErr(`Calendrier KO: ${error.message}`);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await api('/users/bookings');
      const items = Array.isArray(data) ? data : data.data || [];
      setBookings(items);
    } catch (error) {
      setErr(`Calendrier KO: ${error.message}`);
    }
  };

  const createBooking = async (payload) => {
    try {
      const created = await api('/users/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setBookings((prev) => [created, ...prev]);
      setOk('Reservation ajoutee au calendrier');
    } catch (error) {
      setErr(`Ajout reservation KO : ${error.message}`);
    }
  };

  const deleteBooking = async (bookingId) => {
    try {
      await api(`/users/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      setBookings((prev) => prev.filter((item) => item.id !== bookingId));
      setOk('Reservation supprimee');
    } catch (error) {
      setErr(`Suppression reservation KO : ${error.message}`);
    }
  };

  const cancelMission = async (historyEntryId, reason) => {
    try {
      await api(`/users/history/${historyEntryId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      await loadHistory();
      await loadOffers();
      setOk('Mission annulee');
    } catch (error) {
      setErr(`Annulation mission KO: ${error.message}`);
      throw error;
    }
  };

  const loadApplications = async () => {
    try {
      const data = await api('/users/applications');
      const items = Array.isArray(data) ? data : data.data || [];
      setApplications(items);
    } catch (error) {
      setErr(`Candidatures KO: ${error.message}`);
    }
  };

  const submitApplication = async (offerId, message) => {
    try {
      await api(`/users/applications/${offerId}`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      await loadApplications();
      setOk('Candidature envoyee');
    } catch (error) {
      setErr(`Candidature KO: ${error.message}`);
    }
  };

  const validateApplicationParticipation = async (applicationId) => {
    try {
      await api(`/users/applications/${applicationId}/validate`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      await loadOffers();
      setOk('Participation validee');
    } catch (error) {
      setErr(`Validation candidature KO: ${error.message}`);
    }
  };

  const rejectApplicationParticipation = async (applicationId, reason) => {
    try {
      await api(`/users/applications/${applicationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      await loadOffers();
      setOk('Candidature refusee');
    } catch (error) {
      setErr(`Refus candidature KO: ${error.message}`);
      throw error;
    }
  };

  const createOffer = async (offerData) => {
    try {
      const associationId = profile?.managedAssociation?.id;
      if (!associationId) {
        setErr('Aucune association liee a votre compte');
        return;
      }
      await api('/volunteer-offers', {
        method: 'POST',
        body: JSON.stringify({ ...offerData, associationId }),
      });
      await loadOffers();
      setOk('Offre de benevolat creee');
    } catch (error) {
      setErr(`Creation offre KO: ${error.message}`);
    }
  };

  const deleteOffer = async (offerId) => {
    try {
      await api(`/volunteer-offers/${offerId}`, {
        method: 'DELETE',
      });

      // Optimistic UI update: remove the deleted offer immediately from current state.
      setOffers((prev) => prev.filter((offer) => offer.id !== offerId));
      setProfile((prev) => {
        if (!prev?.managedAssociation?.offers) {
          return prev;
        }

        return {
          ...prev,
          managedAssociation: {
            ...prev.managedAssociation,
            offers: prev.managedAssociation.offers.filter((offer) => offer.id !== offerId),
          },
        };
      });

      await loadOffers();
      setOk('Offre supprimee');
    } catch (error) {
      setErr(`Suppression offre KO: ${error.message}`);
    }
  };

  return (
    <AppLayout
      isAuthenticated={isAuthenticated}
      role={role}
      onGoLogin={() => navigate('/auth/login')}
      onGoSignup={() => navigate('/auth/signup')}
      onGoProfile={() => navigate('/profile')}
      onLogout={handleLogout}
    >
      <Routes>
        <Route
          path="/"
          element={<HomePage isAuthenticated={isAuthenticated} onGoLogin={() => navigate('/auth/login')} onGoSignup={() => navigate('/auth/signup')} />}
        />
        <Route
          path="/associations"
          element={isAuthenticated
            ? <AssociationsPage associations={associations} onLoadAssociations={loadAssociations} />
            : <Navigate to="/" replace />}
        />
        <Route
          path="/associations/:associationId"
          element={isAuthenticated ? <AssociationDetailPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/benevolat"
          element={isAuthenticated
            ? (
              <OffersPage
                offers={offers}
                onLoadOffers={loadOffers}
                isAuthenticated={isAuthenticated}
                role={role}
                favoriteIds={favorites.map((favorite) => favorite.offerId)}
                onToggleFavorite={toggleFavorite}
                applicationIds={applications.filter((application) => application.status !== 'rejected').map((application) => application.offerId)}
                onSubmitApplication={submitApplication}
                onCreateOffer={createOffer}
                onDeleteOffer={deleteOffer}
              />
            )
            : <Navigate to="/" replace />}
        />
        <Route
          path="/favoris"
          element={isAuthenticated && role === 'user'
            ? <FavoritesPage favorites={favorites} onLoadFavorites={loadFavorites} onRemoveFavorite={(offerId) => toggleFavorite(offerId, true)} />
            : <Navigate to="/" replace />}
        />
        <Route
          path="/calendrier"
          element={isAuthenticated && role === 'user'
            ? <HistoryPage
              history={history}
              applications={applications}
              bookings={bookings}
              onLoadHistory={loadHistory}
              onLoadApplications={loadApplications}
              onLoadBookings={loadBookings}
              onCreateBooking={createBooking}
              onDeleteBooking={deleteBooking}
            />
            : <Navigate to="/" replace />}
        />
        <Route
          path="/mes-missions"
          element={isAuthenticated && role === 'user'
            ? <MyMissionsPage
              history={history}
              favorites={favorites}
              applications={applications}
              onLoadHistory={loadHistory}
              onLoadFavorites={loadFavorites}
              onLoadApplications={loadApplications}
              onRemoveFavorite={(offerId) => toggleFavorite(offerId, true)}
              onCancelMission={cancelMission}
            />
            : <Navigate to="/" replace />}
        />
        <Route
          path="/mes-benevoles"
          element={isAuthenticated && role === 'association'
            ? <MyVolunteersPage
              profile={profile}
              onLoadProfile={loadProfile}
              onValidateApplication={validateApplicationParticipation}
              onRejectApplication={rejectApplicationParticipation}
            />
            : <Navigate to="/" replace />}
        />
        <Route
          path="/benevoles/:volunteerId"
          element={isAuthenticated && role === 'association'
            ? <VolunteerProfilePage />
            : <Navigate to="/" replace />}
        />
        <Route path="/historique" element={<Navigate to="/calendrier" replace />} />
        <Route
          path="/auth/login"
          element={(
            <AuthPage
              mode="login"
              token={token}
              role={role}
              onRegister={handleRegister}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onProfile={() => navigate('/profile')}
            />
          )}
        />
        <Route
          path="/auth/signup"
          element={(
            <AuthPage
              mode="signup"
              token={token}
              role={role}
              onRegister={handleRegister}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onProfile={() => navigate('/profile')}
            />
          )}
        />
        <Route
          path="/profile"
          element={isAuthenticated
            ? <ProfilePage profile={profile} onLoadProfile={loadProfile} onSaveProfile={saveProfile} onDeleteAccount={handleDeleteAccount} />
            : <Navigate to="/" replace />}
        />
        <Route path="/auth" element={<Navigate to={isAuthenticated ? "/profile" : "/"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
