import { fetchNotificationDetailServer, fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import { parse } from "cookie";
import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import { NotificationData } from "@/types/notification";
import { Bell, ArrowLeft, Calendar, User, Info, Tag } from "lucide-react";
import { useRouter } from "next/router";
import Button from "@/components/Button";
import moment from "moment";
import Head from "next/head";
import { useNotificationStore } from "@/stores/useNotificationStore";

interface Props {
    notification: NotificationData | null;
    notifications: NotificationData[];
    unreadNotifications: NotificationData[];
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const { params, req } = ctx;
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.token || "";
    const id = params?.id as string;

    try {
        if (!token) {
            return {
                redirect: {
                    destination: "/",
                    permanent: false,
                },
            };
        }

        const [notification, notificationsData, unreadNotificationsData] = await Promise.all([
            fetchNotificationDetailServer(token, id),
            fetchNotificationsServer(token),
            fetchUnreadNotificationsServer(token),
        ]);

        return {
            props: {
                notification: notification || null,
                notifications: notificationsData?.data || [],
                unreadNotifications: unreadNotificationsData?.data || [],
            },
        };
    } catch (error) {
        console.error("Error in Notification Detail SSR:", error);
        return {
            props: {
                notification: null,
                notifications: [],
                unreadNotifications: [],
            },
        };
    }
};

export default function NotificationDetailPage({ notification: ssrNotification }: Props) {
    const router = useRouter();
    const { id } = router.query;
    const { selectedNotification } = useNotificationStore();
    const [notification, setNotification] = useState<NotificationData | null>(ssrNotification);

    useEffect(() => {
        // Prefer store data if it matches the current route ID
        if (selectedNotification && String(selectedNotification.id) === String(id)) {
            setNotification(selectedNotification);
        } else if (ssrNotification) {
            setNotification(ssrNotification);
        }
    }, [selectedNotification, id, ssrNotification]);

    if (!notification) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold">Notification not found</h2>
                <Button
                    onClick={() => router.back()}
                    variant="custom-color"
                    className="mt-4 bg-orange-500 text-white"
                >
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Head>
                <title>Notification Detail | Camventory</title>
            </Head>

            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors mb-6 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to previous page</span>
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-8 py-10 text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                            {notification.action_label}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold leading-tight capitalize">
                        {notification.action_detail}
                    </h1>
                </div>

                {/* Content */}
                <div className="p-8 grid md:grid-group-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-500">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Performed By</p>
                                <p className="text-gray-800 font-semibold">{notification.actor_name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-500">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Target Type / ID</p>
                                <p className="text-gray-800 font-semibold capitalize">
                                    {notification.target_type} - {notification.target_id}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-500">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Date & Time</p>
                                <p className="text-gray-800 font-semibold">
                                    {moment(notification.created_at).format("MMMM Do YYYY, h:mm:ss a")}
                                </p>
                                <p className="text-sm text-gray-500 italic">({notification.relative_time})</p>
                            </div>
                        </div>
                    </div>

                    {/* <div className="flex flex-col justify-end gap-3">
                        <Button
                            variant="custom-color"
                            className="w-full bg-orange-500 text-white h-12 shadow-lg hover:shadow-orange-200 transition-all font-bold"
                            onClick={() => {
                                // If target is checkout or reservation, we could redirect there
                                if (notification.target_type === 'checkout') {
                                    router.push(`/main/reservation/${notification.target_id}/detail`);
                                } else if (notification.target_type === 'item') {
                                    router.push(`/main/items/${notification.target_id}/detail`);
                                }
                            }}
                        >
                            View Related {notification.target_type === 'checkout' ? 'Reservation' : 'Item'}
                        </Button>
                    </div> */}
                </div>
            </div>
        </div>
    );
}
