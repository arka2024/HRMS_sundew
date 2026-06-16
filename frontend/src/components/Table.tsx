import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
}

export function Table<T>({ data, columns, keyExtractor, onRowClick }: TableProps<T>) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr 
              key={keyExtractor(row)} 
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col, idx) => {
                const content = typeof col.accessor === 'function' 
                  ? col.accessor(row) 
                  : row[col.accessor as keyof T] as React.ReactNode;
                  
                return (
                  <td key={idx} className={col.className}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px' }}>
                <span style={{ color: 'var(--text-muted)' }}>No data available</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
