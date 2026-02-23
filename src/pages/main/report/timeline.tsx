import React, { useState, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import { parse } from "cookie";
import { GetServerSideProps } from "next";
import axios from "axios";
import moment from "moment";
import { CONFIG } from "@/config";
import {
    ChevronLeft,
    ChevronRight,
    Search,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";

interface ITimelineItem {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
    customer_name: string;
    book_id: string;
    barcode: string;
    item_name: string;
}

interface Props {
    initialTimelineData: ITimelineItem[];
    initialMeta: any;
    initialDate: string; // ISO string for the moment object
    initialView: "day" | "week" | "month";
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

    let startTimestamp: number;
    let endTimestamp: number;

    const selectedView = view as "day" | "week" | "month";

    if (selectedView === "day") {
        startTimestamp = currentMoment.clone().startOf("day").unix();
        endTimestamp = currentMoment.clone().endOf("day").unix();
    } else if (selectedView === "week") {
        startTimestamp = currentMoment.clone().startOf("week").unix();
        endTimestamp = currentMoment.clone().endOf("week").unix();
    } else {
        startTimestamp = currentMoment.clone().startOf("month").unix();
        endTimestamp = currentMoment.clone().endOf("month").unix();
    }

    // Enforce min 3 chars for search
    const searchQuery = (search as string).length >= 3 ? (search as string) : "";

    try {
        const response = await axios.get(`${CONFIG.API_URL}/v1/timeline`, {
            params: {
                page,
                limit,
                search: searchQuery,
                startDate: startTimestamp,
                endDate: endTimestamp,
            },
            headers: { Authorization: token },
        });

        return {
            props: {
                initialTimelineData: response.data?.data || [],
                initialMeta: response.data?.meta || null,
                initialDate: currentMoment.toISOString(),
                initialView: selectedView,
            },
        };
    } catch (error) {
        console.error("SSR Error fetching timeline data:", error);
        return {
            props: {
                initialTimelineData: [],
                initialMeta: null,
                initialDate: currentMoment.toISOString(),
                initialView: selectedView,
            },
        };
    }
};

export default function TimelinePage({ initialTimelineData, initialMeta, initialDate, initialView }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [timelineData, setTimelineData] = useState<ITimelineItem[]>(initialTimelineData);
    const [currentDate, setCurrentDate] = useState(moment(initialDate));
    const [view, setView] = useState<"day" | "week" | "month">(initialView);
    const [search, setSearch] = useState(router.query.search as string || "");
    const [meta, setMeta] = useState<any>(initialMeta);

    const page = meta?.current_page || 1;
    const limit = meta?.total_data_per_page || 10;

    // Route change loading state
    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleComplete = () => setLoading(false);

        router.events.on("routeChangeStart", handleStart);
        router.events.on("routeChangeComplete", handleComplete);
        router.events.on("routeChangeError", handleComplete);

        return () => {
            router.events.off("routeChangeStart", handleStart);
            router.events.off("routeChangeComplete", handleComplete);
            router.events.off("routeChangeError", handleComplete);
        };
    }, [router]);

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

    const handleNavigation = useCallback((updates: any) => {
        setLoading(true);
        const newQuery = { ...router.query, ...updates };

        // Handle search character limit (min 3 chars)
        if (newQuery.search && newQuery.search.length < 3) {
            delete newQuery.search;
        }

        // Remove empty params
        if (!newQuery.search) delete newQuery.search;
        if (Number(newQuery.page) === 1) delete newQuery.page;
        if (Number(newQuery.limit) === 10) delete newQuery.limit;
        if (newQuery.view === "month") delete newQuery.view;

        router.push({
            pathname: router.pathname,
            query: newQuery,
        }, undefined, { shallow: false });
    }, [router]);

    const handlePrev = () => {
        const unit = view === "day" ? "day" : view === "week" ? "week" : "month";
        const nextDate = moment(currentDate).subtract(1, unit).toISOString();
        handleNavigation({ date: nextDate, page: 1 });
    };

    const handleNext = () => {
        const unit = view === "day" ? "day" : view === "week" ? "week" : "month";
        const nextDate = moment(currentDate).add(1, unit).toISOString();
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

    // Group timeline data by item
    const groupedData = useMemo(() => {
        const groups: Record<string, {
            item_name: string;
            barcode: string;
            reservations: ITimelineItem[]
        }> = {};

        timelineData.forEach((item) => {
            const key = `${item.item_name}-${item.barcode}`;
            if (!groups[key]) {
                groups[key] = {
                    item_name: item.item_name,
                    barcode: item.barcode,
                    reservations: [],
                };
            }
            groups[key].reservations.push(item);
        });

        return Object.values(groups);
    }, [timelineData]);

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case "BOOKED":
                return "bg-yellow-400";
            case "CHECKOUT":
                return "bg-blue-500";
            case "CHECKIN":
            case "COMPLETED":
                return "bg-green-500";
            default:
                return "bg-gray-400";
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
                                    onClick={() => handleNavigation({ view: v.toLowerCase(), page: 1 })}
                                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${view === v.toLowerCase()
                                        ? "bg-orange-500 text-white shadow-md"
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
                        <div className="flex -space-x-2">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-white font-bold">F</div>
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white border-2 border-white font-bold">R</div>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase">
                                    <th className="p-4 text-left w-12 sticky left-0 bg-gray-50 z-20">No</th>
                                    <th className="p-4 text-left w-64 sticky left-12 bg-gray-50 z-20">Item Name</th>
                                    {days.map((day) => (
                                        <th key={day.format()} className="p-4 min-w-[100px] text-center border-l border-gray-100">
                                            <div>{day.format("ddd").toUpperCase()}</div>
                                            <div className="text-lg">{day.format("D")}</div>
                                        </th>
                                    ))}
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
                                                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative border border-gray-200">
                                                        <Image
                                                            src="/images/placeholder.png"
                                                            alt={itemGroup.item_name}
                                                            layout="fill"
                                                            objectFit="cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm leading-tight mb-1">{itemGroup.item_name}</p>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-600">
                                                            Booked
                                                        </span>
                                                        <div className="mt-1 flex items-center gap-1 opacity-50">
                                                            <div className="text-[8px] font-mono">{itemGroup.barcode}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            {days.map((day) => {
                                                const dayReservations = itemGroup.reservations.filter(res => {
                                                    const start = moment(res.start_date);
                                                    const end = moment(res.end_date);
                                                    return day.isSameOrAfter(start, "day") && day.isSameOrBefore(end, "day");
                                                });

                                                return (
                                                    <td key={day.format()} className="p-0 border-l border-gray-50 relative min-w-[100px]">
                                                        <div className="h-full w-full min-h-[80px] flex flex-col justify-center gap-1 p-1">
                                                            {dayReservations.map((res, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`h-8 rounded-lg ${getStatusColor(res.status)} text-[10px] text-white font-bold flex items-center justify-center truncate px-2 shadow-sm`}
                                                                    title={`${res.customer_name} (${res.status}) - ${res.book_id}`}
                                                                >
                                                                    {res.customer_name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                );
                                            })}
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
