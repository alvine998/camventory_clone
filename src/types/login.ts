export interface ILoginResponse {
    message: string;
    status:  number;
    data:    Data;
    error:   Error;
}

export interface Data {
    access_token:  string;
    refresh_token: string;
}

export interface Error {
    code:    number;
    message: string;
    status:  boolean;
}