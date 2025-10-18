import { toMoney } from "../utils";
export const ColumnSalesBrand: any[] = [
  {
    name: "Brand",
    selector: (row: any) => row?.brand_name || "-",
    sortable: true,
  },
  {
    name: "Total Rentals",
    selector: (row: any) => toMoney(row?.total_rentals) || "-",
    sortable: true,
  },
  {
    name: "Net Sales",
    selector: (row: any) => toMoney(row?.net_sales) || "-",
    sortable: true,
  },
  {
    name: "Taxes",
    selector: (row: any) => toMoney(row.taxes) || "-",
    sortable: true,
  },
  {
    name: "Sales",
    selector: (row: any) => toMoney(row.sales) || "-",
    sortable: true,
  },
];
