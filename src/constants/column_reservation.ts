import { IReservation } from "@/types/reservation";

export const ColumnReservation = [
  {
    name: "Book ID",
    selector: (row: IReservation) => row.book_id,
    sortable: true,
  },
  {
    name: "Customer Name",
    selector: (row: IReservation) => row.ref_customer?.name || "-",
    sortable: true,
  },
  {
    name: "Rental Duration",
    selector: (row: any) => row.rental_duration,
    sortable: true,
  },
  {
    name: "Start Date",
    selector: (row: IReservation) => row.start_date,
    sortable: true,
  },
  {
    name: "End Date",
    selector: (row: IReservation) => row.end_date,
    sortable: true,
  },
  {
    name: "Pickup Location",
    selector: (row: IReservation) => row.pickup_location,
    sortable: true,
  },
  {
    name: "Action",
    selector: (row: IReservation) => row.action,
    sortable: true,
  },
];
