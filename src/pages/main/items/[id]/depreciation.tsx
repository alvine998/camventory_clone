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
import { toMoney } from "@/utils";

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

const parsePurchaseDate = (value: any): moment.Moment => {
  if (!value) {
    return moment();
  }

  if (typeof value === "number") {
    const isSeconds = value.toString().length === 10;
    return moment(isSeconds ? value * 1000 : value);
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      const isSeconds = value.length === 10;
      return moment(isSeconds ? numeric * 1000 : numeric);
    }
    return moment(value);
  }

  return moment();
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
        purchaseDate: parsePurchaseDate(itemDetail?.purchase_date),
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

    const purchaseDateMoment = parsePurchaseDate(itemDetail?.purchase_date);
    const totalMonths = Math.max(1, Math.round(usefulLifeYears * 12));
    const totalDepreciableAmount = Math.max(0, purchasePriceRaw - Math.max(0, residualValueRaw));
    const monthlyDepreciationRaw = totalMonths > 0 ? totalDepreciableAmount / totalMonths : 0;

    const schedule: DepreciationPoint[] = [];
    let previousBookValue = purchasePriceRaw;

    for (let month = 0; month <= totalMonths; month++) {
      const currentBookValue = Math.max(
        purchasePriceRaw - monthlyDepreciationRaw * month,
        Math.max(0, residualValueRaw)
      );

      const depreciationExpense =
        month === 0 ? 0 : Math.max(0, previousBookValue - currentBookValue);

      const accumulatedDepreciation = Math.min(
        totalDepreciableAmount,
        Math.max(0, purchasePriceRaw - currentBookValue)
      );

      const period = purchaseDateMoment.clone().add(month, "months");

      schedule.push({
        label: period.format("MMM YYYY"),
        dateISO: period.toISOString(),
        bookValue: Number(currentBookValue.toFixed(0)),
        depreciationExpense: Number(depreciationExpense.toFixed(0)),
        accumulatedDepreciation: Number(accumulatedDepreciation.toFixed(0)),
      });

      previousBookValue = currentBookValue;
    }

    return {
      schedule,
      monthlyDepreciation: monthlyDepreciationRaw,
      residualValue: residualValueRaw,
      purchasePrice: purchasePriceRaw,
      usefulLifeYears,
      purchaseDate: purchaseDateMoment,
      totalDepreciableAmount,
    };
  }, [itemDetail]);

  const { schedule, purchasePrice, purchaseDate } = depreciationContext;

  const depreciationAvailable = schedule.length > 0 && purchasePrice > 0;

  const milestonePoints = useMemo(() => {
    if (!depreciationAvailable) {
      return [] as DepreciationPoint[];
    }

    const points: DepreciationPoint[] = [];

    schedule.forEach((point, index) => {
      if (index === 0) {
        points.push(point);
        return;
      }
      const monthsSinceStart = moment(point.dateISO).diff(purchaseDate, "months");
      const isYearBoundary = monthsSinceStart % 12 === 0;
      const isFinalPoint = index === schedule.length - 1;

      if (isYearBoundary || isFinalPoint) {
        points.push(point);
      }
    });

    return points;
  }, [depreciationAvailable, schedule, purchaseDate]);

  const milestoneCategories = useMemo(() => {
    if (!depreciationAvailable || milestonePoints.length === 0) {
      return [] as string[];
    }

    return milestonePoints.map((point, idx) => {
      if (idx === 0) {
        return "Purchase";
      }

      const years = Math.max(
        1,
        Math.round(moment(point.dateISO).diff(purchaseDate, "years", true))
      );

      return `EOY${years}`;
    });
  }, [depreciationAvailable, milestonePoints, purchaseDate]);

  const chartOptions: ApexOptions = useMemo(() => {
    return {
      chart: {
        type: "line",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
        },
      },
      title: {
        text: "Straight-Line Depreciation",
        align: "center",
        style: {
          fontSize: "18px",
          fontWeight: 600,
          color: "#111827",
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (value: number) => formatChartCurrency(value),
        offsetY: -10,
        style: {
          colors: ["#6B7280"],
          fontWeight: 500,
        },
        background: {
          enabled: false,
        },
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
        categories: milestoneCategories,
        title: {
          text: "Time Period",
          style: {
            fontWeight: 600,
          },
        },
        labels: {
          rotate: 0,
          style: {
            colors: "#6B7280",
          },
        },
      },
      yaxis: {
        title: {
          text: "Next Value",
          style: {
            fontWeight: 600,
          },
        },
        labels: {
          formatter: (value: number) => formatChartCurrency(value),
        },
      },
      tooltip: {
        y: {
          formatter: (value: number) => formatChartCurrency(value),
        },
        shared: true,
        intersect: false,
      },
      grid: {
        strokeDashArray: 3,
      },
      colors: ["#4B5563"],
    };
  }, [milestoneCategories]);

  const chartSeries = useMemo(
    () => [
      {
        name: "Book Value",
        data: milestonePoints.map((point) => point.bookValue),
      },
    ],
    [milestonePoints]
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
          {show && milestonePoints.length > 0 ? (
            <Chart options={chartOptions} series={chartSeries} type="line" height={360} />
          ) : (
            <div className="flex h-[360px] items-center justify-center text-sm text-gray-400">
              Loading chart...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
