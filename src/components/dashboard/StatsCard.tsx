import React from "react";

import Skeleton from "../Skeleton";

interface StatItem {
    label: string;
    value: number | string;
}

interface StatsCardProps {
    title: string;
    stats: StatItem[];
    loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, stats, loading = false }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full ring-1 ring-gray-200 min-h-[200px]">
            <h3 className="text-lg font-bold text-gray-800 mb-6">{title}</h3>
            {loading ? (
                <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => ( // Show 4 skeletons as placeholder
                        <div key={i} className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
                            <Skeleton className="w-12 h-8" />
                            <Skeleton className="w-20 h-4" />
                        </div>
                    ))}
                </div>
            ) : stats.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-gray-400">
                    <p className="text-sm font-medium">No Data Available</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 border border-gray-100"
                        >
                            <span className="text-4xl font-bold text-orange-500 mb-2">
                                {stat.value}
                            </span>
                            <span className="text-sm font-medium text-gray-600">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatsCard;
