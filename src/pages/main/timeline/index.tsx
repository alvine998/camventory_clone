import React, { useState, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import { parse } from "cookie";
import { GetServerSideProps } from "next";
import axios from "axios";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import { NotificationData } from "@/types/notification";
import moment from "moment";
import { CONFIG } from "@/config";
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Camera,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import Barcode from "react-barcode";

interface ITimelineItem {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
    customer_name: string;
    book_id: string;
    barcode: string;
    item_name: string;
    full_path_image: string;
}

interface Props {
    initialTimelineData: ITimelineItem[];
    initialMeta: any;
    initialDate: string; // ISO string for the moment object
    initialView: "day" | "week" | "month";
    notifications: NotificationData[];
    unreadNotifications: NotificationData[];
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const { req, query } = ctx;
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    const { page = 1, limit = 10, search = "", date, view = "month" } = query;
    const currentMoment = date ? moment(date as string) : moment();

    // Enforce min 3 chars for search
    const searchQuery = (search as string).length > 3 ? (search as string) : "";

    let startTimestamp: number;
    let endTimestamp: number;

    const selectedView = view as "day" | "week" | "month";

    // Always fetch the full month data for local filtering
    startTimestamp = currentMoment.clone().startOf("month").unix();
    endTimestamp = currentMoment.clone().endOf("month").unix();

    try {
        const [response, notificationsData, unreadNotificationsData] = await Promise.all([
            axios.get(`${CONFIG.API_URL}/v1/timeline`, {
                params: {
                    page,
                    limit,
                    view: selectedView,
                    ...(searchQuery && { search: searchQuery }),
                    startDate: startTimestamp,
                    endDate: endTimestamp,
                },
                headers: { Authorization: token },
            }),
            fetchNotificationsServer(token),
            fetchUnreadNotificationsServer(token),
        ]);

        if (response?.status === 401) {
            return {
                redirect: {
                    destination: "/",
                    permanent: false,
                },
            };
        }

        return {
            props: {
                initialTimelineData: response.data?.data || [],
                initialMeta: response.data?.meta || null,
                initialDate: currentMoment.toISOString(),
                initialView: selectedView,
                notifications: notificationsData?.data || [],
                unreadNotifications: unreadNotificationsData?.data || [],
            },
        };
    } catch (error: any) {
        console.error("SSR Error fetching timeline data:", error);
        if (error?.response?.status === 401) {
            return {
                redirect: {
                    destination: "/",
                    permanent: false,
                },
            };
        }
        return {
            props: {
                initialTimelineData: [],
                initialMeta: null,
                initialDate: currentMoment.toISOString(),
                initialView: selectedView,
                notifications: [],
                unreadNotifications: [],
            },
        };
    }
};

const TimelineImage = ({ src }: { src: string }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError || !src) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-gray-50 text-gray-400">
                <Camera className="w-6 h-6 opacity-30" />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt="Item"
            layout="fill"
            objectFit="cover"
            onError={() => setHasError(true)}
        />
    );
};

