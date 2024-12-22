import { TimeoutConfig } from "../types/Config.js";

export class RestClient {
    private readonly timeout: TimeoutConfig;
    private readonly client: typeof fetch;
    private readonly baseUrl: string;

    constructor(baseUrl: string, customFetch?: typeof fetch) {
        this.baseUrl = baseUrl;
        this.timeout = {
            connect: 3600,
            read: 3600,
            write: 3600,
            pool: 3600,
        };
        this.client = customFetch || fetch;
    }

    async get(
        url: string,
        headers: Record<string, string>,
        params?: Record<string, any>
    ): Promise<Response> {
        return this.makeRequest('GET', url, headers, undefined, params);
    }

    async post(
        url: string,
        requestBody: Record<string, any>,
        headers?: Record<string, string>,
        params?: Record<string, any>
    ): Promise<Response> {
        return this.makeRequest('POST', url, headers, requestBody, params);
    }

    async put(
        url: string,
        headers: Record<string, string>,
        requestBody: Record<string, any>,
        params?: Record<string, any>
    ): Promise<Response> {
        return this.makeRequest('PUT', url, headers, requestBody, params);
    }

    private async makeRequest(
        method: string,
        url: string,
        headers?: Record<string, string>,
        body?: Record<string, any>,
        params?: Record<string, any>
    ): Promise<Response> {
        const queryParams = params ? `?${new URLSearchParams(params)}` : '';
        const fullUrl = `${this.baseUrl}${url}${queryParams}`;

        try {
            const response = await this.client(fullUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(this.timeout.read * 1000),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (e) {
            throw new Error(`An error occurred while making ${method} request to ${url}: ${e}`);
        }
    }
}
