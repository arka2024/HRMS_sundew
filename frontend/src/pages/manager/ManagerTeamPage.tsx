import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { managerService, type Associate } from '../../services/manager.service';
import { ROUTES } from '../../constants';

export function ManagerTeamPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadTeam() {
    setIsLoading(true);
    setError(null);
    managerService
      .getAssociates(token!)
      .then((data) => {
        setAssociates(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load team:', err);
        setError('Failed to connect to Manager Service backend.');
        setIsLoading(false);
      });
  }

  useEffect(() => {
    if (token) {
      loadTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}'s probation record? This action is permanent.`)) {
      return;
    }

    try {
      await managerService.deleteAssociate(token!, id);
      toast.success(`${name}'s record has been deleted.`);
      loadTeam();
    } catch {
      toast.error('Failed to delete associate record.');
    }
  }

  if (isLoading) return <LoadingSpinner message="Loading team members..." />;

  if (error) {
    return <ServiceError message={error} onRetry={loadTeam} />;
  }

  return (
    <div>
      <PageHeader
        title="My Team"
        subtitle="Direct reports and performance overview"
      />

      <section className="card-grid">
        {associates.map((associate) => {
          const curAvg = (associate.currentEvaluation.tech + associate.currentEvaluation.learn + associate.currentEvaluation.adapt + associate.currentEvaluation.attitude) / 4;
          const histAvg = associate.history.length > 0
            ? associate.history.reduce((sum, h) => sum + h.average, 0) / associate.history.length
            : curAvg;
          const overallAvg = (curAvg + histAvg) / 2;

          return (
            <Card 
              key={associate.id} 
              className="associate-card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 0 }}
            >
              <div>
                <div className="associate-card-header">
                  <div className="associate-card-profile">
                    <img src={associate.avatar} alt={associate.name} className="associate-card-avatar" />
                    <div>
                      <h4 className="associate-card-name" style={{ margin: 0 }}>{associate.name}</h4>
                      <span className="associate-card-id">{associate.employeeId}</span>
                    </div>
                  </div>
                  <Badge
                    variant={associate.status === 'On Track' ? 'success' : 'danger'}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {associate.status}
                  </Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Manager:</span>
                    <strong style={{ color: 'var(--text)' }}>{associate.manager}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Timeline:</span>
                    <strong style={{ color: 'var(--text)' }}>{associate.probation}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Project:</span>
                    <strong style={{ color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{associate.project.name}</strong>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Average Score</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--secondary)' }}>{overallAvg.toFixed(2)}/5.0</strong>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`${ROUTES.MANAGER.DASHBOARD}?id=${associate.id}`)}
                    style={{ flex: 1 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>rate_review</span>
                    Review Dashboard
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(associate.id, associate.name)}
                    style={{ padding: '8px 10px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

