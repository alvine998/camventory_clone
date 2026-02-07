import Header from "@/components/detail-item/Header";
import Tabs from "@/components/Tabs";
import React, { useEffect, useMemo, useState } from "react";
import { itemTabs } from "./detail";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import moment from "moment";
import axios from "axios";
import { CONFIG } from "@/config";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { parseEpochToMoment, toMoney } from "@/utils";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, params, query } = ctx;
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

    let result = null;
    if (query.type === "bulk" && params) {
      result = await axios.get(`${CONFIG.API_URL}/v1/bulk-items/${params.id}`, {
        headers: {
          Authorization: `${token}`,
        },
      });
    } else if (query.type === "single" && params) {
      result = await axios.get(
        `${CONFIG.API_URL}/v1/single-items/${params.id}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );
    } else {
      throw new Error(`Invalid query.type: ${query.type}`);
    }

    if (result.status !== 200) {
      throw new Error(`API request failed with status code ${result.status}`);
    }

    // Optionally validate token...
    return { props: { params, detail: result?.data, query } };
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
      props: { table: [] },
    };
  }
};

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type DepreciationPoint = {
  label: string;
  dateISO: string;
  bookValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
};

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "-";
  }

  const sanitized = Math.max(0, Math.round(numericValue));

  try {
    return `Rp ${toMoney(sanitized)}`;
  } catch {
    return `Rp ${sanitized.toLocaleString("id-ID")}`;
  }
};

const formatChartCurrency = (value?: number | null) => {
  const formatted = formatCurrency(value);
  return formatted.replace("Rp ", "Rp");
};

export default function Depreciation({ params, detail, query }: any) {
  const [show, setShow] = useState<boolean>(false);
  const itemDetail = detail?.data;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(true);
    }
  }, []);

  const depreciationContext = useMemo(() => {
    const emptyResult = {
      schedule: [] as DepreciationPoint[],
      monthlyDepreciation: 0,
      residualValue: 0,
      purchasePrice: 0,
      usefulLifeYears: 0,
      purchaseDate: moment(),
      totalDepreciableAmount: 0,
    };

    if (!itemDetail) {
      return emptyResult;
    }

    const purchasePriceRaw = Number(itemDetail?.purchase_price ?? 0);

    if (!purchasePriceRaw || Number.isNaN(purchasePriceRaw) || purchasePriceRaw <= 0) {
      return {
        ...emptyResult,
        purchaseDate: itemDetail?.purchase_date
          ? parseEpochToMoment(itemDetail?.purchase_date)
          : moment("2025-01-01"),
      };
    }

    const residualValueRaw = Number(itemDetail?.residual_value ?? 0);
    const usefulLifeRaw = Number(
      itemDetail?.depreciation_years ??
      itemDetail?.useful_life_years ??
      itemDetail?.lifespan_years ??
      itemDetail?.life_year ??
      0
    );

    const usefulLifeYears = usefulLifeRaw > 0 ? usefulLifeRaw : 5; // Default to 5 years if not provided

    const purchaseDateMoment = itemDetail?.purchase_date
      ? parseEpochToMoment(itemDetail?.purchase_date)
      : moment("2025-01-01");
    const MONTHLY_RATE = 0.003; // 0.3% per month
    const totalMonths = Math.max(1, Math.round(usefulLifeYears * 12));

    const schedule: DepreciationPoint[] = [];
    let currentBookValue = purchasePriceRaw;
    let accumulatedDepreciation = 0;

    // Point 0: Purchase
    schedule.push({
      label: purchaseDateMoment.format("MMM YYYY"),
      dateISO: purchaseDateMoment.toISOString(),
      bookValue: Math.round(currentBookValue),
      depreciationExpense: 0,
      accumulatedDepreciation: 0,
    });

    for (let month = 1; month <= totalMonths; month++) {
      const previousBookValue = currentBookValue;
      // Formula: Value_new = Value_old * (1 - 0.003)
      currentBookValue = previousBookValue * (1 - MONTHLY_RATE);

      const depreciationExpense = previousBookValue - currentBookValue;
      accumulatedDepreciation += depreciationExpense;

      const period = purchaseDateMoment.clone().add(month, "months");

      schedule.push({
        label: period.format("MMM YYYY"),
        dateISO: period.toISOString(),
        bookValue: Math.round(currentBookValue),
        depreciationExpense: Math.round(depreciationExpense),
        accumulatedDepreciation: Math.round(accumulatedDepreciation),
      });
    }

    return {
      schedule,
      monthlyDepreciation: 0, // Not applicable for declining balance in the same way
      residualValue: residualValueRaw,
      purchasePrice: purchasePriceRaw,
      usefulLifeYears,
      purchaseDate: purchaseDateMoment,
      totalDepreciableAmount: accumulatedDepreciation,
    };
  }, [itemDetail]);

  const { schedule, purchasePrice, purchaseDate } = depreciationContext;

  const depreciationAvailable = schedule.length > 0 && purchasePrice > 0;

  // No longer using categories, switching to datetime axis

  const chartOptions: ApexOptions = useMemo(() => {
    return {
      chart: {
        type: "line",
        toolbar: {
          show: true,
        },
        zoom: {
          enabled: true,
        },
        animations: {
          enabled: true,
        },
      },
      title: {
        text: "Book Value Projection (0.3% Monthly)",
        align: "center",
        style: {
          fontSize: "18px",
          fontWeight: 600,
          color: "#111827",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
        width: 2,
        colors: ["#4B5563"],
      },
      markers: {
        size: 4,
        colors: ["#ffffff"],
        strokeColors: "#4B5563",
        strokeWidth: 2,
      },
      xaxis: {
        type: "datetime",
        title: {
          text: "Time Period",
          style: {
            fontWeight: 600,
          },
        },
        labels: {
          style: {
            colors: "#6B7280",
          },
        },
      },
      yaxis: {
        title: {
          text: "Book Value",
          style: {
            fontWeight: 600,
          },
        },
        labels: {
          formatter: (value: number) => formatChartCurrency(value),
        },
      },
      tooltip: {
        x: {
          format: "MMM yyyy",
        },
        y: {
          formatter: (value: number) => formatChartCurrency(value),
        },
        shared: true,
        intersect: false,
      },
      grid: {
        strokeDashArray: 3,
      },
      colors: ["#f97316"],
    };
  }, []); // Remove dependency on milestoneCategories

  const chartSeries = useMemo(
    () => [
      {
        name: "Book Value",
        data: schedule.map((point) => ({
          x: new Date(point.dateISO).getTime(),
          y: point.bookValue,
        })),
      },
    ],
    [schedule]
  );

  return (
    <div className="p-2">
      <Header detail={detail?.data} query={query} />
      <div className="mt-4">
        <Tabs tabs={itemTabs(params?.id, query)} />
      </div>

      {!depreciationAvailable ? (
        <div className="mt-10 rounded-lg border border-dashed border-gray-300 bg-white/60 p-8 text-center text-sm text-gray-500">
          Depreciation data is not available for this item yet. Ensure that the purchase price and depreciation settings are configured.
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">
              Book Value Projection
            </h3>
            <span className="text-xs text-gray-500">
              Starting {purchaseDate.format("DD MMM YYYY")}
            </span>
          </div>
          {show && schedule.length > 0 ? (
            <div className="flex flex-col gap-6">
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="line"
                height={360}
              />

              <div className="mt-4">
                <h3 className="mb-4 text-base font-semibold text-gray-800">
                  Detailed Projection Table
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-2 border-b">Period</th>
                        <th className="px-4 py-2 border-b">Book Value</th>
                        <th className="px-4 py-2 border-b text-right">Depreciation</th>
                        <th className="px-4 py-2 border-b text-right">Accumulated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 italic">
                      {schedule.map((point, idx) => (
                        <tr
                          key={idx}
                          className={idx % 12 === 0 ? "bg-orange-50/50 font-medium" : ""}
                        >
                          <td className="px-4 py-2">{point.label}</td>
                          <td className="px-4 py-2">{formatCurrency(point.bookValue)}</td>
                          <td className="px-4 py-2 text-right text-red-500">
                            {idx === 0 ? "-" : `-${formatCurrency(point.depreciationExpense)}`}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {formatCurrency(point.accumulatedDepreciation)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[360px] items-center justify-center text-sm text-gray-400">
              Loading projection...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
