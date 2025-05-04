
export const ColumnCustomer = [
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
    selector: (row: any) => row.brand,
    sortable: true,
  },
  {
    name: "Category",
    selector: (row: any) => row.category,
    sortable: true,
  },
  {
    name: "Rate Daily",
    selector: (row: any) => row.rate,
    sortable: true,
  },
  {
    name: "Flag Status",
    selector: (row: any) => row.status,
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
