import { ParsedUrlQuery } from "querystring";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import moment from "moment";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toMoney = (value: any) => {
  const numeric = Number(value);
  // Check if the input is a valid number
  if (isNaN(numeric)) {
    return "0";
  }

  // Convert the number to a string with zero decimal places
  let price = numeric.toFixed(0);

  // Add comma as thousands separator
  price = price.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Add the currency symbol
  return `${price}`;
};

/**
 * Formats an epoch timestamp (seconds or milliseconds) to a string.
 * @param value The epoch timestamp (number or string)
 * @param format The moment format string (default: "DD-MM-YYYY")
 */
export const formatEpochDate = (
  value: any,
  format: string = "DD-MM-YYYY",
): string => {
  if (!value) {
    return "-";
  }

  let timestamp: number;

  if (typeof value === "number") {
    timestamp = value;
  } else if (typeof value === "string") {
    timestamp = Number(value);
    if (isNaN(timestamp)) {
      // If it's a date string, moment will handle it
      return moment(value).format(format);
    }
  } else {
    return "-";
  }

  // Check if timestamp is in seconds (10 digits) or milliseconds (13 digits)
  // Unix timestamps in seconds are typically around 10 digits
  const isSeconds = timestamp.toString().length === 10;
  return moment(isSeconds ? timestamp * 1000 : timestamp).format(format);
};

export const parseEpochToMoment = (value: any): moment.Moment => {
  if (!value) {
    return moment();
  }

  let timestamp: number;
  if (typeof value === "number") {
    timestamp = value;
  } else if (typeof value === "string") {
    timestamp = Number(value);
    if (isNaN(timestamp)) {
      return moment(value);
    }
  } else {
    return moment();
  }

  const isSeconds = timestamp.toString().length === 10;
  return moment(isSeconds ? timestamp * 1000 : timestamp);
};

// Create a function to convert the object to a query string
export const createQueryString = (filters: any) => {
  const params = new URLSearchParams();
  for (const key in filters) {
    if (filters.hasOwnProperty(key)) {
      params.append(key, filters[key]);
    }
  }
  return params.toString();
};

export function normalizePhoneNumber(phoneNumber: any) {
  if (phoneNumber.startsWith("+62")) {
    return "62" + phoneNumber.slice(3);
  } else if (phoneNumber.startsWith("0")) {
    return "62" + phoneNumber.slice(1);
  } else if (phoneNumber.startsWith("8")) {
    return "62" + phoneNumber;
  } else {
    return phoneNumber;
  }
}

export const queryToUrlSearchParams = (
  query: ParsedUrlQuery,
): URLSearchParams => {
  const params = new URLSearchParams();

  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (val !== undefined) {
          params.append(key, val);
        }
      });
    } else if (value !== undefined) {
      params.append(key, value);
    }
  });

  return params;
};

export const getStatusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "available";
    case "pending":
      return "warning";
    case "cancelled":
      return "empty";
    case "completed":
      return "available";
    case "overdue":
      return "empty";
    case "booked":
      return "warning";
    case "available":
      return "available";
    default:
      return "custom";
  }
};
