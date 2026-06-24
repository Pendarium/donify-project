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
import OffersPage from './pages/OffersPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ text: '', error: false });
  const [token, setTokenState] = useState(getToken());
  const [associations, setAssociations] = useState([]);
  const [offers, setOffers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);

  const role = useMemo(() => decodeRole(token), [token]);
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (!token || role !== 'user') {
      setFavorites([]);
      setHistory([]);
      setApplications([]);
      return;
    }

    loadFavorites();
    loadHistory();
    loadApplications();
  }, [token, role]);

  const setOk = (text) => setStatus({ text, error: false });
  const setErr = (text) => setStatus({ text, error: true });

  const handleRegister = async (payload) => {
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setToken(data.accessToken);
      setTokenState(data.accessToken);
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
      navigate('/');
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
    setApplications([]);
    setOk('Logout effectue');
    navigate('/');
  };

  const loadProfile = async () => {
    try {
      const data = await api('/users/profile');
      setProfile(data || null);
      setOk(`Profil charge: ${data ? data.email : 'non trouve'}`);
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
      setOk(`Associations chargees: ${items.length}`);
    } catch (error) {
      setErr(`Associations KO: ${error.message}`);
    }
  };

  const loadOffers = async (city = '') => {
    try {
      const query = city.trim() ? `?city=${encodeURIComponent(city.trim())}` : '';
      const data = await api(`/volunteer-offers${query}`);
      const items = Array.isArray(data) ? data : data.data || [];
      setOffers(items);
      setOk(`Offres chargees: ${items.length}`);
    } catch (error) {
      setErr(`Offres KO: ${error.message}`);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await api('/users/favorites');
      const items = Array.isArray(data) ? data : data.data || [];
      setFavorites(items);
      setOk(`Favoris charges: ${items.length}`);
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
      setOk(`Historique charge: ${items.length}`);
    } catch (error) {
      setErr(`Historique KO: ${error.message}`);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await api('/users/applications');
      const items = Array.isArray(data) ? data : data.data || [];
      setApplications(items);
      setOk(`Candidatures chargees: ${items.length}`);
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

  return (
    <AppLayout
      isAuthenticated={isAuthenticated}
      role={role}
      onGoLogin={() => navigate('/auth/login')}
      onGoSignup={() => navigate('/auth/signup')}
      onGoProfile={() => navigate('/profile')}
      onLogout={handleLogout}
    >
      {status.text && <div className={`status ${status.error ? 'error' : ''}`}>{status.text}</div>}

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
                applicationIds={applications.map((application) => application.offerId)}
                onSubmitApplication={submitApplication}
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
          path="/historique"
          element={isAuthenticated && role === 'user'
            ? <HistoryPage history={history} onLoadHistory={loadHistory} />
            : <Navigate to="/" replace />}
        />
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
          element={isAuthenticated ? <ProfilePage profile={profile} onLoadProfile={loadProfile} onSaveProfile={saveProfile} /> : <Navigate to="/" replace />}
        />
        <Route path="/auth" element={<Navigate to={isAuthenticated ? "/profile" : "/"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <p className="footnote">
        Docs API: <a href="http://localhost:3000/api/docs">http://localhost:3000/api/docs</a>
      </p>
    </AppLayout>
  );
}
