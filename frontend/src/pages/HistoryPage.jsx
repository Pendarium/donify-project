import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function toDateKey(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function HistoryPage({ history, bookings = [], onLoadHistory, onLoadBookings, onCreateBooking, onDeleteBooking }) {
  const [titleDraft, setTitleDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    onLoadHistory?.();
    onLoadBookings?.();
  }, []);

  const historyEvents = useMemo(() => (
    history.map((entry) => {
      const offer = entry.offer;
      return {
        id: entry.id,
        dateKey: toDateKey(offer?.startDate || entry.completedAt),
        title: offer?.title || 'Mission benevole',
        location: offer?.location || '-',
        completedAt: entry.completedAt,
        note: entry.note,
        associationId: offer?.associationId,
        associationName: offer?.association?.name || 'Voir la fiche',
      };
    })
  ), [history]);

  const historyCountByDay = useMemo(() => {
    const map = new Map();
    historyEvents.forEach((event) => {
      if (!event.dateKey) return;
      map.set(event.dateKey, (map.get(event.dateKey) || 0) + 1);
    });
    return map;
  }, [historyEvents]);

  const normalizedBookings = useMemo(() => (
    bookings.map((item) => ({
      ...item,
      dateKey: toDateKey(item.date),
    }))
  ), [bookings]);

  const bookingCountByDay = useMemo(() => {
    const map = new Map();
    normalizedBookings.forEach((event) => {
      map.set(event.dateKey, (map.get(event.dateKey) || 0) + 1);
    });
    return map;
  }, [normalizedBookings]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      cells.push({ date, dateKey: toDateKey(date), inCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({ date, dateKey: toDateKey(date), inCurrentMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (firstWeekday + daysInMonth) + 1;
      const date = new Date(year, month + 1, nextDay);
      cells.push({ date, dateKey: toDateKey(date), inCurrentMonth: false });
    }

    return cells;
  }, [currentMonth]);

  const selectedHistoryEvents = historyEvents.filter((event) => event.dateKey === selectedDateKey);
  const selectedBookings = normalizedBookings.filter((event) => event.dateKey === selectedDateKey);

  const selectedDateLabel = selectedDateKey
    ? formatDate(`${selectedDateKey}T12:00:00`)
    : '-';

  const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const goToMonth = (offset) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const addBooking = async () => {
    if (!selectedDateKey || !titleDraft.trim()) {
      return;
    }

    await onCreateBooking?.({
      date: `${selectedDateKey}T12:00:00.000Z`,
      title: titleDraft.trim(),
      note: noteDraft.trim() || undefined,
    });
    setTitleDraft('');
    setNoteDraft('');
  };

  const removeBooking = async (bookingId) => {
    await onDeleteBooking?.(bookingId);
  };

  return (
    <section className="page-block">
      <div className="section-header-block">
        <p className="kicker">CALENDRIER</p>
        <h2>Planning benevole</h2>
        <p>{history.length} mission(s) validee(s) et {bookings.length} reservation(s) perso</p>
      </div>

      <div className="history-calendar-shell">
        <article className="card history-calendar-board">
          <div className="history-calendar-toolbar">
            <button className="ghost" type="button" onClick={() => goToMonth(-1)}>Mois precedent</button>
            <h3>{monthLabel}</h3>
            <button className="ghost" type="button" onClick={() => goToMonth(1)}>Mois suivant</button>
          </div>

          <div className="history-calendar-weekdays">
            {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
          </div>

          <div className="history-calendar-grid">
            {calendarDays.map((day) => {
              const dayHistoryCount = historyCountByDay.get(day.dateKey) || 0;
              const dayBookingCount = bookingCountByDay.get(day.dateKey) || 0;
              const isSelected = selectedDateKey === day.dateKey;

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  className={`history-calendar-day ${day.inCurrentMonth ? '' : 'outside'} ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedDateKey(day.dateKey);
                    if (!day.inCurrentMonth) {
                      setCurrentMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                    }
                  }}
                >
                  <strong>{day.date.getDate()}</strong>
                  <div className="history-calendar-day-meta">
                    {dayHistoryCount > 0 && <span className="badge">Validees: {dayHistoryCount}</span>}
                    {dayBookingCount > 0 && <span className="badge">Reservations : {dayBookingCount}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </article>

        <article className="card history-calendar-side">
          <h3>{selectedDateLabel}</h3>

          <div className="detail-stack">
            <h4>Missions validees</h4>
            {selectedHistoryEvents.length ? selectedHistoryEvents.map((event) => (
              <div className="application-card" key={event.id}>
                <div className="offer-head">
                  <span className="badge">{event.location}</span>
                  <span className="badge">Validee le {formatDate(event.completedAt)}</span>
                </div>
                <p>{event.title}</p>
                {event.note && <p className="history-note">Note: {event.note}</p>}
                <Link className="inline-link" to={`/associations/${event.associationId}`}>{event.associationName}</Link>
              </div>
            )) : <p className="muted">Aucune mission validee ce jour.</p>}
          </div>

          <div className="detail-stack">
            <h4>Mes reservations</h4>
            {selectedBookings.length ? selectedBookings.map((booking) => (
              <div className="application-card" key={booking.id}>
                <div className="offer-head">
                  <span className="badge">Reservation perso</span>
                  <button className="danger" type="button" onClick={() => removeBooking(booking.id)}>Supprimer</button>
                </div>
                <p>{booking.title}</p>
                {booking.note && <small>{booking.note}</small>}
              </div>
            )) : <p className="muted">Aucune reservation pour cette date.</p>}
          </div>

          <div className="detail-stack">
            <h4>Ajouter une reservation ce jour</h4>
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Titre de la reservation"
            />
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Note optionnelle"
              rows={3}
            />
            <button className="solid" type="button" onClick={addBooking}>
              Ajouter au calendrier
            </button>
          </div>
        </article>
      </div>

      {history.length === 0 && (
        <article className="offer-card empty-state-card" style={{ marginTop: '16px' }}>
          <h3>Pas encore de missions validees</h3>
          <p>Quand une association valide votre participation, elle apparaitra automatiquement dans ce calendrier.</p>
          <Link className="solid action-link" to="/benevolat">Voir les missions</Link>
        </article>
      )}
    </section>
  );
}