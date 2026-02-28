import Button from "@/components/Button";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import CustomerDeleteModal from "@/components/modals/customer/delete";
import { CONFIG } from "@/config";
import { ColumnBulkItems } from "@/constants/column_items";
import axios from "axios";
import { parse } from "cookie";
import { EyeIcon } from "lucide-react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import DataTable from "react-data-table-component";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;

  try {
    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
    const { page = 1, limit = 10, search = "", location } = query;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
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

    const [table, notificationsData, unreadNotificationsData] = await Promise.all([
      axios.get(
        `${CONFIG.API_URL}/v1/bulk-items?${params.toString()}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      ),
      fetchNotificationsServer(token),
      fetchUnreadNotificationsServer(token),
    ]);

    if (table?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // Optionally validate token...
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
      props: {
        table: { data: [], meta: { total_data: 0 } },
        notifications: [],
        unreadNotifications: [],
      },
    };
  }
};

export default function AdministratorPage({ table }: any) {
  const [show, setShow] = useState<boolean>(false);
  const [modal, setModal] = useState<useModal>();
  const router = useRouter();
  // Define filter state with proper types
  const [filter, setFilter] = useState<{
    search?: string;
    location?: string;
    page?: number;
    limit?: number;
  }>(() => ({
    search: typeof router.query.search === "string" ? router.query.search : "",
    location:
      typeof router.query.location === "string" ? router.query.location : "all",
    page: router.query.page ? Number(router.query.page) : 1,
    limit: router.query.limit ? Number(router.query.limit) : 10,
  }));

  // Reset all filters and pagination
  const handleResetFilter = useCallback(() => {
    // Create a new filter object with default values
    const newFilter = {
      search: "",
      location: "all",
      page: 1,
      limit: filter.limit || 10, // Keep the current limit
    };

    // Update the filter state
    setFilter(newFilter);

    // Update the URL without the filter parameters
    const queryParams = new URLSearchParams();
    queryParams.set("page", "1");
    queryParams.set("limit", String(newFilter.limit));

    router.push(`?${queryParams.toString()}`, undefined, { shallow: true });
  }, [filter.limit, router]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(true);
    }
  }, []);
  const data = [...table?.data].map((item, index) => ({
    ...item,
    item_name: (
      <div className="flex gap-2 items-center">
        <Image
          src={item.full_path_image}
          alt="image"
          width={50}
          height={50}
          className="p-2"
        />
        <div>
          <h5 className="text-black">{item.name}</h5>
          <div>
            <p>Available</p>
            <p>QRCode</p>
            <p>{item.code}</p>
          </div>
        </div>
      </div>
    ),
    action: (
      <div key={index} className="flex gap-2">
        <Button
          className="bg-orange-200 text-orange-500"
          variant="custom-color"
          type="button"
          onClick={() => {
            router.push(`/main/items/${item.id}/detail?type=bulk`);
          }}
        >
          <EyeIcon className="w-4 h-4" />
        </Button>
      </div>
    ),
  }));
  const itemTabs = [
    { label: "Individual Item", href: `/main/items` },
    { label: "Bulk Item", href: `/main/items/bulk` },
  ];
  // Handle filter changes and update URL
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const queryParams = new URLSearchParams();

      // Always include page and limit
      queryParams.set("page", String(filter.page || 1));
      queryParams.set("limit", String(filter.limit || 10));

      // Include search if it exists
      if (filter.search) {
        queryParams.set("search", filter.search);
      }

      // Include location if it's not 'all'
      if (filter.location && filter.location !== "all") {
        queryParams.set("location", filter.location);
      }

      // Only update URL if there are changes to avoid unnecessary re-renders
      if (
        queryParams.toString() !==
        new URLSearchParams(router.asPath.split("?")[1] || "").toString()
      ) {
        router.push(`?${queryParams.toString()}`, undefined).catch(() => {
          // Ignore navigation cancellation errors
        });
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [filter, router]);
  return (
    <div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">List Bulk Items</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Search Bulk Items"
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
            <option value="all">All Locations</option>
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
          {itemTabs.map((tab) => {
            const isActive = router.pathname === tab.href;
            return (
              <button
                key={tab.href}
                className={`px-4 py-2 font-medium text-sm ${isActive
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
                onClick={() => router.push(tab.href)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        {show && (
          <div className="mt-4">
            <DataTable
              columns={ColumnBulkItems}
              data={data}
              pagination
              highlightOnHover
              paginationTotalRows={table?.total_data || 0}
              paginationRowsPerPageOptions={[10, 20, 50, 100]}
              paginationServer
              onChangePage={(page) =>
                setFilter((prev: any) => ({ ...prev, page }))
              }
              onChangeRowsPerPage={(limit, page) => setFilter({ limit, page })}
              responsive
              customStyles={{
                headCells: {
                  style: {
                    backgroundColor: "#f3f4f6",
                    fontWeight: "bold",
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
