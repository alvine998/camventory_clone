import { toMoney } from "../utils";
export const ColumnSalesCustomer: any[] = [
  {
    name: "Customer",
    selector: (row: any) => row?.customer_name || "-",
    sortable: true,
  },
  {
    name: "Phone Number",
    selector: (row: any) => row?.phone_number || "-",
    sortable: true,
  },
  {
    name: "Total Visit",
    selector: (row: any) => row?.total_visit || "-",
    sortable: true,
  },
  {
    name: "Total Transaction",
    selector: (row: any) => toMoney(row?.total_transaction) || "-",
    sortable: true,
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    sortable: false,
  },
];
