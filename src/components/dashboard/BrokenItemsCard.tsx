import React from "react";
import Image from "next/image";

import Skeleton from "../Skeleton";

interface BrokenItem {
    id: string;
    name: string;
    image: string;
    price: number;
}

interface BrokenItemsCardProps {
    items: BrokenItem[];
    totalPrice: number;
    totalItems: number;
    onViewAll?: () => void;
    loading?: boolean;
}

const BrokenItemsCard: React.FC<BrokenItemsCardProps> = ({
    items,
    totalPrice,
    onViewAll,
    loading = false,
    totalItems
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full ring-1 ring-gray-200 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Broken Items</h3>
                {loading ? (
                    <Skeleton className="w-24 h-6 rounded-full" />
                ) : (
                    <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                        Rp {totalPrice.toLocaleString("id-ID")}
                    </span>
                )}
            </div>

            <div className="space-y-4 flex-grow">
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3 w-full">
                                <Skeleton className="w-10 h-10 rounded" />
                                <Skeleton className="w-1/2 h-4" />
                            </div>
                            <Skeleton className="w-20 h-4" />
                        </div>
                    ))
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                        <p className="text-sm font-medium">No Broken Items</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 relative overflow-hidden rounded bg-gray-100">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                </div>
                                <span className="text-xs font-bold text-gray-700">
                                    {item.name}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-gray-800">
                                Rp {item.price.toLocaleString("id-ID")}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {
                totalItems > 5 && (
                    <button
                        onClick={onViewAll}
                        className="mt-6 w-full py-2 text-sm font-bold text-orange-500 border border-orange-500 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                        View All
                    </button>
                )
            }

        </div>
    );
};

export default BrokenItemsCard;
