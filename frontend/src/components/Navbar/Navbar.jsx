import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>
          <span className={styles.logoMark}>AH</span>
          <span className={styles.brandText}>Appzeto Helpdesk</span>
        </NavLink>

        {isAuthenticated && (
          <nav className={styles.nav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              {user.role === 'agent' ? 'Dashboard' : 'My Tickets'}
            </NavLink>
            {user.role === 'customer' && (
              <NavLink to="/tickets/new" className="btn btn-primary btn-sm">
                + New Ticket
              </NavLink>
            )}
            <div className={styles.userChip}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>{user.role}</span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
