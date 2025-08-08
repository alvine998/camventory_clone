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
}
