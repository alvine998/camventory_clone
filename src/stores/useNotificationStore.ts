import { NotificationData } from "@/types/notification";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationState {
  selectedNotification: NotificationData | null;
  setSelectedNotification: (notification: NotificationData | null) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      selectedNotification: null,
      setSelectedNotification: (notification) =>
        set({ selectedNotification: notification }),
    }),
    {
      name: "notification-storage",
    },
  ),
);
