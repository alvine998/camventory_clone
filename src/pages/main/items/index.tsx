import Button from "@/components/Button";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import CustomerDeleteModal from "@/components/modals/customer/delete";
import { CONFIG } from "@/config";
import { ColumnItems } from "@/constants/column_items";
import axios from "axios";
import { parse } from "cookie";
import { Camera, EyeIcon } from "lucide-react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import FlagIcon from "../../../../public/icons/flag.svg";
import Badge from "@/components/Badge";
import { getStatusBadgeColor } from "@/utils";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token || "";

  try {
    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // Fetch notifications for SSR
    const [notificationsData, unreadNotificationsData] = await Promise.all([
      fetchNotificationsServer(token),
      fetchUnreadNotificationsServer(token),
    ]);

    const { page = 1, limit = 10, search = "", location, statusItem } = query;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (typeof search === "string" && search.trim() !== "") {
      params.set("search", search);
    }

    if (
      typeof location === "string" &&
      location.trim() !== "" &&
      location !== "all"
    ) {
      params.set("location", location);
    }

    if (typeof statusItem === "string" && statusItem.trim() !== "") {
      params.set("statusItem", statusItem);
    } else if (typeof query.statusItem === "string" && query.statusItem.trim() !== "") {
      params.set("statusItem", query.statusItem);
    }

    const table = await axios.get(
      `${CONFIG.API_URL}/v1/single-items?${params.toString()}`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    if (table?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    return {
      props: {
        table: { data: table?.data?.data, ...table?.data?.meta },
        notifications: notificationsData?.data || [],
        unreadNotifications: unreadNotificationsData?.data || [],
      },
    };
  } catch (error: any) {
    console.log(error);
    if (error?.response?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
    return {
      props: { table: { data: [] }, notifications: [], unreadNotifications: [] },
    };
  }
};

export default function AdministratorPage({ table }: any) {
  const [show, setShow] = useState<boolean>(false);
  const [modal, setModal] = useState<useModal>();
  const router = useRouter();
  // Define filter state with proper types
  // Define filter state with proper types
  const [filter, setFilter] = useState<{
    search?: string;
    location?: string;
    bulk?: string;
    page?: number;
    limit?: number;
    statusItem?: string;
  }>(() => {
    // Try to get from router.query first, then fallback to window.location.search
    // This handles cases where router.isReady might be true but query is somehow not fully populated or sync issues
    let search = typeof router.query.search === "string" ? router.query.search : "";
    let location = typeof router.query.location === "string" ? router.query.location : "all";
    let bulk = typeof router.query.bulk === "string" ? router.query.bulk : "";
    let page = router.query.page ? Number(router.query.page) : 1;
    let limit = router.query.limit ? Number(router.query.limit) : 10;
    let statusItem = typeof router.query.statusItem === "string" ? router.query.statusItem : "";

    // Fallback to window.location if router.query is empty (client-side only)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (!search) search = params.get("search") || "";
      if (location === "all") location = params.get("location") || "all";
      if (!bulk) bulk = params.get("bulk") || "";
      if (page === 1 && params.has("page")) page = Number(params.get("page"));
      if (limit === 10 && params.has("limit")) limit = Number(params.get("limit"));
      if (!statusItem) statusItem = params.get("statusItem") || params.get("status_items") || "";
    }

    return {
      search,
      location,
      bulk,
      page,
      limit,
      statusItem
    };
  });

  // Reset all filters and pagination
  const handleResetFilter = useCallback(() => {
    // Create a new filter object with default values
    const newFilter = {
      search: "",
      location: "all",
      statusItem: "",
      page: 1,
      limit: filter.limit || 10, // Keep the current limit
    };

    // Update the filter state
    setFilter(newFilter);

    // Update the URL without the filter parameters
    const queryParams = new URLSearchParams();
    queryParams.set("page", "1");
    queryParams.set("limit", String(newFilter.limit));

    router.push(`?${queryParams.toString()}`).catch(() => {
      // Ignore navigation cancellation errors
    });
  }, [filter.limit, router]);


  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(true);
    }
  }, []);
  const data = [...table?.data].map((item, index) => ({
    ...item,
    number: index + 1,
    item_name: (
      <div className="flex gap-2 items-center">
        {
          item.full_path_image ? (
            <Image
              src={item.full_path_image}
              alt="image"
              width={50}
              height={50}
              className="p-2"
            />
          ) :
            <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded m-1">
              <Camera className="w-6 h-6 text-gray-500" />
            </div>
        }
        <div>
          <h5 className="text-black">{item.name}</h5>
          <div className="flex gap-2 items-center mt-1">
            <Badge
              color={getStatusBadgeColor(item.status_booking ?? "AVAILABLE")}
              text={item.status_booking ?? "AVAILABLE"}
            >
              {item.status_booking ?? "AVAILABLE"}
            </Badge>
            <p>{item.code}</p>
          </div>
        </div>
      </div>
    ),
    flag_status: (
      <div>
        {item.status_items === "GOOD" && (
          <div className="flex justify-center items-center gap-2">
            <FlagIcon className="text-green-500 fill-current" />
            <p className="text-green-500 font-bold text-lg">Good</p>
          </div>
        )}
        {item.status_items === "ON_REPAIR" && (
          <div className="flex justify-center items-center gap-2">
            <FlagIcon className="text-violet-500 fill-current" />
            <p className="text-violet-500 font-bold text-sm">On Repair</p>
          </div>
        )}
        {item.status_items === "BROKEN" && (
          <div className="flex justify-center items-center gap-2">
            <FlagIcon className="text-red-500 fill-current" />
            <p className="text-red-500 font-bold text-lg">Broken</p>
          </div>
        )}
        {item.status_items === "TAKEOUT" && (
          <div className="flex justify-center items-center gap-2">
            <FlagIcon className="text-gray-300 fill-current" />
            <p className="text-gray-300 font-bold text-lg">Takeout</p>
          </div>
        )}
        {item.status_items === "NEED_CHECK" && (
          <div className="flex justify-center items-center gap-2">
            <FlagIcon className="text-orange-500 fill-current" />
            <p className="text-orange-500 font-bold text-sm">Need Check</p>
          </div>
        )}
      </div>
    ),
    action: (
      <div key={index} className="flex gap-2">
        <Button
          className="bg-orange-200 text-orange-500"
          variant="custom-color"
          type="button"
          onClick={() => {
            router.push(`/main/items/${item.id}/detail?type=single`);
          }}
        >
          <EyeIcon className="w-4 h-4" />
        </Button>
      </div>
    ),
  }));

  // Get current path to determine active tab
  const currentPath = router.pathname;

  const itemTabs = [
    {
      label: "Individual Item",
      href: "/main/items",
      isActive: currentPath === "/main/items",
    },
    {
      label: "Bulk Item",
      href: "/main/items/bulk",
      isActive: currentPath === "/main/items/bulk",
    },
  ];

  // Handle filter changes and update URL
  useEffect(() => {
    if (!router.isReady) return;

    const delayDebounce = setTimeout(() => {
      const queryParams = new URLSearchParams();

      // Always include page and limit
      queryParams.set("page", String(filter.page || 1));
      queryParams.set("limit", String(filter.limit || 10));

      // Include search if it exists
      if (filter.search && filter.search.trim() !== "") {
        queryParams.set("search", filter.search);
      }

      // Include location if it's not 'all'
      if (filter.location && filter.location !== "all") {
        queryParams.set("location", filter.location);
      }

      // Include statusItem if it exists
      if (filter.statusItem && filter.statusItem.trim() !== "") {
        queryParams.set("statusItem", filter.statusItem);
      }

      // Get current query from window location
      const currentQuery = new URLSearchParams(window.location.search);
      const newQueryString = queryParams.toString();
      const currentQueryString = currentQuery.toString();

      // Compare if the new query is actually different from current URL
      // This prevents infinite loops or resetting to defaults if state matches URL
      if (newQueryString !== currentQueryString) {
        // Double check against router.query to verify if we are just syncing up
        // or actually changing something.
        // If filter is default but URL has something, and we come here, we might overwrite.
        // But we rely on the initial state sync to populate filter.

        // Critical: Only push if we are sure the filter state is "fresher" or intended.
        // If the filter state is default, but the URL has params, we shouldn't overwrite 
        // unless the user explicitly cleared them.
        // However, determining "user cleared" vs "not yet loaded" is hard.
        // The `router.isReady` check + initial state sync should handle "not yet loaded".

        router.push(`?${newQueryString}`, undefined, { shallow: true }).catch(() => {
          // Ignore navigation cancellation errors
        });
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, router.isReady]);

  return (
    <div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">List Items</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Search Items"
            type="search"
            className="flex-1 min-w-[200px]"
            value={filter.search || ""}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                search: e.target.value,
                page: 1,
              }))
            }
          />
          <select
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={filter.location || "all"}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                location: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All Locations</option>
            <option value="cipadung">Cipadung</option>
            <option value="dipatiukur">Dipatiukur</option>
          </select>
          {(filter.search ||
            (filter.location && filter.location !== "all")) && (
              <button
                type="button"
                className="px-4 py-2 text-red-500 hover:text-red-600 font-medium transition-colors duration-200"
                onClick={handleResetFilter}
              >
                Reset Filters
              </button>
            )}
        </div>
        <Button
          variant="custom-color"
          className="bg-orange-500 text-white"
          type="button"
          onClick={() => router.push("/main/items/create")}
        >
          + Add Items
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        <div className="flex border-b border-gray-200">
          {itemTabs.map((tab) => (
            <button
              key={tab.href}
              className={`px-4 py-2 font-medium text-sm ${tab.isActive
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => router.push(tab.href)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full mt-4">
        {show && (
          <div className="overflow-x-auto">
            <DataTable
              columns={ColumnItems}
              data={data}
              pagination
              highlightOnHover
              paginationTotalRows={table?.total_data || 0}
              paginationRowsPerPageOptions={[10, 20, 50, 100]}
              paginationServer
              onChangePage={(page) =>
                setFilter((prev: any) => ({ ...prev, page }))
              }
              onChangeRowsPerPage={(limit, page) => setFilter((prev: any) => ({ ...prev, limit, page }))}
              noDataComponent="No items found"
              customStyles={{
                table: {
                  style: {
                    width: "100%",
                    minWidth: "1000px",
                  },
                },
                tableWrapper: {
                  style: {
                    display: "table",
                    width: "100%",
                  },
                },
                headCells: {
                  style: {
                    backgroundColor: "#f3f4f6",
                    fontWeight: "bold",
                    fontSize: "14px",
                    paddingLeft: "16px",
                    paddingRight: "16px",
                  },
                },
                cells: {
                  style: {
                    fontSize: "14px",
                    paddingLeft: "16px",
                    paddingRight: "16px",
                  },
                },
                rows: {
                  style: {
                    "&:hover": {
                      backgroundColor: "#e5e7eb",
                    },
                  },
                },
              }}
            />
          </div>
        )}
      </div>
      {modal?.key == "delete" && (
        <CustomerDeleteModal
          open={modal?.open}
          setOpen={setModal}
          data={modal?.data}
        />
      )}
    </div>
  );
}
