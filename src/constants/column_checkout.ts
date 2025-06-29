import { toMoney } from "@/utils";

export const ColumnCheckout = [
  {
    name: "Checkout ID",
    selector: (row: any) => row.id,
    sortable: true,
  },
  {
    name: "Employee",
    selector: (row: any) => row.item_name,
    sortable: true,
  },
  {
    name: "Taking Goods",
    selector: (row: any) => row.brand?.name || "-",
    sortable: true,
  },
  {
    name: "Returned Items",
    selector: (row: any) => row.category?.name || "-",
    sortable: true,
  },
  {
    name: "Duration",
    selector: (row: any) => "Rp " + toMoney(row.rate_day),
    sortable: true,
  },
//   {
//     name: "Flag Status",
//     selector: (row: any) => row.status_booking,
//     sortable: true,
//   },
//   {
//     name: "Location",
//     selector: (row: any) => row.location,
//     sortable: true,
//   },
//   {
//     name: "Action",
//     selector: (row: any) => row.action,
//     sortable: true,
//   },
];