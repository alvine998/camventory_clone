export interface IReservation {
  id: string;
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
