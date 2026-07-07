import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR');
}

function getMissionStatus(startDate, endDate) {
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    if (now >= start && now <= end) {
      return 'En cours';
    }
  }

  return 'Acceptee';
}

export default function MyMissionsPage({ history = [], favorites = [], onLoadHistory, onLoadFavorites, onRemoveFavorite }) {
  const [removingOfferId, setRemovingOfferId] = useState('');

  useEffect(() => {
    onLoadHistory?.();
    onLoadFavorites?.();
  }, []);

  const rows = useMemo(() => {
    const acceptedRows = history.map((entry) => {
      const offer = entry.offer || {};
      const status = getMissionStatus(offer.startDate, offer.endDate);
      const dateValue = offer.startDate || entry.completedAt || null;

      return {
        id: `accepted-${entry.id}`,
        title: offer.title || 'Mission benevole',
        status,
        dateValue,
        dateLabel: formatDate(dateValue),
        durationHours: offer.durationHours || '-',
        location: offer.location || '-',
        associationName: offer.association?.name || 'Voir la fiche',
        associationId: offer.associationId || null,
        offerId: offer.id || null,
        canRemoveFavorite: false,
      };
    });

    const favoriteRows = favorites.map((favorite) => {
      const offer = favorite.offer || {};
      return {
        id: `favorite-${favorite.id}`,
        title: offer.title || 'Mission benevole',
        status: 'Favori',
        dateValue: offer.startDate || null,
        dateLabel: formatDate(offer.startDate),
        durationHours: offer.durationHours || '-',
        location: offer.location || '-',
        associationName: offer.association?.name || 'Voir la fiche',
        associationId: offer.associationId || null,
        offerId: offer.id || null,
        canRemoveFavorite: true,
      };
    });

    return [...acceptedRows, ...favoriteRows].sort((a, b) => {
      const aDate = a.dateValue ? new Date(a.dateValue).getTime() : 0;
      const bDate = b.dateValue ? new Date(b.dateValue).getTime() : 0;
      return bDate - aDate;
    });
  }, [history, favorites]);

  const counts = useMemo(() => {
    return rows.reduce((acc, row) => {
      acc.total += 1;
      if (row.status === 'En cours') acc.enCours += 1;
      if (row.status === 'Acceptee') acc.acceptees += 1;
      if (row.status === 'Favori') acc.favoris += 1;
      return acc;
    }, { total: 0, enCours: 0, acceptees: 0, favoris: 0 });
  }, [rows]);

  const handleRemoveFavorite = async (offerId) => {
    if (!offerId || removingOfferId) {
      return;
    }

    try {
      setRemovingOfferId(offerId);
      await onRemoveFavorite?.(offerId);
    } finally {
      setRemovingOfferId('');
    }
  };

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">MES MISSIONS</p>
        <h2>Suivi de mes missions</h2>
        <p>
          {counts.total} mission(s) au total - {counts.enCours} en cours - {counts.acceptees} acceptee(s) - {counts.favoris} en favori(s)
        </p>
      </div>

      <article className="card missions-table-card">
        <div className="missions-table-wrap">
          <table className="missions-table">
            <thead>
              <tr>
                <th>Mission</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Duree</th>
                <th>Lieu</th>
                <th>Association</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>
                    <span className={`badge ${row.status === 'En cours' ? 'success' : row.status === 'Favori' ? 'warning' : ''}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.dateLabel}</td>
                  <td>{row.durationHours} h</td>
                  <td>{row.location}</td>
                  <td>
                    {row.associationId
                        ? <Link className="inline-link association-link" to={`/associations/${row.associationId}`}>{row.associationName}</Link>
                      : row.associationName}
                  </td>
                  <td>
                    {row.canRemoveFavorite ? (
                      <button
                        className="ghost"
                        type="button"
                        disabled={removingOfferId === row.offerId}
                        onClick={() => handleRemoveFavorite(row.offerId)}
                      >
                        {removingOfferId === row.offerId ? 'Retrait...' : 'Retirer'}
                      </button>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="empty-state-card" style={{ marginTop: '12px' }}>
            <p>Aucune mission pour le moment.</p>
            <Link className="solid action-link" to="/benevolat">Explorer les offres</Link>
          </div>
        )}
      </article>
    </section>
  );
}
