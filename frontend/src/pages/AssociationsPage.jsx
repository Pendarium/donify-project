import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const chips = [
  'Toutes',
  'Aide alimentaire',
  'Aide humanitaire',
  'Aide sociale',
  'Environnement',
  'Sante',
  'Education',
];

export default function AssociationsPage({ associations, onLoadAssociations }) {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('Toutes');

  useEffect(() => {
    onLoadAssociations();
  }, []);

  const filtered = useMemo(() => {
    return associations.filter((a) => {
      const text = `${a.name} ${a.description || ''} ${a.address}`.toLowerCase();
      const matchesQuery = query.trim() ? text.includes(query.trim().toLowerCase()) : true;
      const matchesChip =
        activeChip === 'Toutes'
          ? true
          : text.includes(activeChip.toLowerCase().replace('aide ', ''));
      return matchesQuery && matchesChip;
    });
  }, [associations, query, activeChip]);

  return (
    <section className="page-block association-theme">
      <div className="section-header-block">
        <p className="kicker">ASSOCIATIONS</p>
        <h2>Trouvez votre association</h2>
      </div>

      <div className="search card">
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Association, cause, mission..."
          />
          <button type="button" onClick={onLoadAssociations}>Rechercher</button>
        </form>
      </div>

      <div className="chips-row">
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

      <div className="cards-grid wide">
        {filtered.map((a) => (
          <article className="association-card" key={a.id}>
            <div className="association-head">
              <h3>
                <Link className="association-title-link association-link" to={`/associations/${a.id}`}>
                  {a.name}
                </Link>
              </h3>
            </div>
            <p>{a.description || 'Association engagee localement.'}</p>
            <small>{a.address}</small>
            <div className="actions-row">
              <Link className="ghost action-link association-link-button" to={`/associations/${a.id}`}>Voir les missions</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
