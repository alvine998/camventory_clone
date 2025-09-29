import { toMoney } from "@/utils";

export const ColumnSalesProduct: any[] = [
  {
    name: "No Item",
    selector: (row: any) => row?.product_id || "-",
    sortable: true,
  },
  {
    name: "Product",
    selector: (row: any) => row?.product_name || "-",
    sortable: true,
  },
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
    name: "Unit",
    selector: (row: any) => row?.unit || "-", // pcs
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
