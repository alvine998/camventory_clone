import { toMoney } from "@/utils";

export const ColumnItems = [
  {
    name: "No",
    selector: (row: any) => row.id,
    sortable: true,
  },
  {
    name: "Item Name",
    selector: (row: any) => row.item_name,
    sortable: true,
  },
  {
    name: "Brand",
    selector: (row: any) => row.brand?.name || "-",
    sortable: true,
  },
  {
    name: "Category",
    selector: (row: any) => row.category?.name || "-",
    sortable: true,
  },
  {
    name: "Rate Daily",
    selector: (row: any) => "Rp " + toMoney(row.rate_day),
    sortable: true,
  },
  {
    name: "Flag Status",
    selector: (row: any) => row.flag_status,
    sortable: true,
  },
  {
    name: "Location",
    selector: (row: any) => row.location,
    sortable: true,
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    sortable: true,
  },
];

export const ColumnBulkItems = [
  {
    name: "No",
    selector: (row: any) => row.id,
    sortable: true,
  },
  {
    name: "Item Name",
    selector: (row: any) => row.item_name,
    sortable: true,
  },
  {
    name: "Brand",
    selector: (row: any) => row.brand?.name || "-",
    sortable: true,
  },
    {
    name: "QTY",
    selector: (row: any) => row.qty || "-",
    sortable: true,
  },
  {
    name: "Rate Daily",
    selector: (row: any) => "Rp " + toMoney(row.rate_day),
    sortable: true,
  },
  {
    name: "Location",
    selector: (row: any) => row.location,
    sortable: true,
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    sortable: true,
  },
];
