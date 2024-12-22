import fs from "fs/promises";
import { EventAbc } from "./EventsAbc.js";
import { RestClient } from "../clients/RestClient.js";
import {
    DocumentsRequestBody,
    FileObject,
    GenericResponseBody,
    QueryRequestBody,
    SessionRequest,
    SessionResponse
} from "../types/dtos.js";

export class RestEvent extends EventAbc {
    private readonly hostname: string;
    private readonly secureProtocol: boolean;
    private client: RestClient;
    private session: SessionResponse | null;
    private headers: Record<string, string>;

    constructor(hostname: string, secureProtocol = true) {
        super();
        this.hostname = hostname;
        this.secureProtocol = secureProtocol;
        this.client = new RestClient(
            `${secureProtocol ? 'https' : 'http'}://${hostname}`
        );
        this.session = null;
        this.headers = {};
    }

    getSession(): SessionResponse | null {
        return this.session;
    }

    async authorizeStack(
        clientId?: string,
        clientSecret?: string,
        scope?: string
    ): Promise<SessionResponse> {
        try {
            const data = await this.client.post<SessionResponse>(
                '/auth',
                {
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: scope
                } as SessionRequest
            );

            if (!data.access_token) {
                throw new Error('No access token received');
            }

            this.session = data;
            this.headers.Authorization = `Bearer ${data.access_token}`;
            this.client.setBaseHeader('Authorization', `Bearer ${data.access_token}`);

            return data;
        } catch (e) {
            console.error('Authorization failed:', e);
            throw e;
        }
    }

    async destroyStack(data?: string): Promise<GenericResponseBody> {
        try {
            if (!this.headers.Authorization) {
                console.warn('No active session to destroy');
                return { result: 'No active session' };
            }

            const result = await this.client.post<GenericResponseBody>(
                '/sessions',
                { query: data || 'Goodbye!' } as QueryRequestBody,
                this.headers,
                { action: 'close' }
            );

            this.session = null;
            delete this.headers.Authorization;
            this.client.setBaseHeader('Authorization', '');

            return result;
        } catch (e) {
            console.error('Failed to destroy stack session:', e);
            throw e;
        }
    }

    async bootstrapStack(data?: string): Promise<GenericResponseBody> {
        try {
            if (!this.headers.Authorization) {
                throw new Error('No active session. Call authorizeStack first.');
            }

            return await this.client.post<GenericResponseBody>(
                '/sessions',
                { query: data } as QueryRequestBody,
                this.headers,
                { action: 'init' }
            );
        } catch (e) {
            console.error('Failed to bootstrap stack:', e);
            throw e;
        }
    }

    async generateAnswer(data?: string): Promise<GenericResponseBody> {
        try {
            if (!this.headers.Authorization) {
                throw new Error('No active authorization. Call authorizeStack first.');
            }

            return await this.client.post<GenericResponseBody>(
                '/queries',
                { query: data } as QueryRequestBody,
                this.headers
            );
        } catch (e) {
            console.error('Failed to generate answer:', e);
            throw e;
        }
    }

    async storeData(
        files: string[],
        metadata?: Record<string, any>
    ): Promise<GenericResponseBody> {
        try {
            if (!this.headers.Authorization) {
                throw new Error('No active authorization. Call authorizeStack first.');
            }

            const encodedFiles: Awaited<FileObject | null>[] = await Promise.all(
                files.map(async (filePath) => {
                    try {
                        const buffer = await fs.readFile(filePath);
                        const base64 = Buffer.from(buffer).toString('base64');
                        return {
                            name: filePath.split('/').pop() || '',
                            content: base64
                        } as FileObject;
                    } catch (e) {
                        console.warn(`File not found: ${filePath}`);
                        return null;
                    }
                })
            );

            const validFiles = encodedFiles.filter((file): file is FileObject => file !== null);

            if (validFiles.length === 0) {
                throw new Error('No valid files to store');
            }

            return await this.client.post<GenericResponseBody>(
                '/documents',
                {
                    files: validFiles,
                    metadata: metadata || {}
                } as DocumentsRequestBody,
                this.headers
            );
        } catch (e) {
            console.error('Failed to store documents:', e);
            throw e;
        }
    }
}
