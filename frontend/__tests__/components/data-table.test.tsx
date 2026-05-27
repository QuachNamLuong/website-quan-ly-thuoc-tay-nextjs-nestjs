import { render, screen } from '@testing-library/react';
import { DataTable, type Column } from '@/components/common/data-table';

interface Row {
  id: string;
  name: string;
  age: number;
}

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', render: (r) => r.name },
  { key: 'age', header: 'Age', render: (r) => String(r.age) },
];

describe('DataTable', () => {
  it('renders headers', () => {
    render(<DataTable columns={columns} data={[]} rowKey={(r) => r.id} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey={(r) => r.id}
        emptyMessage="No rows"
      />,
    );
    expect(screen.getByText('No rows')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <DataTable columns={columns} data={[]} isLoading rowKey={(r) => r.id} />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders rows', () => {
    const data: Row[] = [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 },
    ];
    render(<DataTable columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});
