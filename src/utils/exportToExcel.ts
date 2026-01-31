import * as XLSX from "xlsx";
import { toMoney } from "./index";
import axios from "axios";
import { CONFIG } from "@/config";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: any[];
  summaryData?: { label: string; value: string | number }[];
}

/**
 * Export data to Excel file
 * @param options Export configuration options
 */
export const exportToExcel = (options: ExportOptions) => {
  const {
    filename,
    sheetName = "Sheet1",
    columns,
    data,
    summaryData,
  } = options;

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Prepare data for export
  const exportData: any[] = [];

  // Add summary data if provided
  if (summaryData && summaryData.length > 0) {
    exportData.push(["SUMMARY"]);
    exportData.push([]); // Empty row
    summaryData.forEach((item) => {
      exportData.push([item.label, item.value]);
    });
    exportData.push([]); // Empty row
    exportData.push([]); // Empty row
  }

  // Add headers
  const headers = columns.map((col) => col.header);
  exportData.push(headers);

  // Add data rows
  data.forEach((row) => {
    const rowData = columns.map((col) => {
      const value = row[col.key];
      // Handle null/undefined values
      if (value === null || value === undefined) return "";
      return value;
    });
    exportData.push(rowData);
  });

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(exportData);

  // Set column widths
  const columnWidths = columns.map((col) => ({
    wch: col.width || 20,
  }));
  worksheet["!cols"] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Format number as currency (Rupiah)
 */
export const formatCurrency = (value: any): string => {
  return `Rp ${toMoney(value)}`;
};

/**
 * Download report from API
 * @param path API path after /v1/report/download/
 * @param params Query parameters
 * @param token Authorization token
 * @param filename Desired filename
 */
export const downloadReport = async (
  path: string,
  params: any,
  token: string,
  filename: string,
) => {
  try {
    const response = await axios.get(
      `${CONFIG.API_URL}/v1/report/download/${path}`,
      {
        params,
        headers: {
          Authorization: `${token}`,
        },
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading report:", error);
    alert("Failed to download report");
  }
};
