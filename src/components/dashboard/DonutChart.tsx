import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

import Skeleton from "../Skeleton";

interface DonutChartProps {
    title: string;
    labels: string[];
    series: number[];
    colors: string[];
    totalLabel?: string;
    loading?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({
    title,
    labels,
    series,
    colors,
    totalLabel = "Total",
    loading = false,
}) => {
    const total = series.reduce((a, b) => a + b, 0);

    const options: ApexOptions = {
        chart: {
            type: "donut",
        },
        labels: labels,
        colors: colors,
        legend: {
            position: "bottom",
            horizontalAlign: "center",
            markers: {
                size: 6,
            },
        },
        dataLabels: {
            enabled: false,
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "70%",
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: totalLabel,
                            formatter: () => total.toString(),
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "#374151",
                        },
                    },
                },
            },
        },
        stroke: {
            show: false,
        },
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full ring-1 ring-gray-200 min-h-[350px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
            <div className="flex-grow flex items-center justify-center">
                {loading ? (
                    <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
                        <Skeleton className="w-48 h-48 rounded-full" />
                        <div className="flex gap-2">
                            <Skeleton className="w-16 h-4" />
                            <Skeleton className="w-16 h-4" />
                        </div>
                    </div>
                ) : series.length === 0 || total === 0 ? (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm font-medium">No Data Available</p>
                    </div>
                ) : (
                    <Chart
                        options={options}
                        series={series}
                        type="donut"
                        width="100%"
                        height={300}
                    />
                )}
            </div>
        </div>
    );
};

export default DonutChart;
