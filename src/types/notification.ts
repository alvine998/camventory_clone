export interface NotificationData {
  id: number;
  actor_id: string;
  actor_name: string;
  target_type: string;
  target_id: string;
  target_name: string;
  action_type: string;
  action_label: string;
  action_detail: string;
  is_read: boolean;
  created_at: string;
  relative_time: string;
}

export interface NotificationResponse {
  message: string;
  status: number;
  data: NotificationData[];
  error?: {
    code: number;
    message: string;
    status: boolean;
  };
}
