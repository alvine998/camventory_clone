export interface IBulkItems {
  id: string;
  full_path_image: string;
  brand_id?: string;
  model: string;
  name: string;
  purchase_date: number;
  warranty_date: number;
  location: string;
  completeness: string;
  rate_day: number;
  serial_number: string;
  image_path: string;
  barcode: string;
  status_booking: string;
  status_items: string;
  created_at: number;
  updated_at: number;
  purchase_price: number;
  qty?: number;
  category_name: string;
}
