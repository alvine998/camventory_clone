import axios from "axios";
import { NotificationData, NotificationResponse } from "@/types/notification";

export const fetchNotificationsServer = async (
  token: string,
  limit: number = 7,
): Promise<NotificationResponse | null> => {
  try {
    const baseUrl =
      typeof window !== "undefined"
        ? "/api-proxy"
        : process.env.NEXT_PUBLIC_API_URL;

    const res = await axios.get(
      `${baseUrl}/v1/notification?page=1&limit=${limit}`,
      {
        headers: {
          Authorization: token,
        },
      },
    );
    return res.data;
  } catch (error) {
    console.error("Failed to fetch notifications on server:", error);
    return null;
  }
};

export const fetchUnreadNotificationsServer = async (
  token: string,
  limit: number = 7,
): Promise<NotificationResponse | null> => {
  try {
    const baseUrl =
      typeof window !== "undefined"
        ? "/api-proxy"
        : process.env.NEXT_PUBLIC_API_URL;

    const res = await axios.get(
      `${baseUrl}/v1/notification/unread?page=1&limit=${limit}`,
      {
        headers: {
          Authorization: token,
        },
      },
    );
    return res.data;
  } catch {
    return null;
  }
};

export const markNotificationAsRead = async (
  token: string,
  id: number,
): Promise<boolean> => {
  try {
    await axios.patch(
      `/api-proxy/notification/read/${id}`,
      {},
      {
        headers: {
          Authorization: token,
        },
      },
    );
    return true;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return false;
  }
};

export const fetchNotificationDetailServer = async (
  token: string,
  id: string,
): Promise<NotificationData | null> => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/notification/detail/${id}`,
      {
        headers: {
          Authorization: token,
        },
      },
    );
    return res.data.data || null;
  } catch (error) {
    console.error("Failed to fetch notification detail on server:", error);
    return null;
  }
};
