import { ParsedUrlQuery } from "querystring";

export const toMoney = (number: number) => {
    // Check if the input is a valid number
    if (isNaN(number)) {
        throw new Error("Input must be a valid number");
    }

    // Convert the number to a string with two decimal places
    let price = number?.toFixed(0);

    // Add comma as thousands separator
    price = price?.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Add the currency symbol
    return `${price}`;
}

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
    if (phoneNumber.startsWith('+62')) {
        return '62' + phoneNumber.slice(3);
    } else if (phoneNumber.startsWith('0')) {
        return '62' + phoneNumber.slice(1);
    } else if (phoneNumber.startsWith('8')) {
        return '62' + phoneNumber;
    } else {
        return phoneNumber;
    }
}

export const queryToUrlSearchParams = (query: ParsedUrlQuery): URLSearchParams => {
    const params = new URLSearchParams();

    Object.keys(query).forEach(key => {
        const value = query[key];
        if (Array.isArray(value)) {
            value.forEach(val => {
                if (val !== undefined) {
                    params.append(key, val);
                }
            });
        } else if (value !== undefined) {
            params.append(key, value);
        }
    });

    return params;
}