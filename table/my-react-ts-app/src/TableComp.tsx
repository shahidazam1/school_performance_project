import { useState } from "react";
import EnterpriseTable from "./EnterpriseTable/EnterpriseTable";
import type { TableColumn } from "./EnterpriseTable/types";
import TableToolbar from "./EnterpriseTable/TableToolbar";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  address?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

const users: User[] = [
  {
    id: 1,
    name: "Shahid",
    email: "shahid@example.com",
    role: "Admin",
    status: "Active",
    address: "123 Main St",
    phone: "555-1234",
    createdAt: "2023-01-01",
    updatedAt: "2023-01-01",
  },
  {
    id: 2,
    name: "John",
    email: "john@example.com",
    role: "User",
    status: "Inactive",
    address: "456 Elm St",
    phone: "555-5678",
    createdAt: "2023-02-01",
    updatedAt: "2023-02-01",
  },
  {
    id: 3,
    name: "Jane",
    email: "jane@example.com",
    role: "User",
    status: "Active",
    address: "789 Oak Ave",
    phone: "555-9012",
    createdAt: "2023-03-01",
    updatedAt: "2023-03-01",
  },
  {
    id: 4,
    name: "Alice",
    email: "alice@example.com",
    role: "User",
    status: "Active",
    address: "101 Pine St",
    phone: "555-3456",
    createdAt: "2023-04-01",
    updatedAt: "2023-04-01",
  },
  {
    id: 5,
    name: "Bob",
    email: "bob@example.com",
    role: "User",
    status: "Active",
    address: "202 Maple Dr",
    phone: "555-7890",
    createdAt: "2023-05-01",
    updatedAt: "2023-05-01",
  },
];

const columns: TableColumn<User>[] = [
  {
    key: "name",
    title: "User",
    dataKey: "name",

    render: (value: unknown, row: User, _index: number) => (
      <div>
        <strong>{String(value)}</strong>
        <small>{row.email}</small>
      </div>
    ),
  },

  {
    key: "email",
    title: "Email",
    dataKey: "email",
    width: 250,
    resizable: true,
  },

  {
    key: "role",
    title: "Role",
    dataKey: "role",
    width: 150,
  },

  {
    key: "status",
    title: "Status",
    dataKey: "status",
    width: 120,

    render: (value: unknown) => <span>{String(value)}</span>,
  },
  {
    key: "createdAt",
    title: "Created At",
    dataKey: "createdAt",
    width: 150,
    hidden: true,
  },
  {
    key: "updatedAt",
    title: "Updated At",
    dataKey: "updatedAt",
    width: 150,
    hidden: true,
  },
  {
    key: "address",
    title: "Address",
    dataKey: "address",
    width: 300,
    hidden: true,
  },
];

const actionsColumn: TableColumn<User> = {
  key: "actions",
  title: "Actions",

  render: (_, _row) => (
    <div>
      <button
      // onClick={() => handleEdit(row)}
      >
        Edit
      </button>

      <button
      // onClick={() => handleDelete(row)}
      >
        Delete
      </button>
    </div>
  ),
};

const TableComp = () => {
  const [search, setSearch] = useState("");
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() =>
    columns.filter((column) => !column.hidden).map((column) => column.key),
  );
  const configuredColumns = columns.map((column) => ({
    ...column,
    hidden: !visibleColumnKeys.includes(column.key),
  }));

  return (
    <>
      <EnterpriseTable
        data={users}
        columns={configuredColumns}
        rowKey="id"
        actionsColumn={actionsColumn}
        stickyActions
        selectionMode="multiple" //single, multiple, none
        onSelectionChange={(selectedRows, selectedKeys) => {
          console.log(selectedRows);
          console.log(selectedKeys);
        }}
        loading={false}
        size="medium"
        height={600}
        width="100%"
        stickyHeader
        emptyState={{
          image: "/images/no-data.svg",
          title: "No users found",
          description: "There are no users matching the selected filters.",
        }}
        pagination={{
          page: 2,
          pageSize: 25,
          totalCount: 1240,

          pageSizeOptions: [10, 25, 50, 100],

          onPageChange: (_page) => {
            // fetchUsers({
            //   page,
            //   pageSize: 25,
            // });
          },

          onPageSizeChange: (_pageSize) => {
            // fetchUsers({
            //   page: 1,
            //   pageSize,
            // });
          },
          //        onPageChange: handlePageChange,
          // onPageSizeChange: handlePageSizeChange,
        }}
        resizableColumns
        striped
        headerColor="#F8F9FC"
        // onRowClick={handleRowClick}

        toolbar={
          <TableToolbar
            search={{
              value: search,
              placeholder: "Search users...",
              onChange: setSearch,
              onClear: () => setSearch(""),
            }}
            filter={{
              label: "Filters",
              count: 3,
              onClick: () => {
                console.log("Open filters");
              },
            }}
            columns={{
              items: columns.map((column) => ({
                key: column.key,
                label: column.title,
                checked: visibleColumnKeys.includes(column.key),
                disabled: column.hideable === false,
              })),
              onToggle: (key) => {
                setVisibleColumnKeys((current) =>
                  current.includes(key)
                    ? current.filter((visibleKey) => visibleKey !== key)
                    : [...current, key],
                );
              },
            }}
            refresh={{
              loading: false,
              onClick: () => {
                console.log("Refresh");
              },
            }}
            export={{
              label: "Export",
              onClick: () => {
                console.log("Export");
              },
            }}
          />
        }
      />
    </>
  );
};
export default TableComp;
