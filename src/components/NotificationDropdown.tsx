import { X, Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { NotificationData } from "@/types/notification";
import { fetchNotificationsServer, fetchUnreadNotificationsServer, markNotificationAsRead } from "@/utils/notification";
import { useRouter } from "next/router";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialNotifications?: NotificationData[];
    initialUnreadNotifications?: NotificationData[];
}

export default function NotificationDropdown({
    isOpen,
    onClose,
    initialNotifications,
    initialUnreadNotifications,
}: Props) {
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
    const [notifications, setNotifications] = useState<NotificationData[]>(initialNotifications || []);
    const [unreadNotifications, setUnreadNotifications] = useState<NotificationData[]>(initialUnreadNotifications || []);
    const [limit, setLimit] = useState(7);
    const [unreadLimit, setUnreadLimit] = useState(7);
    const [loading, setLoading] = useState(false);
    const { token } = useAuthStore();
    const { setSelectedNotification } = useNotificationStore();
    const router = useRouter();

    const handleNotificationClick = async (notification: NotificationData) => {
        setSelectedNotification(notification);
        if (!notification.is_read) {
            await markNotificationAsRead(token || "", notification.id);
            // Optionally update local state to show it's read immediately
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
            setUnreadNotifications(prev => prev.filter(n => n.id !== notification.id));
        }
        router.push(`/main/notification/${notification.id}`);
        onClose();
    };

    const fetchingRef = React.useRef(false);

    useEffect(() => {
        if (!isOpen || fetchingRef.current) return;

        // Skip fetch if we have initial data and haven't increased the limit yet
        if (activeTab === "all") {
            if (initialNotifications && notifications.length > 0 && limit === 7) return;
        } else {
            if (initialUnreadNotifications && unreadNotifications.length > 0 && unreadLimit === 7) return;
        }

        const fetchNotifications = async () => {
            setLoading(true);
            fetchingRef.current = true;
            try {
                const currentLimit = activeTab === "all" ? limit : unreadLimit;
                const data = activeTab === "all"
                    ? await fetchNotificationsServer(token || "", currentLimit)
                    : await fetchUnreadNotificationsServer(token || "", currentLimit);

                if (data?.data) {
                    if (activeTab === "all") {
                        setNotifications(data.data);
                    } else {
                        setUnreadNotifications(data.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
                fetchingRef.current = false;
            }
        };

        fetchNotifications();
    }, [isOpen, limit, unreadLimit, token, initialNotifications, initialUnreadNotifications, activeTab]);

    if (!isOpen) return null;

    const filteredNotifications =
        activeTab === "unread"
            ? unreadNotifications
            : notifications;

    return (
        <div className="absolute top-14 right-[-100px] lg:right-0 w-[420px] bg-white rounded-lg shadow-2xl border border-gray-100 z-50 overflow-hidden mt-2">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
                <h3 className="text-orange-500 font-bold text-lg">Notification</h3>
                <button
                    onClick={onClose}
                    className="text-red-500 hover:text-red-600 transition-colors"
                >
                    <X className="w-5 h-5 stroke-[3]" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors duration-200 text-center ${activeTab === "all"
                        ? "border-b-2 border-orange-500 text-orange-500 bg-gradient-to-t from-orange-50/50 to-transparent"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-white"
                        }`}
                >
                    All Notifications
                </button>
                <button
                    onClick={() => setActiveTab("unread")}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors duration-200 text-center ${activeTab === "unread"
                        ? "border-b-2 border-orange-500 text-orange-500 bg-gradient-to-t from-orange-50/50 to-transparent"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-white"
                        }`}
                >
                    Unread
                </button>
            </div>

            {/* Notification List */}
            <div className="max-h-[460px] overflow-y-auto bg-[#faf9f4] relative min-h-[100px]">
                {loading && notifications.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                ) : null}

                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-5 py-4 border-b border-gray-200 flex gap-4 transition-colors cursor-pointer group hover:bg-gray-50 ${!notification.is_read ? "" : "opacity-80 mx-2"
                                }`}
                        >
                            {/* Avatar */}
                            <div className="relative shrink-0 w-11 h-11 rounded-full overflow-hidden bg-gray-200 shadow-sm border border-gray-100 flex items-center justify-center">
                                <Image
                                    src={`/images/default-photo.svg`}
                                    alt={notification.actor_name || "UserAvatar"}
                                    layout="fill"
                                    objectFit="cover"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-2">
                                <p className="text-[13px] text-gray-800 leading-relaxed capitalize">
                                    {notification.action_detail}
                                </p>
                                <p className="text-[13px] text-gray-500 mt-1 font-medium capitalize">
                                    {notification.relative_time}
                                </p>
                            </div>

                            {/* Unread Indicator */}
                            <div className="shrink-0 flex justify-center w-4 mt-2">
                                {!notification.is_read && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm mt-1"></div>
                                )}
                            </div>
                        </div>
                    ))
                ) : !loading ? (
                    <div className="p-8 text-center text-gray-500 text-sm font-medium">
                        No notifications found.
                    </div>
                ) : null}
            </div>

            {/* Footer / Load More */}
            <div className="p-4 bg-[#faf9f4] border-t border-gray-200">
                <button
                    onClick={() => {
                        if (activeTab === "all") {
                            setLimit((prev) => prev + 7);
                        } else {
                            setUnreadLimit((prev) => prev + 7);
                        }
                    }}
                    disabled={loading}
                    className="w-full h-11 flex items-center justify-center text-sm font-bold text-orange-500 border border-gray-200 rounded-lg transition-colors bg-white shadow-sm hover:shadow-md disabled:opacity-50"
                >
                    {loading && filteredNotifications.length > 0 ? (
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    ) : (
                        "Load Previous"
                    )}
                </button>
            </div>
        </div>
    );
}
