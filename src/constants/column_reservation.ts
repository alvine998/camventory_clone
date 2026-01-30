import { IReservation } from "@/types/reservation";

export const ColumnReservation = [
  {
    name: "Book ID",
    selector: (row: IReservation) => row.book_id,
    sortable: true,
    width: "150px",
  },
  {
    name: "Customer Name",
    selector: (row: any) => row.customer_name_comp,
    sortable: true,
    minWidth: "180px",
    wrap: true,
  },
  {
    name: "Transaction Date",
    selector: (row: any) => row.transaction_date_comp,
    sortable: true,
    width: "150px",
  },
  {
    name: "Rental Duration",
    selector: (row: any) => row.rental_duration,
    sortable: true,
    width: "150px",
  },
  {
    name: "Start Date",
    selector: (row: any) => row.start_date_comp,
    sortable: true,
    minWidth: "120px",
  },
  {
    name: "End Date",
    selector: (row: any) => row.end_date_comp,
    sortable: true,
    minWidth: "120px",
  },
  {
    name: "Taking Goods",
    selector: (row: any) => row.taking_goods_comp,
    sortable: true,
    minWidth: "120px",
  },
  {
    name: "Returned Items",
    selector: (row: any) => row.returned_items_comp,
    sortable: true,
    minWidth: "120px",
  },
  {
    name: "Status",
    selector: (row: any) => row.status_comp,
    sortable: true,
    width: "150px",
  },
  {
    name: "Pickup Location",
    selector: (row: IReservation) => row.pickup_location,
    sortable: true,
    minWidth: "150px",
  },
  {
    name: "Employee",
    selector: (row: any) => row.employee_name,
    sortable: true,
    minWidth: "130px",
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    sortable: false,
    center: true,
    width: "100px",
  },
];
