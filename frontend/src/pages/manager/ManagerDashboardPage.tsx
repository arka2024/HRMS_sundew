import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { useAuth } from '../../contexts/AuthContext';
import { managerService, type Associate } from '../../services/manager.service';

export function ManagerDashboardPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const activeId = searchParams.get('id') || '';

  const [associate, setAssociate] = useState<Associate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for sliders and comments
  const [tech, setTech] = useState(3);
  const [learn, setLearn] = useState(3);
  const [adapt, setAdapt] = useState(3);
  const [attitude, setAttitude] = useState(3);
  const [comments, setComments] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeId || !token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    managerService
      .getAssociateDetails(token, activeId)
      .then((data) => {
        setAssociate(data);
        setTech(data.currentEvaluation.tech);
        setLearn(data.currentEvaluation.learn);
        setAdapt(data.currentEvaluation.adapt);
        setAttitude(data.currentEvaluation.attitude);
        setComments(data.currentEvaluation.comments || '');
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load associate details:', err);
        setError('Failed to connect to Manager Service backend.');
        setIsLoading(false);
      });
  }, [activeId, token]);

  if (isLoading) {
    return <LoadingSpinner message="Loading associate dashboard..." />;
  }

  if (error || !associate) {
    return <ServiceError message={error || 'No active associate selected.'} />;
  }

  const liveAverage = (tech + learn + adapt + attitude) / 4;
  const currentEvaluationAverage =
    associate.currentEvaluation.average ??
    (associate.currentEvaluation.tech + associate.currentEvaluation.learn + associate.currentEvaluation.adapt + associate.currentEvaluation.attitude) / 4;
  const hasUnsavedChanges =
    tech !== associate.currentEvaluation.tech ||
    learn !== associate.currentEvaluation.learn ||
    adapt !== associate.currentEvaluation.adapt ||
    attitude !== associate.currentEvaluation.attitude ||
    comments !== (associate.currentEvaluation.comments || '');
  const currentEvaluationSavedInHistory =
    Boolean(associate.currentEvaluation.savedAt) &&
    associate.history.some((item) => item.savedAt === associate.currentEvaluation.savedAt);
  const shouldAppendLivePoint = hasUnsavedChanges || !currentEvaluationSavedInHistory;

  // Star calculation based on live average
  let starsCount = 1;
  if (liveAverage >= 4.5) starsCount = 5;
  else if (liveAverage >= 4.0) starsCount = 4;
  else if (liveAverage >= 3.0) starsCount = 3;
  else if (liveAverage >= 2.0) starsCount = 2;

  // Fit for Role status calculation
  let fitStatus = 'Fit for Role';
  let fitMessage = 'Highly recommended for current position';
  let fitClass = 'fit-role-alert-success';
  let fitIcon = 'check_circle';

  if (liveAverage < 3.0) {
    fitStatus = 'Needs Support';
    fitMessage = 'Action plan needed for performance improvement';
    fitClass = 'fit-role-alert-danger';
    fitIcon = 'cancel';
  } else if (liveAverage < 3.5) {
    fitStatus = 'Marginal Fit';
    fitMessage = 'Requires close monitoring / coaching';
    fitClass = 'fit-role-alert-warning';
    fitIcon = 'pending';
  }

  // Save changes handler
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !associate) return;
    setIsSaving(true);

    try {
      const updated = await managerService.saveEvaluation(token, associate.id, {
        tech,
        learn,
        adapt,
        attitude,
        comments,
      });
      setAssociate(updated);
      toast.success(`Evaluation saved for ${associate.name}!`);
    } catch {
      toast.error('Failed to save evaluation.');
    } finally {
      setIsSaving(false);
    }
  }

  // Draw trend SVGs helper
  function renderDimensionSvg(scores: number[], strokeColor: string) {
    const width = 100;
    const height = 50;
    const paddingX = 15;
    const paddingY = 8;
    const N = scores.length;

    if (N === 0) return null;

    if (N === 1) {
      const cy = height - paddingY - ((scores[0] - 1) / 4) * (height - 2 * paddingY);
      return (
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
          <circle cx={width / 2} cy={cy} r="3.5" fill={strokeColor} />
          <text x={width / 2} y={height - 2} fontSize="6" textAnchor="middle" fill="var(--text-muted)">Month 1</text>
        </svg>
      );
    }

    const points = scores.map((val, idx) => {
      const x = paddingX + (idx / (N - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((val - 1) / 4) * (height - 2 * paddingY);
      return { x, y };
    });

    const pathStr = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');

    return (
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
        <path d={pathStr} fill="none" stroke={strokeColor} strokeWidth="2.5" className="chart-line" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((pt, idx) => (
          <circle key={idx} cx={pt.x} cy={pt.y} r="2.5" fill={strokeColor} stroke="var(--surface)" strokeWidth="1" className="chart-point" />
        ))}
      </svg>
    );
  }

  // Helper to render total average graph with fill gradient
  function renderTotalAvgSvg(scores: number[]) {
    const width = 200;
    const height = 100;
    const paddingX = 25;
    const paddingY = 15;
    const N = scores.length;

    if (N === 0) return null;

    // Y Axis markings
    const yGrid = [1, 2, 3, 4, 5].map((i) => {
      const y = height - paddingY - ((i - 1) / 4) * (height - 2 * paddingY);
      return (
        <g key={i}>
          <line x1={paddingX - 5} y1={y} x2={width - 10} y2={y} stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />
          <text x={paddingX - 8} y={y + 2} fontSize="5" textAnchor="end" fill="var(--text-muted)">{i}.0</text>
        </g>
      );
    });

    if (N === 1) {
      const cy = height - paddingY - ((scores[0] - 1) / 4) * (height - 2 * paddingY);
      return (
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
          {yGrid}
          <circle cx={width / 2} cy={cy} r="4" fill="var(--secondary)" />
        </svg>
      );
    }

    const points = scores.map((val, idx) => {
      const x = paddingX + (idx / (N - 1)) * (width - paddingX - 15);
      const y = height - paddingY - ((val - 1) / 4) * (height - 2 * paddingY);
      return { x, y };
    });

    const pathStr = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
    const areaPathStr = `${pathStr} L ${points[N - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return (
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {yGrid}
        <path d={areaPathStr} fill="url(#totalGrad)" />
        <path d={pathStr} fill="none" stroke="var(--secondary)" strokeWidth="2" className="chart-line" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((pt, idx) => (
          <circle key={idx} cx={pt.x} cy={pt.y} r="3" fill="var(--secondary)" stroke="var(--surface)" strokeWidth="1.2" className="chart-point" />
        ))}
      </svg>
    );
  }

  // SVG Data arrays mapping
  const pointsHistory = [...associate.history];
  const currentPoint = {
    tech,
    learn,
    adapt,
    attitude,
    average: liveAverage,
  };
  const chartPoints = shouldAppendLivePoint ? [...pointsHistory, currentPoint] : pointsHistory;
  const techScores = chartPoints.map((h) => h.tech);
  const learnScores = chartPoints.map((h) => h.learn);
  const adaptScores = chartPoints.map((h) => h.adapt);
  const attitudeScores = chartPoints.map((h) => h.attitude);
  const totalScores = chartPoints.map((h) => h.average);
  const savedAverageScore =
    !hasUnsavedChanges && currentEvaluationSavedInHistory && associate.averagePerformanceScore
      ? associate.averagePerformanceScore
      : totalScores.reduce((a, b) => a + b, 0) / Math.max(totalScores.length, 1);
  const previousSavedAverage =
    totalScores.length > 1
      ? totalScores.slice(0, -1).reduce((a, b) => a + b, 0) / (totalScores.length - 1)
      : currentEvaluationAverage;
  const averageDelta = savedAverageScore - previousSavedAverage;

  // AI suggestions list builder
  const aiSuggestions = [];
  if (tech < 4) {
    aiSuggestions.push({
      icon: 'terminal',
      title: 'Technical Mentorship',
      desc: 'Connect with a senior staff developer to address codebase patterns and advanced algorithms to push Technical score to 4.0.',
    });
  }
  if (learn < 4) {
    aiSuggestions.push({
      icon: 'menu_book',
      title: 'Self-Paced Learning',
      desc: 'Assign selected library training modules and target learning milestones in the coming month.',
    });
  } else {
    aiSuggestions.push({
      icon: 'auto_stories',
      title: 'Knowledge Transfers',
      desc: 'Capitalize on high learning efficiency by hosting a peer-level knowledge sharing session.',
    });
  }
  if (adapt < 4) {
    aiSuggestions.push({
      icon: 'explore',
      title: 'Cross-Functional Syncs',
      desc: 'Involve in agile peer collaborations and daily scrums to foster system familiarity and adjustment.',
    });
  }
  if (attitude >= 4) {
    aiSuggestions.push({
      icon: 'groups',
      title: 'Buddy System',
      desc: 'Leverage strong positive collaboration and attitude by assigning as a buddy for newer hires.',
    });
  }

  return (
    <div className="manager-grid">
      {/* Left panel: sliders and trend graphs */}
      <div>
        <PageHeader title="Employee Evaluation" subtitle="Probation review and feedback pipeline" />

        <Card className="evaluation-card" style={{ padding: 0 }}>
          <form onSubmit={handleSave} style={{ padding: '24px' }}>
            <div className="panel-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>MONTHLY GRADES</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CURRENT PERIOD</span>
            </div>

            <div className="slider-group" style={{ marginBottom: '24px' }}>
              <div className="slider-container">
                <div className="slider-info">
                  <span className="slider-label">Technical Efficiency</span>
                  <span className="slider-value">{tech.toFixed(1)}/5.0</span>
                </div>
                <input type="range" min="1" max="5" step="0.5" value={tech} onChange={(e) => setTech(parseFloat(e.target.value))} />
              </div>

              <div className="slider-container">
                <div className="slider-info">
                  <span className="slider-label">Ability to Learn</span>
                  <span className="slider-value">{learn.toFixed(1)}/5.0</span>
                </div>
                <input type="range" min="1" max="5" step="0.5" value={learn} onChange={(e) => setLearn(parseFloat(e.target.value))} />
              </div>

              <div className="slider-container">
                <div className="slider-info">
                  <span className="slider-label">Ability to Adapt</span>
                  <span className="slider-value">{adapt.toFixed(1)}/5.0</span>
                </div>
                <input type="range" min="1" max="5" step="0.5" value={adapt} onChange={(e) => setAdapt(parseFloat(e.target.value))} />
              </div>

              <div className="slider-container">
                <div className="slider-info">
                  <span className="slider-label">Attitude</span>
                  <span className="slider-value">{attitude.toFixed(1)}/5.0</span>
                </div>
                <input type="range" min="1" max="5" step="0.5" value={attitude} onChange={(e) => setAttitude(parseFloat(e.target.value))} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span className="slider-label" style={{ display: 'block', marginBottom: '8px' }}>Month Rating</span>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`material-symbols-outlined star-icon ${i <= starsCount ? 'filled' : ''}`}>
                    star
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px' }}>
              <div>
                <span className="slider-label">Current Period Score</span>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average calculated dynamically</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-headline)' }}>{liveAverage.toFixed(2)}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 5.0</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span className="slider-label">Fit for Role Status</span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
                <div className={`fit-role-alert ${fitClass}`} style={{ flex: 1 }}>
                  <div className="fit-role-icon-bg">
                    <span className="material-symbols-outlined">{fitIcon}</span>
                  </div>
                  <div className="fit-role-content">
                    <span className="fit-role-status-text">{fitStatus}</span>
                    <span className="fit-role-message-text">{fitMessage}</span>
                  </div>
                </div>

                <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className="slider-label">Remarks</span>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide qualitative feedback on recent achievements..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      outline: 'none',
                      fontSize: '0.85rem',
                      resize: 'none',
                      background: 'var(--bg)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <Button type="submit" variant="primary" disabled={isSaving}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>save</span>
                {isSaving ? 'Saving...' : 'Save Evaluation'}
              </Button>
            </div>
          </form>
        </Card>

        <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: '24px', marginTop: '24px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="slider-label" style={{ marginBottom: '8px' }}>Fit for Role Recommendation</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>verified</span>
              <strong style={{ fontSize: '1.1rem', fontWeight: 800 }}>Strongly Recommended</strong>
            </div>
          </div>
          <div style={{ width: '1px', background: 'var(--border)' }}></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '16px' }}>
            <span className="slider-label" style={{ marginBottom: '8px' }}>Average Performance Score</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{savedAverageScore.toFixed(2)}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 5.0</span>
              <span
                style={{
                  marginLeft: '12px',
                  background: averageDelta >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: averageDelta >= 0 ? 'var(--success)' : 'var(--danger)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>{averageDelta >= 0 ? 'trending_up' : 'trending_down'}</span>
                {averageDelta >= 0 ? '+' : ''}{averageDelta.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        <div style={{ marginTop: '24px' }}>
          <span className="slider-label" style={{ display: 'block', marginBottom: '16px' }}>Performance Trends</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <Card style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '10px' }}>Tech Efficiency</span>
              <div style={{ height: '70px' }}>{renderDimensionSvg(techScores, 'var(--secondary)')}</div>
            </Card>

            <Card style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#15803d', marginBottom: '10px' }}>Ability to Learn</span>
              <div style={{ height: '70px' }}>{renderDimensionSvg(learnScores, '#15803d')}</div>
            </Card>

            <Card style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#d97706', marginBottom: '10px' }}>Ability to Adapt</span>
              <div style={{ height: '70px' }}>{renderDimensionSvg(adaptScores, '#d97706')}</div>
            </Card>

            <Card style={{ padding: '16px', marginBottom: 0 }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '10px' }}>Attitude</span>
              <div style={{ height: '70px' }}>{renderDimensionSvg(attitudeScores, 'var(--danger)')}</div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
            <Card style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="slider-label" style={{ marginBottom: '16px' }}>AI Suggestions for Improvement</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {aiSuggestions.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text)' }}>{item.title}</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                <span className="slider-label">Total Calculated Score Trend</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', maxWidth: '260px' }}>
                  Monthly average of Tech + Learn + Adapt + Attitude
                </span>
              </div>
              <div style={{ height: '140px', flex: 1 }}>{renderTotalAvgSvg(totalScores)}</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Right side profile panel */}
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <img src={associate.avatar} alt={associate.name} className="profile-avatar" />
        </div>
        <h3 className="profile-name">{associate.name}</h3>
        <Badge
          variant={associate.status === 'On Track' ? 'success' : 'danger'}
          className="profile-badge"
        >
          {associate.status}
        </Badge>

        <div className="profile-details-list">
          <div className="profile-details-row">
            <span>Employee ID</span>
            <strong>{associate.employeeId}</strong>
          </div>
          <div className="profile-details-row">
            <span>Join Date</span>
            <strong>{associate.joinDate}</strong>
          </div>
          <div className="profile-details-row">
            <span>Manager</span>
            <strong>{associate.manager}</strong>
          </div>
          <div className="profile-details-row">
            <span>Probation</span>
            <strong>{associate.probation}</strong>
          </div>
        </div>

        <div className="project-progress-card">
          <h4>Current Project</h4>
          <strong className="project-name" style={{ display: 'block' }}>{associate.project.name}</strong>
          <span className="project-phase" style={{ display: 'block' }}>Phase: {associate.project.phase}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 6px', fontSize: '0.75rem', fontWeight: 700 }}>
            <span>Progress</span>
            <span>{associate.project.progress}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${associate.project.progress}%` }}></div>
          </div>
          <div className="project-status">
            <span
              className="project-status-dot"
              style={{ background: associate.project.status === 'Healthy' ? 'var(--success)' : 'var(--warning)' }}
            ></span>
            <span style={{ color: associate.project.status === 'Healthy' ? 'var(--success)' : 'var(--warning)' }}>
              {associate.project.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Button type="button" variant="outline" onClick={() => toast.success('Starting chat with ' + associate.name)}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>message</span>
            Message
          </Button>
          <Button type="button" variant="outline" onClick={() => toast.success('Preparing email for ' + associate.name)}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>mail</span>
            Email
          </Button>
        </div>
      </div>
    </div>
  );
}
