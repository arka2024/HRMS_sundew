import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { SundewLogo, SundewElevateWordmark } from '../components/brand/SundewLogo';
import { PortalAmbientScene } from '../components/portal/PortalAmbientScene';
import { ManagerPortalScene } from '../components/portal/ManagerPortalScene';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useEmployeeSyncRefresh } from '../hooks/useEmployeeSyncRefresh';
import { ROUTES } from '../constants';
import { managerService, type Associate } from '../services/manager.service';
import '../styles/elevate.css';

export function AppShell() {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isHrPortal = user?.role === 'hr';
  const activeAssociateId = searchParams.get('id') || '';

  const loadAssociates = useCallback(async () => {
    if (user?.role !== 'manager' || !token) return;
    try {
      const data = await managerService.getAssociates(token);
      setAssociates(data);

      const currentId = searchParams.get('id');
      const preferred =
        data.find((associate) => associate.syncedFromHr)?.id ||
        data[0]?.id;

      if (!currentId && preferred) {
        setSearchParams({ id: preferred }, { replace: true });
      } else if (currentId && !data.some((associate) => associate.id === currentId) && preferred) {
        setSearchParams({ id: preferred }, { replace: true });
      }
    } catch (err) {
      console.error('Failed to load associates in sidebar:', err);
    }
  }, [user?.role, token, searchParams, setSearchParams]);

  useEmployeeSyncRefresh(loadAssociates, {
    enabled: user?.role === 'manager' && Boolean(token),
    intervalMs: 15000,
  });

  useEffect(() => {
    loadAssociates();
  }, [loadAssociates, location.pathname]);

  // All associates are now treated equally, but we can still sort or process them if needed.
  const allAssociates = associates;


  function handleSelectAssociate(id: string) {
    setSearchParams({ id });
    if (location.pathname !== ROUTES.MANAGER.DASHBOARD) {
      navigate(`${ROUTES.MANAGER.DASHBOARD}?id=${id}`);
    }
  }
  function handleComingSoon(feature: string) {
    toast.success(`${feature} is available in the full Sundew Elevate suite.`);
  }

  function handleNewEvaluation() {
    // Find an associate whose evaluation is not locked for the current month
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const nextAssociate = associates.find(
      (a) => a.id !== activeAssociateId && a.evaluationLockedForMonth !== currentMonthKey
    ) || associates.find((a) => a.evaluationLockedForMonth !== currentMonthKey);

    if (nextAssociate) {
      handleSelectAssociate(nextAssociate.id);
      toast.success(`Started new evaluation for ${nextAssociate.name}`);
    } else {
      toast.success('All current associates have been evaluated for this month.');
    }
  }

  function handleExportFiles() {
    toast.success('Preparing document export...');
  }

  const topNavLinks = isHrPortal
    ? [
        { to: ROUTES.HR.DASHBOARD, label: 'Dashboard' },
        { to: ROUTES.HR.ASSOCIATES, label: 'Associates' },
        { to: ROUTES.HR.ASSOCIATE_MANAGER_MAPPINGS, label: 'Mappings' },
        { to: ROUTES.HR.EMPLOYEE_UPLOAD, label: 'Upload' },
        { to: ROUTES.HR.EMPLOYEES, label: 'Team' },
        { to: ROUTES.HR.EVALUATION_REPORTS, label: 'Evaluation Reports' },
        { to: ROUTES.HR.MANAGERS, label: 'Managers' },
        { to: ROUTES.HR.PROBATION_EXTENSIONS, label: 'Probation Extensions' },
        { to: ROUTES.HR.EVALUATION_UNLOCK_REQUESTS, label: 'Unlock Requests' },
        { to: ROUTES.HR.REPORTS, label: 'Reports' },
      ]
    : [
        { to: `${ROUTES.MANAGER.DASHBOARD}?id=${activeAssociateId}`, label: 'Dashboard' },
        { to: ROUTES.MANAGER.EMPLOYEES, label: 'Employees' },
        { to: ROUTES.MANAGER.TEAM, label: 'Team' },
        { to: ROUTES.MANAGER.EVALUATIONS, label: 'Evaluations' },
        { to: ROUTES.MANAGER.PROBATION_EXTENSIONS, label: 'Probation Extensions' },
        { to: ROUTES.MANAGER.EVALUATION_UNLOCK_REQUESTS, label: 'Unlock Requests' },
        { to: ROUTES.MANAGER.EVALUATION_REPORTS, label: 'Reports' },
      ];

  return (
    <div className={`app-shell-wrapper${isHrPortal ? ' sundew-elevate-shell' : ' manager-portal-shell'}`}>
      {isHrPortal ? <PortalAmbientScene /> : <ManagerPortalScene />}
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            {isHrPortal ? (
              <SundewElevateWordmark />
            ) : (
              <>
                <SundewLogo size={40} />
                <div>
                  <strong>Sundew Elevate</strong>
                  <small>Manager Portal</small>
                </div>
              </>
            )}
          </div>

          <div className="sidebar-nav-container">
            {isHrPortal ? (
              <nav className="sidebar-nav">
                <span className="sidebar-nav-title">Workspace</span>
                <NavLink
                  to={ROUTES.HR.DASHBOARD}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="material-symbols-outlined">folder</span>
                  Files
                </NavLink>
                <NavLink
                  to={ROUTES.HR.ASSOCIATES}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="material-symbols-outlined">group_add</span>
                  Associates
                </NavLink>
                <NavLink
                  to={ROUTES.HR.ASSOCIATE_MANAGER_MAPPINGS}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="material-symbols-outlined">swap_horiz</span>
                  Mappings
                </NavLink>
                <NavLink
                  to={ROUTES.HR.EMPLOYEE_UPLOAD}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="material-symbols-outlined">upload_file</span>
                  Employee Upload
                </NavLink>
                <NavLink
                  to={ROUTES.HR.EMPLOYEES}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="material-symbols-outlined">group</span>
                  Employees
                </NavLink>
                <NavLink
                  to={ROUTES.HR.EVALUATION_REPORTS}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="material-symbols-outlined">assessment</span>
                  Evaluation Reports
                </NavLink>
                <NavLink
                  to={ROUTES.HR.MANAGERS}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="material-symbols-outlined">supervisor_account</span>
                  Managers
                </NavLink>
                <NavLink
                  to={ROUTES.HR.PROBATION_EXTENSIONS}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="material-symbols-outlined">schedule</span>
                  Probation Extensions
                </NavLink>
                <NavLink
                  to={ROUTES.HR.EVALUATION_UNLOCK_REQUESTS}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="material-symbols-outlined">lock_open</span>
                  Unlock Requests
                </NavLink>
                <button
                  type="button"
                  onClick={() => handleComingSoon('File History')}
                  className="nav-link sidebar-action-link"
                >
                  <span className="material-symbols-outlined">history</span>
                  History
                </button>
                <button
                  type="button"
                  onClick={handleExportFiles}
                  className="nav-link sidebar-action-link"
                >
                  <span className="material-symbols-outlined">download</span>
                  Export Files
                </button>
              </nav>
            ) : (
              <div className="sidebar-nav">
                <span className="sidebar-nav-title">Manager</span>
                {allAssociates.length > 0 && (
                  <>
                    <span className="sidebar-nav-subtitle">Associates</span>
                    {allAssociates.map((associate) => {
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
                            <img
                              src={associate.avatar}
                              alt={associate.name}
                              className="associate-switcher-avatar"
                            />
                            <span>{associate.name}</span>
                          </div>
                          <span
                            className={`associate-switcher-status ${isTrack ? 'status-dot-track' : 'status-dot-needs'}`}
                          />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}          </div>

          <div className="sidebar-footer">
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={handleNewEvaluation}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                add
              </span>
              New Evaluation
            </Button>

            <div className="sidebar-footer-links">
              <button
                type="button"
                onClick={() => handleComingSoon('Help Center')}
                className="nav-link sidebar-action-link"
              >
                <span className="material-symbols-outlined">help</span>
                Help Center
              </button>
              <button type="button" onClick={() => logout()} className="nav-link sidebar-action-link">
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>

            <div className="user-chip">
              <span className="avatar">{user?.name.charAt(0)}</span>
              <div className="user-chip-info">
                <strong>{user?.name}</strong>
                <small>{isHrPortal ? 'HR Administrator' : 'Manager'}</small>
              </div>
            </div>
          </div>
        </aside>

        <div className="main-panel">
          <header className="top-navbar">
            <div className="top-navbar-left">
              {isHrPortal && (
                <div className="top-navbar-brand-meta">
                  <span>HR Administrator Portal</span>
                  <small>Document workspace</small>
                </div>
              )}

              <nav className="top-navbar-nav">
                {topNavLinks.map((link) => (
                  <NavLink
                    key={`${link.to}-${link.label}`}
                    to={link.to}
                    className={({ isActive }) =>
                      isActive ? 'top-navbar-link active' : 'top-navbar-link'
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="top-navbar-right">
              {isHrPortal && (
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
                  <motion.div
                    className="elevate-notifications-popover"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="elevate-notifications-header">
                      <strong>Notifications</strong>
                      <button type="button" onClick={() => setShowNotifications(false)}>
                        Dismiss
                      </button>
                    </div>
                    <div className="elevate-notification-item">
                      <strong>Evaluation saved</strong>
                      <p>Sarah Thompson updated Policy_2024.v2</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleComingSoon('Settings')}
                className="top-navbar-btn"
              >
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
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
