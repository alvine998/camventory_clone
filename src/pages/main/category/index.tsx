import Button from "@/components/Button";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import CategoryCreateModal from "@/components/modals/category/create";
import CategoryDeleteModal from "@/components/modals/category/delete";
import CategoryUpdateModal from "@/components/modals/category/update";
import { CONFIG } from "@/config";
import { ColumnCategory } from "@/constants/column_category";
import axios from "axios";
import { parse } from "cookie";
import { PencilLineIcon, TrashIcon } from "lucide-react";
import { GetServerSideProps } from "next";
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
    const { page = 1, limit = 10, search = "" } = query;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      bulk: String(query.bulk || ""),
      location: String(query.location || ""),
    });

    if (typeof search === "string" && search.trim() !== "") {
      params.set("search", search);
    }

    const [table, notificationsData, unreadNotificationsData] = await Promise.all([
      axios.get(
        `${CONFIG.API_URL}/v1/master/categories?${params.toString()}`,
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
    // Normalize the response to always be { data: Category[], total?: number, ... }
    return {
      props: {
        table: { data: table?.data?.data || [], ...table?.data?.meta },
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
    // Ensure consistent shape on error
    return {
      props: {
        table: { data: [], total: 0 },
        notifications: [],
        unreadNotifications: [],
      },
    };
  }
};

interface Category {
  id?: string | number;
  name: string;
  action?: React.ReactNode;
}

// Normalized table response from API
interface FilterState {
  search?: string;
  location?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

interface CategoryTableResponse {
  data: Category[];
  total_data?: number;
  total?: number;
  page?: number;
  limit?: number;
  // Allow any additional fields returned by the API without breaking typing
  [key: string]: any;
}

interface AdministratorPageProps {
  table: CategoryTableResponse;
}

export default function AdministratorPage({ table }: AdministratorPageProps) {
  const [show, setShow] = useState<boolean>(false);
  const [modal, setModal] = useState<useModal>();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterState>(router.query);

  // Reset all filters and pagination
  const handleResetFilter = useCallback(() => {
    setFilter((prev) => ({
      search: "",
      location: "",
      page: 1,
      limit: prev.limit || 10, // Keep the current limit
    }));
  }, []); // No dependencies needed as we're using the functional update form
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(true);
    }
  }, []);
  // Ensure data is always an array and handle potential undefined/null cases
  const data = (Array.isArray(table?.data) ? table.data : []).map(
    (item: Category, index: number) => ({
      ...item,
      action: (
        <div key={index} className="flex gap-2">
          <Button
            className="bg-orange-200 text-orange-500"
            variant="custom-color"
            type="button"
            onClick={() => {
              setModal({
                open: true,
                data: item,
                key: "update",
              });
            }}
          >
            <PencilLineIcon className="w-4 h-4" />
          </Button>
          <Button
            className="bg-red-200 text-red-500"
            variant="custom-color"
            type="button"
            onClick={() => {
              setModal({
                open: true,
                data: item,
                key: "delete",
              });
            }}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    })
  );

  // Debounce search to prevent too many requests
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const queryParams = new URLSearchParams();

      // Only include non-empty filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          queryParams.set(key, String(value));
        }
      });

      const currentQuery = new URLSearchParams(
        window.location.search
      ).toString();
      const newQuery = queryParams.toString();

      // Only push if the filter has actually changed
      if (newQuery !== currentQuery) {
        router.push(`?${newQuery}`).catch(() => {
          // Ignore navigation cancellation errors
        });
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  return (
    <div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">List Category Items</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Search Category Items"
            type="search"
            className="flex-1 min-w-[200px]"
            value={typeof filter.search === "string" ? filter.search : ""}
            onChange={(e) =>
              setFilter((prev: FilterState) => ({
                ...prev,
                search: e.target.value,
                page: 1,
              }))
            }
          />
          {(filter.search || filter.location) && (
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
          className="bg-orange-500 text-white whitespace-nowrap"
          type="button"
          onClick={() => setModal({ open: true, key: "create" })}
        >
          + Add Category
        </Button>
      </div>
      <div className="w-full overflow-x-auto">
        {show && (
          <div className="mt-4">
            <DataTable
              columns={ColumnCategory}
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
      {modal?.key == "create" && (
        <CategoryCreateModal open={modal?.open} setOpen={setModal} />
      )}
      {modal?.key == "update" && (
        <CategoryUpdateModal
          open={modal?.open}
          setOpen={setModal}
          data={modal?.data}
        />
      )}
      {modal?.key == "delete" && (
        <CategoryDeleteModal
          open={modal?.open}
          setOpen={setModal}
          data={modal?.data}
        />
      )}
    </div>
  );
}
