import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import TabsValue from "@/components/TabsValue";
import {
    ArrowLeftIcon,
    MinusCircleIcon,
    PlusCircleIcon,
    ScanQrCodeIcon,
    ShoppingCartIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

interface Item {
    id: string;
    name: string;
    serial_number?: string;
    full_path_image?: string;
    qty?: number;
    isBulk?: boolean;
    added?: number;
    category?: string;
    location?: string;
}

interface Props {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<any[]>>;
    singleItems: Item[];
    bulkItems: Item[];
    onBack: () => void;
    onSave: () => void;
    categories: { id: string; name: string }[];
}

export default function AddEquipmentView({
    items,
    setItems,
    singleItems,
    bulkItems,
    onBack,
    onSave,
    categories,
}: Props) {
    const [tab, setTab] = useState<"single" | "bulk">("single");
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");

    const addEquipment = (item: Item) => {
        if (!items.some((i) => i.id === item.id)) {
            setItems([...items, { ...item, added: 1 }]);
        }
    };

    const adjustBulkQty = (item: Item, change: number) => {
        setItems((prev: any[]) => {
            const existingIndex = prev.findIndex(
                (i: any) => i.id === item.id && (i.isBulk || i.item_type === "bulk")
            );
            if (existingIndex !== -1) {
                const updated = [...prev];
                const currentQty = updated[existingIndex].added || updated[existingIndex].qty || 0;
                updated[existingIndex].added = Math.max(0, currentQty + change);
                if (updated[existingIndex].added === 0) {
                    updated.splice(existingIndex, 1);
                }
                return updated;
            }
            if (change > 0) {
                return [...prev, { ...item, added: 1, isBulk: true }];
            }
            return prev;
        });
    };

    const getFilteredItems = () => {
        const currentItems = tab === "single" ? singleItems : bulkItems;
        return currentItems.filter((item) => {
            const matchesSearch = searchTerm === "" ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = categoryFilter === "all" || item.id === categoryFilter; // This might need adjustment based on how categories are linked
            const matchesLocation = locationFilter === "all" || item.location === locationFilter;
            return matchesSearch && matchesCategory && matchesLocation;
        });
    };

    const resetFilters = () => {
        setSearchTerm("");
        setCategoryFilter("all");
        setLocationFilter("all");
    };

    const itemTabs = [
        { label: "Single Items", href: "single" },
        { label: "Bulk Items", href: "bulk" },
    ];

    const filteredItems = getFilteredItems();

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-4 p-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={onBack} type="button">
                            <ArrowLeftIcon className="w-6 h-6 text-orange-500" />
                        </button>
                        <h1 className="text-2xl font-bold text-orange-500">Add Equipment</h1>
                    </div>
                    <div className="text-xs text-gray-400">
                        Reservation &gt; Add Reservation &gt; <span className="text-orange-500 font-medium">Add Equipment</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b">
                    <TabsValue
                        tabs={itemTabs}
                        value={tab}
                        setValue={(val) => setTab(val as "single" | "bulk")}
                    />
                </div>

                {/* Search & Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <button className="flex items-center gap-2 border rounded-md px-3 py-2 text-gray-500 hover:border-orange-500">
                        <ScanQrCodeIcon className="w-4 h-4" />
                        <span className="text-sm">Scan</span>
                    </button>

                    <div className="flex-1 min-w-[200px]">
                        <Input
                            type="search"
                            placeholder="Search Product ..."
                            fullWidth
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-64">
                        <Select
                            options={[{ value: "all", label: "Category Product" }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                            placeholder="Category Product"
                            value={categoryFilter === "all" ? null : { value: categoryFilter, label: categories.find(c => c.id === categoryFilter)?.name || "Category" }}
                            onChange={(opt: any) => setCategoryFilter(opt?.value || "all")}
                            fullWidth
                        />
                    </div>

                    <div className="w-64">
                        <Select
                            options={[
                                { value: "all", label: "Location" },
                                { value: "dipatiukur", label: "Dipatiukur" },
                                { value: "cipadung", label: "Cipadung" },
                            ]}
                            placeholder="Location"
                            value={locationFilter === "all" ? null : { value: locationFilter, label: locationFilter.charAt(0).toUpperCase() + locationFilter.slice(1) }}
                            onChange={(opt: any) => setLocationFilter(opt?.value || "all")}
                            fullWidth
                        />
                    </div>

                    <button
                        type="button"
                        onClick={resetFilters}
                        className="text-red-500 text-sm font-medium hover:underline px-2"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 p-4">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <ShoppingCartIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p>No items found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {filteredItems.map((item) => {
                            const addedItem = items.find(i => i.id === item.id);
                            const addedCount = addedItem?.added || addedItem?.qty || 0;

                            return (
                                <div key={item.id} className="border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                    <div className="relative aspect-square bg-gray-50">
                                        <Image
                                            src={item.full_path_image || "/placeholder-item.png"}
                                            alt={item.name}
                                            layout="fill"
                                            objectFit="cover"
                                        />
                                    </div>
                                    <div className="p-3 flex flex-col gap-1">
                                        <h3 className="font-bold text-sm truncate">{item.name}</h3>
                                        <div className="text-[10px] text-gray-500 flex justify-between">
                                            <span>Type: {item.isBulk ? "Product" : "Product"}</span>
                                            <span>Avail: {item.qty || 10} item</span>
                                        </div>

                                        {tab === "single" ? (
                                            <button
                                                onClick={() => addEquipment(item)}
                                                disabled={addedCount > 0}
                                                className={`mt-2 w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-2 ${addedCount > 0
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : "bg-orange-500 text-white hover:bg-orange-600"
                                                    }`}
                                            >
                                                <PlusCircleIcon className="w-3 h-3" />
                                                {addedCount > 0 ? "Added" : "Add Item"}
                                            </button>
                                        ) : (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 flex items-center justify-center border rounded h-8 gap-3">
                                                    <button
                                                        onClick={() => adjustBulkQty(item, -1)}
                                                        className="text-orange-500 hover:bg-orange-50 disabled:text-gray-300"
                                                        disabled={addedCount === 0}
                                                    >
                                                        <MinusCircleIcon className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-sm font-bold min-w-[1rem] text-center">{addedCount}</span>
                                                    <button
                                                        onClick={() => adjustBulkQty(item, 1)}
                                                        className="text-orange-500 hover:bg-orange-50 disabled:text-gray-300"
                                                        disabled={addedCount >= (item.qty || 0)}
                                                    >
                                                        <PlusCircleIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => addedCount === 0 && adjustBulkQty(item, 1)}
                                                    className={`h-8 px-2 rounded text-[10px] font-bold ${addedCount > 0
                                                        ? "bg-gray-100 text-gray-400"
                                                        : "bg-orange-500 text-white hover:bg-orange-600"
                                                        }`}
                                                >
                                                    Add Item
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="p-4 flex justify-center">
                <div className="flex items-center gap-1">
                    <button className="p-1 border rounded hover:bg-gray-50 disabled:opacity-30"><ChevronsLeftIcon className="w-4 h-4" /></button>
                    <button className="p-1 border rounded hover:bg-gray-50 disabled:opacity-30"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <button className="px-3 py-1 border rounded bg-orange-500 text-white font-bold">1</button>
                    <button className="px-3 py-1 border rounded hover:bg-gray-50">2</button>
                    <button className="px-3 py-1 border rounded hover:bg-gray-50">3</button>
                    <span className="px-2">...</span>
                    <button className="px-3 py-1 border rounded hover:bg-gray-50">10</button>
                    <button className="p-1 border rounded hover:bg-gray-50"><ChevronRightIcon className="w-4 h-4" /></button>
                    <button className="p-1 border rounded hover:bg-gray-50"><ChevronsRightIcon className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-4 shadow-lg">
                <Button variant="white" className="px-8" onClick={onBack}>
                    Back
                </Button>
                <Button variant="submit" className="px-8" onClick={onSave}>
                    Save
                </Button>
            </div>
        </div>
    );
}
