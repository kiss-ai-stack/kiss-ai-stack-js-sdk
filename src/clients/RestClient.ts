import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { TimeoutConfig } from "../types/Config.js";

export class RestClient {
    private readonly client: AxiosInstance;
    private readonly timeout: TimeoutConfig;

    constructor(baseUrl: string) {
        this.timeout = {
            connect: 3600,
            read: 3600,
            write: 3600,
            pool: 3600,
        };

        this.client = axios.create({
            baseURL: baseUrl,
            timeout: this.timeout.read * 1000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor for logging or modifying requests
        this.client.interceptors.request.use(
            (config) => {
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for handling responses
        this.client.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error: AxiosError) => {
                if (!error.response) {
                    throw new Error('Network error or timeout occurred');
                }

                // Handle specific HTTP status codes
                const { status, data } = error.response;
                if (status >= 500) {
                    throw new Error(`Server error: ${status}`);
                }
                if (status === 401) {
                    throw new Error('Unauthorized');
                }
                if (status === 403) {
                    throw new Error('Forbidden');
                }
                if (status === 404) {
                    throw new Error('Resource not found');
                }

                // Handle other client errors
                throw new Error(`Request failed with status ${status}: ${JSON.stringify(data)}`);
            }
        );
    }

    async get<T = any>(
        url: string,
        headers: Record<string, string> = {},
        params?: Record<string, any>
    ): Promise<T> {
        const response = await this.client.get<T>(url, { headers, params });
        return response.data;
    }

    async post<T = any>(
        url: string,
        body: Record<string, any>,
        headers: Record<string, string> = {},
        params?: Record<string, any>
    ): Promise<T> {
        const response = await this.client.post<T>(url, body, { headers, params });
        return response.data;
    }

    async put<T = any>(
        url: string,
        body: Record<string, any>,
        headers: Record<string, string> = {},
        params?: Record<string, any>
    ): Promise<T> {
        const response = await this.client.put<T>(url, body, { headers, params });
        return response.data;
    }

    async delete<T = any>(
        url: string,
        headers: Record<string, string> = {},
        params?: Record<string, any>
    ): Promise<T> {
        const response = await this.client.delete<T>(url, { headers, params });
        return response.data;
    }

    addResponseInterceptor(
        onFulfilled?: (value: AxiosResponse) => any | Promise<any>,
        onRejected?: (error: AxiosError) => any
    ) {
        return this.client.interceptors.response.use(onFulfilled, onRejected);
    }

    setBaseHeader(key: string, value: string) {
        this.client.defaults.headers.common[key] = value;
    }

    setTimeout(timeoutMs: number) {
        this.client.defaults.timeout = timeoutMs;
    }
}
