import { toMoney } from "@/utils";

export const ColumnSalesCategory: any[] = [
  {
    name: "Category",
    selector: (row: any) => row?.category || "-",
    sortable: true,
  },
  {
    name: "Total Rentals",
    selector: (row: any) => toMoney(row.total_rentals) || "-",
    sortable: true,
  },
  {
    name: "Gross Sales",
    selector: (row: any) => "Rp" + toMoney(row.gross_sales) || "-",
    sortable: true,
  },
  {
    name: "Taxes",
    selector: (row: any) => "Rp" + toMoney(row.taxes) || "-",
    sortable: true,
  },
  {
    name: "Sales",
    selector: (row: any) => "Rp" + toMoney(row.sales) || "-",
    sortable: true,
  },
];
