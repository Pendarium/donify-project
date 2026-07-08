import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR');
}

function extractCancelledHistoryReason(note) {
  const prefix = '__CANCELLED_BY_VOLUNTEER__:';
  if (!note || !note.startsWith(prefix)) {
    return null;
  }

  return note.slice(prefix.length).trim() || 'Mission annulee par le benevole.';
}

function extractRejectedHistoryReason(note) {
  const prefix = '__REJECTED_HISTORY__:';
  if (!note || !note.startsWith(prefix)) {
    return null;
  }

  return note.slice(prefix.length).trim() || 'Candidature refusee.';
}

export default function MyVolunteersPage({ profile, onLoadProfile, onValidateApplication, onRejectApplication }) {
  const [validatingId, setValidatingId] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const [activeRejectApplicationId, setActiveRejectApplicationId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [activeNoteRow, setActiveNoteRow] = useState(null);

  useEffect(() => {
    onLoadProfile?.();
  }, []);

  const rows = useMemo(() => {
    const offers = profile?.managedAssociation?.offers || [];

    const pendingRows = offers.flatMap((offer) =>
      (offer.applications || []).map((application) => ({
        id: `application-${application.id}`,
        benevole: application.user?.username || 'Benevole',
        statut: 'En attente',
        mission: offer.title || 'Mission benevole',
        date: application.createdAt,
        dateLabel: formatDate(application.createdAt),
        note: application.message || 'Aucun message',
        userId: application.user?.id || null,
        applicationId: application.id,
      })),
    );

    const processedRows = offers.flatMap((offer) =>
      (offer.historyUsers || []).map((entry) => {
        const rejectionReason = extractRejectedHistoryReason(entry.note);
        const cancellationReason = extractCancelledHistoryReason(entry.note);
        const status = rejectionReason ? 'Refusee' : cancellationReason ? 'Annulee' : 'Valide';
        const note = rejectionReason || cancellationReason || entry.note || 'Aucun commentaire';

        return {
          id: `history-${entry.id}`,
          benevole: entry.user?.username || 'Benevole',
          statut: status,
          mission: offer.title || 'Mission benevole',
          date: entry.completedAt,
          dateLabel: formatDate(entry.completedAt),
          note,
          userId: entry.user?.id || null,
          applicationId: null,
          offerDeleted: Boolean(offer.deletedAt),
        };
      }),
    );

    return [...processedRows, ...pendingRows].sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });
  }, [profile]);

  const pendingRows = useMemo(() => rows.filter((row) => row.statut === 'En attente'), [rows]);
  const ongoingRows = useMemo(() => rows.filter((row) => row.statut === 'Valide' && !row.offerDeleted), [rows]);
  const processedRows = useMemo(() => rows.filter((row) => row.statut === 'Refusee' || row.statut === 'Annulee' || (row.statut === 'Valide' && row.offerDeleted)), [rows]);

  const counts = useMemo(() => rows.reduce((acc, row) => {
    acc.total += 1;
    if (row.statut === 'En attente') acc.enAttente += 1;
    if (row.statut === 'Valide') acc.enCours += 1;
    if (row.statut === 'Refusee') acc.refusees += 1;
    if (row.statut === 'Annulee') acc.annulees += 1;
    if (row.statut === 'Refusee' || row.statut === 'Annulee' || (row.statut === 'Valide' && row.offerDeleted)) acc.traitees += 1;
    return acc;
  }, { total: 0, enAttente: 0, enCours: 0, traitees: 0, refusees: 0, annulees: 0 }), [rows]);

  const handleValidate = async (applicationId) => {
    if (!applicationId || validatingId) {
      return;
    }

    try {
      setValidatingId(applicationId);
      await onValidateApplication?.(applicationId);
      await onLoadProfile?.();
    } finally {
      setValidatingId('');
    }
  };

  const openRejectModal = (applicationId) => {
    if (!applicationId || rejectingId || validatingId) {
      return;
    }

    setActiveRejectApplicationId(applicationId);
    setRejectReason('');
  };

  const closeRejectModal = () => {
    if (rejectingId) {
      return;
    }

    setActiveRejectApplicationId('');
    setRejectReason('');
  };

  const handleReject = async () => {
    const applicationId = activeRejectApplicationId;

    if (!applicationId || rejectingId) {
      return;
    }

    try {
      setRejectingId(applicationId);
      await onRejectApplication?.(applicationId, rejectReason);
      await onLoadProfile?.();
      closeRejectModal();
    } finally {
      setRejectingId('');
    }
  };

  const openNoteModal = (row) => {
    if (!row?.note) {
      return;
    }

    setActiveNoteRow(row);
  };

  const closeNoteModal = () => {
    setActiveNoteRow(null);
  };

  return (
    <section className="page-block association-theme">
      <div className="section-header-block">
        <p className="kicker">MES BENEVOLES</p>
        <h2>Suivi des benevoles</h2>
        <p>{counts.total} benevoles suivis - {counts.enCours} en cours - {counts.enAttente} en attente - {counts.traitees} traitees</p>
      </div>

      <div className="section-header-block">
        <p className="kicker">MISSIONS EN COURS</p>
      </div>

      <article className="card missions-table-card">
        <div className="missions-table-wrap">
          <table className="missions-table">
            <thead>
              <tr>
                <th>Benevole</th>
                <th>Statut</th>
                <th>Mission</th>
                <th>Date</th>
                <th>Message / note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ongoingRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.benevole}</td>
                  <td>
                    <span className={`badge ${row.statut === 'Valide' ? 'success' : 'warning'}`}>
                      {row.statut}
                    </span>
                  </td>
                  <td>{row.mission}</td>
                  <td>{row.dateLabel}</td>
                  <td>
                    {row.note ? (
                      <button
                        className="ghost action-link"
                        type="button"
                        onClick={() => openNoteModal(row)}
                      >
                        Voir le motif
                      </button>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="table-actions">
                      {row.userId ? (
                        <Link className="ghost action-link" to={`/benevoles/${row.userId}`}>
                          Voir profil
                        </Link>
                      ) : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ongoingRows.length === 0 && (
          <div className="empty-state-card" style={{ marginTop: '12px' }}>
            <p>Aucune mission en cours.</p>
          </div>
        )}
      </article>

      <div className="section-header-block">
        <p className="kicker">MISSIONS EN ATTENTE</p>
      </div>

      <article className="card missions-table-card">
        <div className="missions-table-wrap">
          <table className="missions-table">
            <thead>
              <tr>
                <th>Benevole</th>
                <th>Statut</th>
                <th>Mission</th>
                <th>Date</th>
                <th>Message / note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.benevole}</td>
                  <td>
                    <span className="badge warning">
                      {row.statut}
                    </span>
                  </td>
                  <td>{row.mission}</td>
                  <td>{row.dateLabel}</td>
                  <td>
                    {row.note ? (
                      <button
                        className="ghost action-link"
                        type="button"
                        onClick={() => openNoteModal(row)}
                      >
                        Voir le motif
                      </button>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="table-actions">
                      {row.userId ? (
                        <Link className="ghost action-link" to={`/benevoles/${row.userId}`}>
                          Voir profil
                        </Link>
                      ) : '-'}
                      <button
                        className="solid action-link"
                        type="button"
                        disabled={validatingId === row.applicationId || rejectingId === row.applicationId}
                        onClick={() => handleValidate(row.applicationId)}
                      >
                        {validatingId === row.applicationId ? 'Validation...' : 'Accepter'}
                      </button>
                      <button
                        className="danger action-link"
                        type="button"
                        disabled={validatingId === row.applicationId || rejectingId === row.applicationId}
                        onClick={() => openRejectModal(row.applicationId)}
                      >
                        {rejectingId === row.applicationId ? 'Refus...' : 'Refuser'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pendingRows.length === 0 && (
          <div className="empty-state-card" style={{ marginTop: '12px' }}>
            <p>Aucune mission en attente.</p>
          </div>
        )}
      </article>

      <div className="section-header-block">
        <p className="kicker">MISSIONS TRAITEES</p>
      </div>

      <article className="card missions-table-card">
        <div className="missions-table-wrap">
          <table className="missions-table">
            <thead>
              <tr>
                <th>Benevole</th>
                <th>Statut</th>
                <th>Mission</th>
                <th>Date</th>
                <th>Message / note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.benevole}</td>
                  <td>
                    <span className={`badge ${row.statut === 'Valide' ? 'success' : 'warning'}`}>
                      {row.statut}
                    </span>
                  </td>
                  <td>{row.mission}</td>
                  <td>{row.dateLabel}</td>
                  <td>
                    {row.note ? (
                      <button
                        className="ghost action-link"
                        type="button"
                        onClick={() => openNoteModal(row)}
                      >
                        Voir le motif
                      </button>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="table-actions">
                      {row.userId ? (
                        <Link className="ghost action-link" to={`/benevoles/${row.userId}`}>
                          Voir profil
                        </Link>
                      ) : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {processedRows.length === 0 && (
          <div className="empty-state-card" style={{ marginTop: '12px' }}>
            <p>Aucune mission traitee pour le moment.</p>
          </div>
        )}
      </article>

      {activeRejectApplicationId && (
        <div className="modal-backdrop" role="presentation" onClick={closeRejectModal}>
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-application-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="kicker">REFUS CANDIDATURE</p>
                <h3 id="reject-application-modal-title">Refuser la candidature</h3>
              </div>
              <button className="ghost modal-close" type="button" onClick={closeRejectModal} disabled={Boolean(rejectingId)}>
                Fermer
              </button>
            </div>

            <p className="modal-copy">
              Indiquez la raison du refus. Le benevole verra cette notification dans son onglet Mes missions.
            </p>

            <textarea
              className="modal-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Exemple : disponibilites deja completees pour cette mission."
              rows={5}
              maxLength={280}
            />

            <div className="modal-footer">
              <small>{rejectReason.length}/280</small>
              <div className="modal-actions">
                <button className="ghost" type="button" onClick={closeRejectModal} disabled={Boolean(rejectingId)}>
                  Annuler
                </button>
                <button className="danger" type="button" onClick={handleReject} disabled={Boolean(rejectingId)}>
                  {rejectingId ? 'Refus en cours...' : 'Confirmer le refus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeNoteRow && (
        <div className="modal-backdrop" role="presentation" onClick={closeNoteModal}>
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="kicker">MESSAGE / NOTE</p>
                <h3 id="note-modal-title">Motif de {activeNoteRow.benevole}</h3>
              </div>
              <button className="ghost modal-close" type="button" onClick={closeNoteModal}>
                Fermer
              </button>
            </div>

            <p className="modal-copy" style={{ whiteSpace: 'pre-wrap' }}>
              {activeNoteRow.note}
            </p>

            <div className="modal-footer">
              <div className="modal-actions">
                <button className="solid" type="button" onClick={closeNoteModal}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
