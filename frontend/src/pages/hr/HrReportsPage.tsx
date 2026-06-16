import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { useAuth } from '../../contexts/AuthContext';
import { useApiData } from '../../hooks/useApiData';
import { hrService } from '../../services/hr.service';
import type { Report } from '../../types';

export function HrReportsPage() {
  const { token } = useAuth();
  const { data, isLoading, error, isServiceUnavailable, refetch } = useApiData(
    () => hrService.getReportsSummary(token!),
    [token],
  );

  if (isLoading) return <LoadingSpinner message="Loading reports..." />;

  if (error) {
    return (
      <ServiceError
        message={error}
        onRetry={isServiceUnavailable ? refetch : undefined}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="HR Reports"
        subtitle="Workforce analytics and compliance reports"
      />

      <Card>
        <Table<Report>
          data={data?.reports || []}
          keyExtractor={(rep) => rep.id}
          columns={[
            { header: 'Report', accessor: 'title' },
            { header: 'Type', accessor: 'type' },
            { header: 'Generated', accessor: 'generatedAt' },
            {
              header: 'Status',
              accessor: (rep) => (
                <Badge variant={rep.status === 'Ready' ? 'success' : 'warning'}>
                  {rep.status}
                </Badge>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
