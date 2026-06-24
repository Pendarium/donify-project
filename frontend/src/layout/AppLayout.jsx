import { Link, NavLink } from 'react-router-dom';

export default function AppLayout({ children, isAuthenticated, role, onGoLogin, onGoSignup, onGoProfile, onLogout }) {
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
              <NavLink to="/favoris" className={({ isActive }) => (isActive ? 'menu-item active' : 'menu-item')}>
                Mes favoris
              </NavLink>
              <NavLink to="/historique" className={({ isActive }) => (isActive ? 'menu-item active' : 'menu-item')}>
                Historique
              </NavLink>
            </>
          )}
        </nav>

        <div className="auth-mini">
          {isAuthenticated ? (
            <>
              <button className="ghost" onClick={onGoProfile}>Mon profil</button>
              <button className="danger" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="ghost" onClick={onGoLogin}>Log in</button>
              <button className="solid" onClick={onGoSignup}>Sign up</button>
            </>
          )}
        </div>
      </header>

      <main className="container">{children}</main>
    </div>
  );
}
