import { IUsers } from "@/types/user";

export const ColumnAdministrator = [
  {
    name: "Name",
    selector: (row: IUsers) => row.name,
    sortable: true,
  },
  {
    name: "Email",
    selector: (row: IUsers) => row.email,
    sortable: true,
  },
  {
    name: "No HandPhone",
    selector: (row: IUsers) => row.phone,
    sortable: true,
  },
  {
    name: "Placement Status",
    selector: (row: IUsers) => row.location.toUpperCase(),
    sortable: true,
  },
  {
    name: "Role",
    selector: (row: IUsers) => row.role,
    sortable: true,
  },
  {
    name: "Status",
    selector: (row: any) => row.status_comp,
    sortable: true,
  },
  {
    name: "Address",
    width: "200px",
    selector: (row: IUsers) => row.address || "-",
    sortable: true,
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    sortable: true,
  },
];
