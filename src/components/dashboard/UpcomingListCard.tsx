import React from "react";

import Skeleton from "../Skeleton";

interface UpcomingItem {
    dateRange: string;
    title: string;
    tags: string[];
    daysLeft: string;
    statusColor: string;
}

interface UpcomingListCardProps {
    title: string;
    items: UpcomingItem[];
    location: string;
    onViewAll?: () => void;
    loading?: boolean;
    totalItems: number;
}

const UpcomingListCard: React.FC<UpcomingListCardProps> = ({
    title,
    items,
    onViewAll,
    loading = false,
    totalItems
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full ring-1 ring-gray-200 min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>

            {/* Filter Date */}
            {/* <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">{location}</span>
                <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 transition-colors">
                    <Filter className="w-3 h-3" />
                    Filter
                </button>
            </div> */}

            <div className="space-y-4 flex-grow">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 rounded-lg border border-gray-200 bg-white relative overflow-hidden space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="w-24 h-3" />
                                <Skeleton className="w-12 h-4 rounded-full" />
                            </div>
                            <Skeleton className="w-3/4 h-5" />
                            <div className="flex gap-2">
                                <Skeleton className="w-16 h-4 rounded-full" />
                                <Skeleton className="w-16 h-4 rounded-full" />
                            </div>
                        </div>
                    ))
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                        <p className="text-sm font-medium">No Upcoming Items</p>
                    </div>
                ) : (
                    items.map((item, index) => (
                        <div
                            key={index}
                            className="p-4 rounded-lg border border-gray-200 bg-white relative overflow-hidden"
                        >
                            <div
                                className={`absolute left-0 top-0 bottom-0 w-2 ${item.statusColor}`}
                            ></div>
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs text-gray-400 font-medium">
                                    {item.dateRange}
                                </span>
                                <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                                    {item.daysLeft}
                                </span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 mb-2">
                                {item.title}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {item.tags.map((tag, tIndex) => (
                                    <span
                                        key={tIndex}
                                        className="bg-green-50 text-green-600 text-[10px] px-2 py-0.5 rounded-full border border-green-200"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {totalItems > 5 && (
                <button
                    onClick={onViewAll}
                    className="mt-6 w-full py-2 text-sm font-bold text-orange-500 border border-orange-500 rounded-lg hover:bg-orange-50 transition-colors"
                >
                    View All
                </button>
            )}
        </div>
    );
};

export default UpcomingListCard;
