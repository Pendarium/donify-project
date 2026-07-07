import { Link, NavLink } from 'react-router-dom';

export default function AppLayout({ children, isAuthenticated, role, onGoLogin, onGoSignup, onGoProfile, onLogout }) {
  const year = new Date().getFullYear();

  return (
    <div className="page">
      <header className="topbar">
        <Link to="/" className="brand-link">
          <div className="brand">
            <div className="brand-dot" />
            <span>Donnify</span>
          </div>
        </Link>

        <nav className="menu">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'menu-item active' : 'menu-item')}>
            Accueil
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/associations" className={({ isActive }) => (isActive ? 'menu-item active' : 'menu-item')}>
                Associations
              </NavLink>
              <NavLink to="/benevolat" className={({ isActive }) => (isActive ? 'menu-item active' : 'menu-item')}>
                Benevolat
              </NavLink>
            </>
          )}
          {isAuthenticated && role === 'user' && (
            <>
              <NavLink to="/mes-missions" className={({ isActive }) => (isActive ? 'menu-item active' : 'menu-item')}>
                Mes missions
              </NavLink>
              <NavLink to="/calendrier" className={({ isActive }) => (isActive ? 'menu-item active' : 'menu-item')}>
                Calendrier
              </NavLink>
            </>
          )}
          {isAuthenticated && role === 'association' && (
            <NavLink to="/mes-benevoles" className={({ isActive }) => (isActive ? 'menu-item active' : 'menu-item')}>
              Mes benevoles
            </NavLink>
          )}
        </nav>

        <div className="auth-mini">
          {isAuthenticated ? (
            <>
              <button className="ghost" onClick={onGoProfile}>Mon profil</button>
              <button className="danger" onClick={onLogout}>Deconnexion</button>
            </>
          ) : (
            <>
              <button className="ghost" onClick={onGoLogin}>Connexion</button>
              <button className="solid" onClick={onGoSignup}>Inscription</button>
            </>
          )}
        </div>
      </header>

      <main className="container">{children}</main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>Donnify - {year}</p>
        </div>
      </footer>
    </div>
  );
}
