export interface IReservation {
  id: string;
  book_id: string;
  customer_id: string;
  pickup_location: string;
  start_date: number;
  end_date: number;
  status: string;
  description: string;
  created_at: number;
  updated_at: number;
  action?: any;
  ref_customer: RefCustomer;
  ref_user: RefUser;
  details: IDetail[];
}

export interface IDetail {
  id: string;
  item_id: string;
  item_name: string;
  item_image_path: string;
  item_type: string;
  start_date: number;
  end_date: number;
  status: string;
  rate_day: number;
  qty: number;
}

export interface RefCustomer {
  id: string;
  nik: string;
  name: string;
  path_ktp: string;
  member_no: string;
  created_at: Date;
  deleted_at: null;
  updated_at: Date;
  updated_by: string;
  phone_number: string;
  instagram_acc: string;
  status: string;
}

export interface RefUser {
  id: string;
  hash: string;
  name: string;
  role: string;
  salt: string;
  email: string;
  phone: string;
  status: string;
  address: string;
  location: string;
  created_at: Date;
  deleted_at: null;
  last_login: Date;
  updated_at: Date;
}

// Calendar API Types
export interface ICalendarItem {
  name: string;
}

export interface ICalendarReservation {
  reservation_id: string;
  admin_name: string;
  pickup_location: string;
  start_date: string;
  end_date: string;
  status: string;
  customer_name: string;
  book_id: string;
  list_item: ICalendarItem[];
}

export interface ICalendarResponse {
  message: string;
  status: number;
  data: ICalendarReservation[];
  error: {
    code: number;
    message: string;
    status: boolean;
  };
}

export interface IReservationLog {
  id: string;
  note: string;
  created_at: string;
}

export interface IReservationLogResponse {
  meta: {
    total_data: number;
    total_data_per_page: number;
    current_page: number;
    previous_page: number;
    total_page: number;
    next_page_url: string;
    previous_page_url: string;
    first_page_url: string;
    last_page_url: string;
  };
  message: string;
  status: number;
  data: IReservationLog[];
  error: {
    code: number;
    message: string;
    status: boolean;
  };
}
