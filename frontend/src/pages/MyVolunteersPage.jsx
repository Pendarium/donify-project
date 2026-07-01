import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR');
}

export default function MyVolunteersPage({ profile, onLoadProfile, onValidateApplication }) {
  const [validatingId, setValidatingId] = useState('');

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

    const acceptedRows = offers.flatMap((offer) =>
      (offer.historyUsers || []).map((entry) => ({
        id: `history-${entry.id}`,
        benevole: entry.user?.username || 'Benevole',
        statut: 'Valide',
        mission: offer.title || 'Mission benevole',
        date: entry.completedAt,
        dateLabel: formatDate(entry.completedAt),
        note: entry.note || 'Aucun commentaire',
        userId: entry.user?.id || null,
        applicationId: null,
      })),
    );

    return [...acceptedRows, ...pendingRows].sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });
  }, [profile]);

  const counts = useMemo(() => rows.reduce((acc, row) => {
    acc.total += 1;
    if (row.statut === 'En attente') acc.enAttente += 1;
    if (row.statut === 'Valide') acc.valides += 1;
    return acc;
  }, { total: 0, enAttente: 0, valides: 0 }), [rows]);

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

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">MES BENEVOLES</p>
        <h2>Suivi des benevoles</h2>
        <p>{counts.total} benevole(s) suivi(s) - {counts.enAttente} en attente - {counts.valides} valide(s)</p>
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.benevole}</td>
                  <td>
                    <span className={`badge ${row.statut === 'Valide' ? 'success' : 'warning'}`}>
                      {row.statut}
                    </span>
                  </td>
                  <td>{row.mission}</td>
                  <td>{row.dateLabel}</td>
                  <td>{row.note}</td>
                  <td>
                    <div className="table-actions">
                      {row.userId ? (
                        <Link className="ghost action-link" to={`/benevoles/${row.userId}`}>
                          Voir profil
                        </Link>
                      ) : '-'}
                      {row.applicationId ? (
                        <button
                          className="solid action-link"
                          type="button"
                          disabled={validatingId === row.applicationId}
                          onClick={() => handleValidate(row.applicationId)}
                        >
                          {validatingId === row.applicationId ? 'Validation...' : 'Accepter'}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="empty-state-card" style={{ marginTop: '12px' }}>
            <p>Aucun benevole pour le moment.</p>
          </div>
        )}
      </article>
    </section>
  );
}
