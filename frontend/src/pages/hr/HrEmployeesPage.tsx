import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { useAuth } from '../../contexts/AuthContext';
import { useApiData } from '../../hooks/useApiData';
import { hrService } from '../../services/hr.service';
import type { Employee } from '../../types';

export function HrEmployeesPage() {
  const { token } = useAuth();
  const { data, isLoading, error, isServiceUnavailable, refetch } = useApiData(
    () => hrService.getEmployees(token!),
    [token],
  );

  if (isLoading) return <LoadingSpinner message="Loading employees..." />;

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
        title="Employees"
        subtitle="Manage and view employee records"
      />

      <Card>
        <Table<Employee>
          data={data?.employees || []}
          keyExtractor={(emp) => emp.id}
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Name', accessor: 'name' },
            { header: 'Department', accessor: 'department' },
            { header: 'Position', accessor: 'position' },
            {
              header: 'Status',
              accessor: (emp) => (
                <Badge variant={emp.status === 'Active' ? 'success' : 'warning'}>
                  {emp.status}
                </Badge>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
