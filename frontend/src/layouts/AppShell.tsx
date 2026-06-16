import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants';
import { managerService, type Associate } from '../services/manager.service';

export function AppShell() {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const activeAssociateId = searchParams.get('id') || 'sarah-chen';

  // Fetch associates for the manager sidebar
  useEffect(() => {
    if (user?.role === 'manager' && token) {
      managerService
        .getAssociates(token)
        .then((data) => {
          setAssociates(data);
          // If no id query parameter is set and we have associates, set the default
          if (!searchParams.get('id') && data.length > 0) {
            setSearchParams({ id: data[0].id }, { replace: true });
          }
        })
        .catch((err) => {
          console.error('Failed to load associates in sidebar:', err);
        });
    }
  }, [user, token, searchParams, setSearchParams]);

  function handleSelectAssociate(id: string) {
    setSearchParams({ id });
    // If the manager is not on the dashboard, navigate there
    if (location.pathname !== ROUTES.MANAGER.DASHBOARD) {
      navigate(`${ROUTES.MANAGER.DASHBOARD}?id=${id}`);
    }
  }

  function handleComingSoon(feature: string) {
    toast.success(`${feature} features are simulated. Standard view is active.`);
  }

  function handleExportFiles() {
    toast.success('Preparing document export...');
  }

  const topNavLinks =
    user?.role === 'hr'
      ? [
          { to: ROUTES.HR.DASHBOARD, label: 'Dashboard' },
          { to: ROUTES.HR.EMPLOYEES, label: 'Team' },
          { to: ROUTES.HR.REPORTS, label: 'Evaluations' },
        ]
      : [
          { to: `${ROUTES.MANAGER.DASHBOARD}?id=${activeAssociateId}`, label: 'Dashboard' },
          { to: ROUTES.MANAGER.TEAM, label: 'Team' },
          { to: ROUTES.MANAGER.EVALUATIONS, label: 'Evaluations' },
        ];

  return (
    <div className="app-shell">
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">{user?.role === 'hr' ? 'HR' : 'M'}</span>
          <div>
            <strong>Corporate HR</strong>
            <small>Enterprise Edition</small>
          </div>
        </div>

        <div className="sidebar-nav-container">
          {user?.role === 'hr' ? (
            // HR Sidebar Navigation
            <nav className="sidebar-nav">
              <span className="sidebar-nav-title">Modules</span>
              <NavLink to={ROUTES.HR.DASHBOARD} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <span className="material-symbols-outlined">folder</span>
                Files
              </NavLink>
              <button type="button" onClick={() => handleComingSoon('File History')} className="nav-link" style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
                <span className="material-symbols-outlined">history</span>
                History
              </button>
              <button type="button" onClick={handleExportFiles} className="nav-link" style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
                <span className="material-symbols-outlined">download</span>
                Export Files
              </button>
            </nav>
          ) : (
            // Manager Sidebar Navigation: List of Associates
            <div className="sidebar-nav">
              <span className="sidebar-nav-title">Manager</span>
              {associates.map((associate) => {
                const isActive = associate.id === activeAssociateId;
                const isTrack = associate.status === 'On Track';
                return (
                  <button
                    key={associate.id}
                    type="button"
                    onClick={() => handleSelectAssociate(associate.id)}
                    className={`associate-switcher-btn ${isActive ? 'active' : ''}`}
                  >
                    <div className="associate-switcher-info">
                      <img src={associate.avatar} alt={associate.name} className="associate-switcher-avatar" />
                      <span>{associate.name}</span>
                    </div>
                    <span className={`associate-switcher-status ${isTrack ? 'status-dot-track' : 'status-dot-needs'}`}></span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          {user?.role === 'manager' && (
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={() => handleComingSoon('New Evaluation')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
              New Evaluation
            </Button>
          )}
          
          <div className="pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleComingSoon('Help Center')}
              className="nav-link"
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', padding: '8px 12px' }}
            >
              <span className="material-symbols-outlined">help</span>
              Help Center
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="nav-link"
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', padding: '8px 12px' }}
            >
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>
          </div>

          <div className="user-chip">
            <span className="avatar">{user?.name.charAt(0)}</span>
            <div className="user-chip-info">
              <strong>{user?.name}</strong>
              <small>{user?.role === 'hr' ? 'HR Administrator' : 'Manager'}</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="main-panel">
        <header className="top-navbar">
          <div className="top-navbar-left">
            <span className="top-navbar-brand">
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>shield_person</span>
              HR Manager Portal
            </span>

            <nav className="top-navbar-nav">
              {topNavLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => (isActive ? 'top-navbar-link active' : 'top-navbar-link')}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="top-navbar-right">
            {user?.role === 'hr' && (
              <div className="top-navbar-search">
                <span className="material-symbols-outlined top-navbar-search-icon">search</span>
                <input type="text" placeholder="Search documents..." />
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="top-navbar-btn"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    width: '320px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '16px',
                    zIndex: 100,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                    <button type="button" onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer' }}>Dismiss</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                    <div style={{ padding: '6px', background: 'var(--bg)', borderRadius: '6px' }}>
                      <strong>Evaluation saved!</strong>
                      <p style={{ margin: '2px 0 0', color: 'var(--text-muted)' }}>Evaluation for Sarah Chen was updated successfully.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="button" onClick={() => handleComingSoon('Settings')} className="top-navbar-btn">
              <span className="material-symbols-outlined">settings</span>
            </button>

            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCEBSgyvWhWcUFD0_sFk0Z5fn365kbumbRqrv0GfIZuJzhpIr_eUJNWeIBGOl3ilIv7K2R5i4SFlgLPUmMLkSojNB61S0Y-tspj1SNDCxbSMr327OASz9b24mdOjMqUvq2GKMtN4H5b8Se1gxiKRGOkQKZgNqW7QE59DYjL4guWRIGz4azjNWxeGTr8iJBEJBzwMmY-49ETYtOTynhsY_SqQ6vOxPyxzNOP3VZLhi8Skrjr1D3s7TyorKUMJf9YiCbHAmFsV07M9c"
              alt="User Profile"
              className="top-navbar-avatar"
              onClick={() => handleComingSoon('User Settings')}
            />
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

