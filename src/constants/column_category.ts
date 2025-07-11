export const ColumnCategory: any[] = [
  {
    name: "No",
    selector: (row: any, index: number) => index + 1,
    sortable: true,
  },
  {
    name: "Category Name",
    selector: (row: any) => row.name || "-",
    sortable: true,
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    sortable: true,
  },
];
