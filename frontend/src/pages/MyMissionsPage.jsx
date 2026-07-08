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
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    if (now > endOfDay) {
      return 'Terminee';
    }

    if (now >= start && now <= end) {
      return 'En cours';
    }

    if (now > end && now <= endOfDay) {
      return 'En cours';
    }

    if (now < start) {
      return 'Acceptee';
    }
  }

  return 'Acceptee';
}

function canCancelMission(row) {
  if (!row?.historyEntryId) {
    return false;
  }

  const now = new Date();
  const end = row.endDate ? new Date(row.endDate) : null;

  if (end && !Number.isNaN(end.getTime())) {
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    if (now > endOfDay) {
      return false;
    }
  }

  if (row.status === 'Terminee') {
    return false;
  }

  return row.status === 'Acceptee' || row.status === 'En cours';
}

function isPastMission(startDate, endDate, fallbackDate) {
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const fallback = fallbackDate ? new Date(fallbackDate) : null;

  if (end && !Number.isNaN(end.getTime())) {
    return end < now;
  }

  if (start && !Number.isNaN(start.getTime())) {
    return start < now;
  }

  if (fallback && !Number.isNaN(fallback.getTime())) {
    return fallback < now;
  }

  return false;
}

function isYesterday(value) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    date.getFullYear() === yesterday.getFullYear()
    && date.getMonth() === yesterday.getMonth()
    && date.getDate() === yesterday.getDate()
  );
}

function extractRejectedHistoryReason(note) {
  const prefix = '__REJECTED_HISTORY__:';
  if (!note || !note.startsWith(prefix)) {
    return null;
  }

  return note.slice(prefix.length).trim() || 'Candidature refusee par l\'association.';
}

function extractCancelledHistoryReason(note) {
  const prefix = '__CANCELLED_BY_VOLUNTEER__:';
  if (!note || !note.startsWith(prefix)) {
    return null;
  }

  return note.slice(prefix.length).trim() || 'Mission annulee par le benevole.';
}

