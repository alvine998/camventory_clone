import Button from "@/components/Button";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import { NotificationData } from "@/types/notification";
import { useModal } from "@/components/Modal";
import CategoryCreateModal from "@/components/modals/category/create";
import CategoryDeleteModal from "@/components/modals/category/delete";
import CategoryUpdateModal from "@/components/modals/category/update";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import {
    ChevronLeft,
    PencilLineIcon,
    TrashIcon,
    Search,
    Plus
} from "lucide-react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import Head from "next/head";

interface Category {
    id?: string;
    name: string;
    created_at?: number;
}

interface Meta {
    total_data: number;
    total_data_per_page: number;
    current_page: number;
    previous_page: number;
    total_page: number;
}

interface Props {
    initialData: Category[];
    initialMeta: Meta;
    token: string;
    notifications: NotificationData[];
    unreadNotifications: NotificationData[];
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const { query, req } = ctx;
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

    const { page = 1, limit = 10, search = "" } = query;

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (typeof search === "string" && search.trim() !== "") {
        params.set("search", search);
    }

    try {
        const [response, notificationsData, unreadNotificationsData] = await Promise.all([
            axios.get(
                `${CONFIG.API_URL}/v1/master/categories`,
                {
                    params,
                    headers: { Authorization: token },
                }
            ),
            fetchNotificationsServer(token),
            fetchUnreadNotificationsServer(token),
        ]);

        return {
            props: {
                initialData: response.data?.data || [],
                initialMeta: response.data?.meta || {
                    total_data: 0,
                    total_data_per_page: 10,
                    current_page: 1,
                    previous_page: 0,
                    total_page: 1
                },
                token,
                notifications: notificationsData?.data || [],
                unreadNotifications: unreadNotificationsData?.data || [],
            },
        };
    } catch (error) {
        console.error("SSR Error fetching categories:", error);
        return {
            props: {
                initialData: [],
                initialMeta: {
                    total_data: 0,
                    total_data_per_page: 10,
                    current_page: 1,
                    previous_page: 0,
                    total_page: 1
                },
                notifications: [],
                unreadNotifications: [],
                token: token || "",
            },
        };
    }
};

export default function CategoryItemPage({ initialData, initialMeta, notifications, unreadNotifications }: Props) {
    const router = useRouter();
    const [show, setShow] = useState<boolean>(false);
    const [modal, setModal] = useState<useModal>();
    const [search, setSearch] = useState(router.query.search as string || "");

    useEffect(() => {
        setShow(true);
        // Props are purely for SSR hydration of the Topbar via Zustand
        console.log("Notifications hydrated:", notifications?.length, unreadNotifications?.length);
    }, [notifications, unreadNotifications]);

    const handleNavigation = useCallback((updates: any) => {
        const newQuery = { ...router.query, ...updates };

        // Enforce min 3 chars for search
        if (newQuery.search && newQuery.search.length < 3) {
            delete newQuery.search;
        }

        if (!newQuery.search) delete newQuery.search;
        if (Number(newQuery.page) === 1) delete newQuery.page;
        if (Number(newQuery.limit) === 10) delete newQuery.limit;

        router.push({
            pathname: router.pathname,
            query: newQuery,
        }, undefined, { shallow: false });
    }, [router]);

    const columns: any[] = useMemo(() => [
        {
            name: "No",
            selector: (row: any, index: number) =>
                ((Number(initialMeta.current_page) - 1) * initialMeta.total_data_per_page) + index + 1,
            width: "100px",
        },
        {
            name: "Category Name",
            selector: (row: Category) => row.name,
            sortable: true,
            center: true,
        },
        {
            name: "Action",
            width: "150px",
            right: true,
            cell: (row: Category) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => setModal({ open: true, data: row, key: "update" })}
                        className="p-2 bg-orange-100 text-orange-500 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                        <PencilLineIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setModal({ open: true, data: row, key: "delete" })}
                        className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ),
        },
    ], [initialMeta]);

    return (
        <div className="bg-gray-50 min-h-screen">
            <Head>
                <title>Category Items | Camventory</title>
            </Head>

            <div className="p-4 md:p-8">
                <div className="flex items-center gap-2 mb-6 text-gray-400">
                    <ChevronLeft
                        className="w-8 h-8 bg-white rounded-lg shadow-sm cursor-pointer p-1"
                        onClick={() => router.back()}
                    />
                    <h1 className="text-2xl font-bold text-gray-800 ml-2">Category Item</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-orange-500 mb-6">List Category Item</h2>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search Category Item"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (!search || search.length > 3) && handleNavigation({ search, page: 1 })}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                            />
                        </div>
                        <Button
                            variant="custom-color"
                            className="bg-orange-500 text-white flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-sm hover:bg-orange-600 transition-all w-full md:w-auto"
                            onClick={() => setModal({ open: true, key: "create" })}
                        >
                            <Plus className="w-5 h-5" />
                            Add Category Item
                        </Button>
                    </div>

                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                        {show && (
                            <DataTable
                                columns={columns}
                                data={initialData}
                                pagination
                                paginationServer
                                paginationTotalRows={initialMeta.total_data}
                                paginationDefaultPage={initialMeta.current_page}
                                onChangePage={(page) => handleNavigation({ page })}
                                onChangeRowsPerPage={(limit) => handleNavigation({ limit, page: 1 })}
                                paginationRowsPerPageOptions={[10, 20, 50, 100]}
                                responsive
                                customStyles={{
                                    header: {
                                        style: { display: "none" },
                                    },
                                    headRow: {
                                        style: {
                                            backgroundColor: "#f9fafb",
                                            borderBottomColor: "#f3f4f6",
                                            minHeight: "56px",
                                        },
                                    },
                                    headCells: {
                                        style: {
                                            color: "#374151",
                                            fontWeight: "700",
                                            fontSize: "14px",
                                            textTransform: "none",
                                        },
                                    },
                                    cells: {
                                        style: {
                                            paddingTop: "16px",
                                            paddingBottom: "16px",
                                            fontSize: "14px",
                                            color: "#4b5563",
                                        },
                                    },
                                    rows: {
                                        style: {
                                            borderBottomColor: "#f9fafb",
                                            "&:hover": {
                                                backgroundColor: "#f9fafb",
                                            },
                                        },
                                    },
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {modal?.key === "create" && (
                <CategoryCreateModal open={modal?.open} setOpen={() => setModal(undefined)} />
            )}
            {modal?.key === "update" && (
                <CategoryUpdateModal
                    open={modal?.open}
                    setOpen={() => setModal(undefined)}
                    data={modal?.data}
                />
            )}
            {modal?.key === "delete" && (
                <CategoryDeleteModal
                    open={modal?.open}
                    setOpen={() => setModal(undefined)}
                    data={modal?.data}
                />
            )}
        </div>
    );
}
