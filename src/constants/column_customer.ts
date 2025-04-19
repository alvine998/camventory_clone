import { ICustomer } from "@/types/customer";

export const ColumnCustomer = [
    {
        name: "Customer's ID Card Photo",
        selector: (row: any) => row.ktp,
        sortable: true
    },
    {
        name: "Customer Name",
        selector: (row: ICustomer) => row.name,
        sortable: true
    },
    {
        name: "NIK",
        selector: (row: ICustomer) => row.nik,
        sortable: true
    },
    {
        name: "Phone Number",
        selector: (row: ICustomer) => row.phone_number,
        sortable: true
    },
    {
        name: "Member No",
        selector: (row: ICustomer) => row.member_no,
        sortable: true
    },
    {
        name: "Action",
        selector: (row: any) => row.action,
        sortable: true
    },
]