export default function TimelinePage({ initialTimelineData, initialMeta, initialDate, initialView, notifications, unreadNotifications }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [timelineData, setTimelineData] = useState<ITimelineItem[]>(initialTimelineData);
    const [currentDate, setCurrentDate] = useState(moment(initialDate));
    const [view, setView] = useState<"day" | "week" | "month">(initialView);
    const [search, setSearch] = useState(router.query.search as string || "");
    const [meta, setMeta] = useState<any>(initialMeta);

    const page = meta?.current_page || 1;
    const limit = meta?.total_data_per_page || 10;

    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleComplete = () => setLoading(false);

        router.events.on("routeChangeStart", handleStart);
        router.events.on("routeChangeComplete", handleComplete);
        router.events.on("routeChangeError", handleComplete);

        // Usage for SSR hydration check
        console.log("Timeline notifications:", notifications?.length);

        return () => {
            router.events.off("routeChangeStart", handleStart);
            router.events.off("routeChangeComplete", handleComplete);
            router.events.off("routeChangeError", handleComplete);
        };
    }, [router, notifications, unreadNotifications]);

    // Sync state with props from SSR
    useEffect(() => {
        setTimelineData(initialTimelineData);
        setMeta(initialMeta);
        setCurrentDate(moment(initialDate));
        setView(initialView);
    }, [initialTimelineData, initialMeta, initialDate, initialView]);

    // Helper to get days based on current view
    const days = useMemo(() => {
        let start: moment.Moment;
        let end: moment.Moment;

        if (view === "day") {
            start = moment(currentDate).startOf("day");
            end = moment(currentDate).endOf("day");
        } else if (view === "week") {
            start = moment(currentDate).startOf("week");
            end = moment(currentDate).endOf("week");
        } else {
            start = moment(currentDate).startOf("month");
            end = moment(currentDate).endOf("month");
        }

        const arr = [];
        const curr = start.clone();
        while (curr.isSameOrBefore(end, "day")) {
            arr.push(curr.clone());
            curr.add(1, "day");
        }
        return arr;
    }, [currentDate, view]);

    const colWidth = useMemo(() => {
        if (view === "day") return 120;
        if (view === "week") return 100;
        return 60; // Month view
    }, [view]);

    const handleNavigation = useCallback((updates: any) => {
        setLoading(true);
        const newQuery = { ...router.query, ...updates };

        // Handle search character limit (min 3 chars)
        if (newQuery.search && newQuery.search.length < 3) {
            delete newQuery.search;
        }

        const currentMonth = moment(currentDate).format("YYYY-MM");
        const nextDate = updates.date ? moment(updates.date) : moment(currentDate);
        const nextMonth = nextDate.format("YYYY-MM");

        const isMonthChange = currentMonth !== nextMonth;
        const isSearchChange = updates.search !== undefined;
        const isPaginationChange = updates.page !== undefined || updates.limit !== undefined;

        // Shallow routing if it's just a view switch or date change within the same month
        // Any search or pagination change MUST hit the server for new data
        const isShallow = !isMonthChange && !isSearchChange && !isPaginationChange;

        // Update local state immediately if shallow
        if (isShallow) {
            if (updates.view) setView(updates.view);
            if (updates.date) setCurrentDate(moment(updates.date));
        }

        // Always update search state locally, regardless of shallow or full navigation
        if (updates.search !== undefined) setSearch(updates.search);

        // Remove empty params for cleaner URL
        if (!newQuery.search) delete newQuery.search;
        if (Number(newQuery.page) === 1) delete newQuery.page;
        if (Number(newQuery.limit) === 10) delete newQuery.limit;
        if (newQuery.view === "month") delete newQuery.view;

        router.push({
            pathname: router.pathname,
            query: newQuery,
        }, undefined, { shallow: isShallow });

        if (isShallow) {
            setLoading(false);
        }
    }, [router, currentDate]);

    const handlePrev = () => {
        const unit = view === "day" ? "day" : view === "week" ? "week" : "month";
        const prevDate = moment(currentDate).subtract(1, unit).format("YYYY-MM-DD");
        handleNavigation({ date: prevDate, page: 1 });
    };

    const handleNext = () => {
        const unit = view === "day" ? "day" : view === "week" ? "week" : "month";
        const nextDate = moment(currentDate).add(1, unit).format("YYYY-MM-DD");
        handleNavigation({ date: nextDate, page: 1 });
    };

    const handleSearch = (val: string) => {
        setSearch(val);
        // Debounce search ideally, but for now just update query
    };

    const triggerSearch = () => {
        if (!search || search.length >= 3) {
            handleNavigation({ search, page: 1 });
        }
    };

    // Group timeline data by item, filtering by current view range
    const groupedData = useMemo(() => {
        const groups: Record<string, {
            item_name: string;
            barcode: string;
            reservations: ITimelineItem[]
            id: string;
            status: string;
            start_date: string;
            end_date: string;
            customer_name: string;
            book_id: string;
            full_path_image: string;
        }> = {};

        // Define the visible range for filtering
        const viewStart = days[0].clone().startOf('day');
        const viewEnd = days[days.length - 1].clone().endOf('day');

        timelineData.forEach((item) => {
            // Check if this reservation overlaps with the current view range
            const itemStart = moment(item.start_date);
            const itemEnd = moment(item.end_date);

            const isVisible = itemEnd.isSameOrAfter(viewStart) && itemStart.isSameOrBefore(viewEnd);
            if (!isVisible) return;

            const key = `${item.item_name}-${item.barcode}`;
            if (!groups[key]) {
                groups[key] = {
                    item_name: item.item_name,
                    barcode: item.barcode,
                    reservations: [],
                    id: item.id,
                    status: item.status,
                    start_date: item.start_date,
                    end_date: item.end_date,
                    customer_name: item.customer_name,
                    book_id: item.book_id,
                    full_path_image: item.full_path_image,
                };
            }
            groups[key].reservations.push(item);
        });

        return Object.values(groups);
    }, [timelineData, days]);

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case "BOOKED":
                return "bg-yellow-400";
            case "CHECKOUT":
                return "bg-blue-500";
            case "CHECKIN":
            case "COMPLETED":
                return "bg-green-500 shadow-green-500/20";
            default:
                return "bg-gray-400 shadow-gray-400/20";
        }
    };

    const getStatusGradient = (status: string) => {
        switch (status?.toUpperCase()) {
            case "BOOKED":
                return "from-amber-400 to-orange-500 shadow-orange-500/20";
            case "CHECKOUT":
                return "from-sky-400 to-blue-600 shadow-blue-500/20";
            case "CHECKIN":
            case "COMPLETED":
                return "from-emerald-400 to-green-600 shadow-green-500/20";
            default:
                return "from-slate-400 to-gray-500 shadow-gray-400/20";
        }
    };
    return (
        <div className="bg-gray-50 min-h-screen">
            <Head>
                <title>Timeline | Camventory</title>
            </Head>

            <div className="p-4 md:p-8">
                <div className="flex items-center gap-2 mb-6 text-gray-400">
                    <ChevronLeft className="w-5 h-5 bg-white rounded-lg shadow-sm cursor-pointer" />
                    <h1 className="text-2xl font-bold text-gray-800">Timeline</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors border border-gray-100">
                                <ChevronLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <h2 className="text-xl font-bold text-orange-500">
                                {view === "day"
                                    ? currentDate.format("DD MMMM YYYY")
                                    : view === "week"
                                        ? `${days[0].format("DD MMM")} - ${days[days.length - 1].format("DD MMM YYYY")}`
                                        : currentDate.format("MMMM YYYY")}
                            </h2>
                            <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors border border-gray-100">
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            {["Day", "Week", "Month"].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => handleNavigation({
                                        view: v.toLowerCase(),
                                        page: 1,
                                        date: currentDate.format("YYYY-MM-DD")
                                    })}
                                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${view === v.toLowerCase()
                                        ? "bg-orange-500 text-white shadow-md font-bold"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" onClick={triggerSearch} />
                            <input
                                type="text"
                                placeholder="Search Items"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase">
                                    <th className="p-4 text-left w-12 sticky left-0 bg-gray-50 z-20">No</th>
                                    <th className="p-4 text-left w-64 sticky left-12 bg-gray-50 z-20">Item Name</th>
                                    {view === "day" ? (
                                        <th className="p-4 text-center border-l border-gray-100">
                                            <div className="flex items-center justify-center gap-2 text-sm font-bold text-gray-800">
                                                <span>{days[0].format("ddd").toUpperCase()}</span>
                                                <span className="text-orange-500">{days[0].format("D")}</span>
                                            </div>
                                        </th>
                                    ) : (
                                        days.map((day) => (
                                            <th
                                                key={day.format()}
                                                className="p-4 text-center border-l border-gray-100"
                                                style={{ minWidth: `${colWidth}px`, width: `${colWidth}px` }}
                                            >
                                                <div className="text-[10px] opacity-60 font-medium">{day.format("ddd").toUpperCase()}</div>
                                                <div className={`text-sm ${day.isSame(moment(), 'day') ? 'bg-orange-500 text-white w-7 h-7 flex items-center justify-center rounded-full mx-auto mt-1' : 'mt-1'}`}>
                                                    {day.format("D")}
                                                </div>
                                            </th>
                                        ))
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={days.length + 2} className="p-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                                <span>Loading Timeline Data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : groupedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={days.length + 2} className="p-12 text-center text-gray-500 italic">
                                            No items found.
                                        </td>
                                    </tr>
                                ) : (
                                    groupedData.map((itemGroup, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm text-gray-500 sticky left-0 bg-white z-10">{((page - 1) * limit) + idx + 1}</td>
                                            <td className="p-4 sticky left-12 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden relative border border-gray-200 flex-shrink-0">
                                                        <TimelineImage
                                                            src={itemGroup.full_path_image}
                                                        />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="font-bold text-gray-800 text-xs leading-tight mb-1 truncate">{itemGroup.item_name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`px-2 py-0.5 rounded-full border text-[9px] font-bold w-fit uppercase ${itemGroup.status?.toLowerCase() === "booked"
                                                                    ? "bg-yellow-50 text-yellow-500 border-yellow-500"
                                                                    : itemGroup.status?.toLowerCase() === "cancel" ||
                                                                        itemGroup.status?.toLowerCase() === "cancelled"
                                                                        ? "bg-red-50 text-red-500 border-red-500"
                                                                        : itemGroup.status?.toLowerCase() === "checkout" ||
                                                                            itemGroup.status?.toLowerCase() === "completed"
                                                                            ? "bg-blue-50 text-blue-500 border-blue-500"
                                                                            : "bg-purple-50 text-purple-500 border-purple-500" // Check In or others
                                                                    }`}
                                                            >
                                                                {itemGroup.status}
                                                            </div>
                                                            {/* Barcode */}
                                                            {itemGroup.barcode && (
                                                                <div className="flex flex-col items-start scale-50 origin-left">
                                                                    <Barcode
                                                                        value={itemGroup.barcode}
                                                                        format="CODE128"
                                                                        width={1}
                                                                        height={20}
                                                                        displayValue={true}
                                                                        fontSize={10}
                                                                        margin={0}
                                                                        background="transparent"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                    </div>
                                                </div>
                                            </td>
                                            <td colSpan={days.length} className="p-0 relative min-h-[80px]">
                                                {/* Grid Background Lines */}
                                                <div className="absolute inset-0 flex pointer-events-none">
                                                    {days.map((day) => (
                                                        <div
                                                            key={day.format()}
                                                            className="h-full border-l border-gray-100 first:border-l-0"
                                                            style={{ minWidth: `${colWidth}px`, width: `${colWidth}px` }}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Continuous Bars */}
                                                <div className="relative min-h-[80px] py-4">
                                                    {itemGroup.reservations.map((res, i) => {
                                                        const start = moment(res.start_date);
                                                        const end = moment(res.end_date);

                                                        // Find start and end indices in the visible range
                                                        const rangeStart = days[0].clone().startOf('day');
                                                        const rangeEnd = days[days.length - 1].clone().endOf('day');

                                                        if (end.isBefore(rangeStart) || start.isAfter(rangeEnd)) return null;

                                                        const visibleStart = moment.max(start, rangeStart);
                                                        const visibleEnd = moment.min(end, rangeEnd);

                                                        const startIndex = days.findIndex(d => d.isSame(visibleStart, 'day'));
                                                        const endIndex = days.findIndex(d => d.isSame(visibleEnd, 'day'));

                                                        if (startIndex === -1 || endIndex === -1) return null;

                                                        const left = view === "day" ? 0 : startIndex * colWidth;
                                                        const width = view === "day" ? (days.length * colWidth || 800) : (endIndex - startIndex + 1) * colWidth;

                                                        // Simple vertical offset for multiple reservations in same row
                                                        const top = 16 + (i * 40);

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`absolute h-8 rounded-lg bg-gradient-to-r ${getStatusGradient(res.status)} text-[10px] text-white font-bold flex items-center justify-center truncate px-2 shadow-lg transition-all hover:scale-[1.01] hover:z-20 cursor-pointer group`}
                                                                style={{
                                                                    left: view === "day" ? "12px" : `${left + 4}px`,
                                                                    width: view === "day" ? "calc(100% - 24px)" : `${width - 8}px`,
                                                                    top: `${top}px`
                                                                }}
                                                                title={`${res.customer_name} (${res.status}) - ${res.book_id}`}
                                                            >
                                                                <span className="truncate">{res.customer_name}</span>

                                                                {/* Hover Tooltip */}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900/95 backdrop-blur-sm text-white p-3 rounded-lg text-xs whitespace-nowrap z-30 shadow-2xl border border-white/10">
                                                                    <p className="font-bold text-orange-400 mb-1">{res.customer_name}</p>
                                                                    <p className="opacity-80">Reference: {res.book_id}</p>
                                                                    <p className="opacity-80">Status: {res.status}</p>
                                                                    <p className="opacity-80">Period: {moment(res.start_date).format('DD MMM')} - {moment(res.end_date).format('DD MMM YYYY')}</p>
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900/95" />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Show</span>
                            <select
                                value={limit}
                                onChange={(e) => handleNavigation({ limit: Number(e.target.value), page: 1 })}
                                className="border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none"
                            >
                                {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v} Row</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={Number(meta?.current_page) === 1}
                                onClick={() => handleNavigation({ page: Number(meta?.current_page) - 1 })}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: meta?.total_page || 1 }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => handleNavigation({ page: p })}
                                    className={`w-8 h-8 rounded text-sm font-bold ${Number(meta?.current_page) === p ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                disabled={Number(meta?.current_page) === meta?.total_page}
                                onClick={() => handleNavigation({ page: Number(meta?.current_page) + 1 })}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                table {
                    border-spacing: 0;
                }
                .sticky {
                    position: sticky;
                    z-index: 10;
                }
                ::-webkit-scrollbar {
                    height: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                ::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