export default function MyMissionsPage({
  history = [],
  favorites = [],
  applications = [],
  onLoadHistory,
  onLoadFavorites,
  onLoadApplications,
  onRemoveFavorite,
  onCancelMission,
}) {
  const [removingOfferId, setRemovingOfferId] = useState('');
  const [activeRejectedRow, setActiveRejectedRow] = useState(null);
  const [activeCancelRow, setActiveCancelRow] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingId, setCancellingId] = useState('');

  useEffect(() => {
    onLoadHistory?.();
    onLoadFavorites?.();
    onLoadApplications?.();
  }, []);

  const rows = useMemo(() => {
    const acceptedRows = history
      .filter((entry) => !extractRejectedHistoryReason(entry.note) && !extractCancelledHistoryReason(entry.note))
      .map((entry) => {
      const offer = entry.offer || {};
      const status = getMissionStatus(offer.startDate, offer.endDate);
      const dateValue = offer.startDate || entry.completedAt || null;

      return {
        id: `accepted-${entry.id}`,
        title: offer.title || 'Mission benevole',
        status,
        offerDeleted: Boolean(offer.deletedAt),
        dateValue,
        startDate: offer.startDate || null,
        endDate: offer.endDate || null,
        dateLabel: formatDate(dateValue),
        durationHours: offer.durationHours || '-',
        location: offer.location || '-',
        associationName: offer.association?.name || 'Voir la fiche',
        associationId: offer.associationId || null,
        offerId: offer.id || null,
        historyEntryId: entry.id,
        canRemoveFavorite: false,
      };
      });

    const rejectedRows = history
      .map((entry) => {
        const rejectionReason = extractRejectedHistoryReason(entry.note);

        if (!rejectionReason) {
          return null;
        }

        const offer = entry.offer || {};

        return {
          id: `history-rejected-${entry.id}`,
          title: offer.title || 'Mission benevole',
          status: 'Refusee',
          offerDeleted: Boolean(offer.deletedAt),
          dateValue: entry.completedAt || entry.createdAt || null,
          startDate: offer.startDate || null,
          endDate: offer.endDate || null,
          dateLabel: formatDate(entry.completedAt || entry.createdAt),
          durationHours: offer.durationHours || '-',
          location: offer.location || '-',
          associationName: offer.association?.name || 'Voir la fiche',
          associationId: offer.associationId || null,
          offerId: offer.id || null,
          canRemoveFavorite: false,
          rejectionReason,
        };
      })
      .filter(Boolean);

    const cancelledRows = history
      .map((entry) => {
        const cancellationReason = extractCancelledHistoryReason(entry.note);

        if (!cancellationReason) {
          return null;
        }

        const offer = entry.offer || {};

        return {
          id: `history-cancelled-${entry.id}`,
          title: offer.title || 'Mission benevole',
          status: 'Annulee',
          offerDeleted: Boolean(offer.deletedAt),
          dateValue: entry.completedAt || entry.createdAt || null,
          startDate: offer.startDate || null,
          endDate: offer.endDate || null,
          dateLabel: formatDate(entry.completedAt || entry.createdAt),
          durationHours: offer.durationHours || '-',
          location: offer.location || '-',
          associationName: offer.association?.name || 'Voir la fiche',
          associationId: offer.associationId || null,
          offerId: offer.id || null,
          historyEntryId: entry.id,
          canRemoveFavorite: false,
          cancellationReason,
        };
      })
      .filter(Boolean);

    const pendingApplicationRows = applications
      .filter((application) => application.status === 'pending')
      .map((application) => {
        const offer = application.offer || {};

        return {
          id: `application-pending-${application.id}`,
          title: offer.title || 'Mission benevole',
          status: 'En attente',
          offerDeleted: Boolean(offer.deletedAt),
          dateValue: application.createdAt || null,
          startDate: offer.startDate || null,
          endDate: offer.endDate || null,
          dateLabel: formatDate(application.createdAt),
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
        offerDeleted: Boolean(offer.deletedAt),
        dateValue: offer.startDate || null,
        startDate: offer.startDate || null,
        endDate: offer.endDate || null,
        dateLabel: formatDate(offer.startDate),
        durationHours: offer.durationHours || '-',
        location: offer.location || '-',
        associationName: offer.association?.name || 'Voir la fiche',
        associationId: offer.associationId || null,
        offerId: offer.id || null,
        canRemoveFavorite: true,
      };
    });

    return [...acceptedRows, ...favoriteRows, ...pendingApplicationRows, ...rejectedRows, ...cancelledRows].sort((a, b) => {
      const aDate = a.dateValue ? new Date(a.dateValue).getTime() : 0;
      const bDate = b.dateValue ? new Date(b.dateValue).getTime() : 0;
      return bDate - aDate;
    });
  }, [history, favorites, applications]);

  const counts = useMemo(() => {
    return rows.reduce((acc, row) => {
      acc.total += 1;
      if (row.status === 'En cours') acc.enCours += 1;
      if (row.status === 'Acceptee') acc.acceptees += 1;
      if (row.status === 'En attente') acc.enAttente += 1;
      if (row.status === 'Terminee') acc.terminees += 1;
      if (row.status === 'Favori') acc.favoris += 1;
      if (row.status === 'Refusee') acc.refusees += 1;
      if (row.status === 'Annulee') acc.annulees += 1;
      return acc;
    }, { total: 0, enCours: 0, acceptees: 0, enAttente: 0, terminees: 0, favoris: 0, refusees: 0, annulees: 0 });
  }, [rows]);

  const currentRows = useMemo(() => rows.filter((row) => row.status !== 'Refusee' && row.status !== 'Annulee' && row.status !== 'Favori' && !row.offerDeleted), [rows]);

  const favoriteRows = useMemo(
    () => rows.filter((row) => row.status === 'Favori' && !row.offerDeleted),
    [rows],
  );

  const historicalRows = useMemo(() => {
    return rows.filter((row) => {
      if (row.status === 'Refusee') {
        return true;
      }

      if (row.status === 'Annulee') {
        return true;
      }

      if (row.offerDeleted) {
        return true;
      }

      if (row.status !== 'Acceptee') {
        return false;
      }

      const referenceDate = row.endDate || row.startDate || row.dateValue;

      if (!isYesterday(referenceDate)) {
        return false;
      }

      return isPastMission(row.startDate, row.endDate, row.dateValue);
    });
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

  const closeRejectedModal = () => {
    setActiveRejectedRow(null);
  };

  const openCancelModal = (row) => {
    if (!row?.historyEntryId || cancellingId) {
      return;
    }

    setActiveCancelRow(row);
    setCancelReason('');
  };

  const closeCancelModal = () => {
    if (cancellingId) {
      return;
    }

    setActiveCancelRow(null);
    setCancelReason('');
  };

  const handleCancelMission = async () => {
    if (!activeCancelRow?.historyEntryId || cancellingId) {
      return;
    }

    try {
      setCancellingId(activeCancelRow.historyEntryId);
      await onCancelMission?.(activeCancelRow.historyEntryId, cancelReason);
      closeCancelModal();
    } finally {
      setCancellingId('');
    }
  };

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">MES MISSIONS</p>
        <h2>Suivi de mes missions</h2>
        <p>
          {counts.total} missions au total - {counts.enCours} en cours - {counts.acceptees} acceptees - {counts.enAttente} en attente - {counts.terminees} terminees - {counts.favoris} en favoris - {counts.refusees} refusees - {counts.annulees} annulees
        </p>
      </div>

      <div className="section-header-block">
        <p className="kicker">MISSIONS EN COURS</p>
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
              {currentRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>
                    <span className={`badge ${row.status === 'En cours' ? 'success' : row.status === 'Favori' || row.status === 'Refusee' || row.status === 'Annulee' || row.status === 'En attente' ? 'warning' : ''}`}>
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
                    ) : canCancelMission(row) ? (
                      <button
                        className="danger"
                        type="button"
                        onClick={() => openCancelModal(row)}
                      >
                        Annuler
                      </button>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentRows.length === 0 && (
          <div className="empty-state-card" style={{ marginTop: '12px' }}>
            <p>Aucune mission pour le moment.</p>
            <Link className="solid action-link" to="/benevolat">Explorer les offres</Link>
          </div>
        )}
      </article>

      <section className="page-block">
        <div className="section-header-block">
          <p className="kicker">FAVORIS</p>
          <p>{favoriteRows.length} missions en favoris</p>
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
                {favoriteRows.map((row) => (
                  <tr key={`favorite-table-${row.id}`}>
                    <td>{row.title}</td>
                    <td>
                      <span className="badge warning">Favori</span>
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
                      <button
                        className="ghost"
                        type="button"
                        disabled={removingOfferId === row.offerId}
                        onClick={() => handleRemoveFavorite(row.offerId)}
                      >
                        {removingOfferId === row.offerId ? 'Retrait...' : 'Retirer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {favoriteRows.length === 0 && (
            <div className="empty-state-card" style={{ marginTop: '12px' }}>
              <p>Aucune mission en favori pour le moment.</p>
            </div>
          )}
        </article>
      </section>

      <section className="page-block">
        <div className="section-header-block">
          <p className="kicker">HISTORIQUE</p>
          <p>{historicalRows.length} missions archivees</p>
        </div>

        <article className="card missions-table-card">
          <div className="missions-table-wrap">
            <table className="missions-table">
              <thead>
                <tr>
                  <th>Mission</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Association</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {historicalRows.map((row) => (
                  <tr key={`history-${row.id}`}>
                    <td>{row.title}</td>
                    <td>
                      <span className={`badge ${row.status === 'Refusee' ? 'warning' : ''}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.dateLabel}</td>
                    <td>
                      {row.associationId
                        ? <Link className="inline-link association-link" to={`/associations/${row.associationId}`}>{row.associationName}</Link>
                        : row.associationName}
                    </td>
                    <td>
                      {row.rejectionReason ? (
                        <button
                          className="danger"
                          type="button"
                          onClick={() => setActiveRejectedRow(row)}
                        >
                          Voir refus
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {historicalRows.length === 0 && (
            <div className="empty-state-card" style={{ marginTop: '12px' }}>
              <p>Aucune mission passee, refusee ou annulee pour le moment.</p>
            </div>
          )}
        </article>
      </section>

      {activeRejectedRow?.rejectionReason && (
        <div className="modal-backdrop" role="presentation" onClick={closeRejectedModal}>
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rejected-mission-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="kicker">CANDIDATURE</p>
                <h3 id="rejected-mission-modal-title">Candidature refusee</h3>
              </div>
              <button className="ghost modal-close" type="button" onClick={closeRejectedModal}>
                Fermer
              </button>
            </div>

            <p className="modal-copy">
              <strong>Mission :</strong> {activeRejectedRow.title}
            </p>
            <p className="modal-copy">
              <strong>Motif du refus :</strong> {activeRejectedRow.rejectionReason}
            </p>
          </div>
        </div>
      )}

      {activeCancelRow && (
        <div className="modal-backdrop" role="presentation" onClick={closeCancelModal}>
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-mission-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="kicker">ANNULATION</p>
                <h3 id="cancel-mission-modal-title">Annuler une mission en cours</h3>
              </div>
              <button className="ghost modal-close" type="button" onClick={closeCancelModal} disabled={Boolean(cancellingId)}>
                Fermer
              </button>
            </div>

            <p className="modal-copy">
              <strong>Mission :</strong> {activeCancelRow.title}
            </p>

            <textarea
              className="modal-textarea"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Indiquez le motif de votre annulation..."
              rows={5}
              maxLength={280}
            />

            <div className="modal-footer">
              <small>{cancelReason.length}/280</small>
              <div className="modal-actions">
                <button className="ghost" type="button" onClick={closeCancelModal} disabled={Boolean(cancellingId)}>
                  Annuler
                </button>
                <button className="danger" type="button" onClick={handleCancelMission} disabled={Boolean(cancellingId)}>
                  {cancellingId ? 'Annulation...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
