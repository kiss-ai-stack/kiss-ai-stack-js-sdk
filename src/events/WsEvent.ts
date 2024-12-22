import fs from "fs/promises";
import { EventAbc } from "./EventsAbc.js";
import { RestClient } from "../clients/RestClient.js";
import { FileObject, GenericResponseBody, SessionRequest, SessionResponse } from "../types/dtos.js";
import { WebSocketClient } from "../clients/WebSocketClient.js";
import { ServerEvent } from "../types/ServerEvent.js";


export class WebSocketEvent extends EventAbc {
    private readonly hostname: string;
    private readonly secureProtocol: boolean;
    private headers: Record<string, string> | null;
    private client: WebSocketClient | null;
    private session: SessionResponse | null;

    constructor(hostname: string, secureProtocol = true) {
        super();
        this.hostname = hostname;
        this.secureProtocol = secureProtocol;
        this.headers = null;
        this.client = null;
        this.session = null;
    }

    async initClient(): Promise<void> {
        this.client = new WebSocketClient(
            `${this.secureProtocol ? 'wss' : 'ws'}://${this.hostname}/ws`,
            this.headers || undefined
        );
        await this.client.connect();
    }

    async authorizeStack(
        clientId?: string,
        clientSecret?: string,
        scope?: string
    ): Promise<SessionResponse> {
        try {
            const httpClient = new RestClient(
                `${this.secureProtocol ? 'https' : 'http'}://${this.hostname}`
            );

            const response = await httpClient.post(
                '/auth',
                {
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: scope
                } as SessionRequest,
                {}
            );

            const sessionResult = (await response.json()) as SessionResponse;
            if (!sessionResult.access_token) {
                throw new Error('No access token received');
            }

            this.session = sessionResult;
            this.headers = {Authorization: `Bearer ${sessionResult.access_token}`};

            if (!this.client) {
                await this.initClient();
            }

            return sessionResult;
        } catch (e) {
            console.error('Authorization failed:', e);
            throw e;
        }
    }

    async destroyStack(data?: string): Promise<GenericResponseBody> {
        try {
            const response = await this.sendMessage(ServerEvent.ON_CLOSE, {
                query: data || 'Goodbye!'
            });
            await this.client?.close();
            return response;
        } catch (e) {
            console.error('Failed to destroy stack session:', e);
            throw e;
        }
    }

    async bootstrapStack(data?: string): Promise<GenericResponseBody> {
        try {
            const response = await this.sendMessage(ServerEvent.ON_INIT, {
                query: data || 'Greetings!'
            });
            return response;
        } catch (e) {
            console.error('Failed to bootstrap stack:', e);
            throw e;
        }
    }

    async generateAnswer(data?: string): Promise<GenericResponseBody> {
        try {
            const response = await this.sendMessage(ServerEvent.ON_QUERY, {
                query: data
            });
            return response;
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
            const encodedFiles: Awaited<FileObject | null>[] = await Promise.all(
                files.map(async (filePath) => {
                    try {
                        const buffer = await fs.readFile(filePath);
                        const base64 = Buffer.from(buffer).toString('base64');
                        return {
                            name: filePath.split('/').pop() || '',
                            content: base64
                        } as unknown as FileObject;
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

            return await this.sendMessage(ServerEvent.ON_STORE, {
                files: validFiles.map(f => ({name: f.name, content: f.content})),
                metadata: metadata || {}
            });
        } catch (e) {
            console.error('Failed to store documents:', e);
            throw e;
        }
    }

    private async sendMessage(
        event: ServerEvent,
        data?: Record<string, any>
    ): Promise<any> {
        if (!this.client || !this.client.websocket) {
            await this.initClient();
        }

        const message = {event, data: data || ''};
        console.info('Sending message:', message);

        await this.client!.send(JSON.stringify(message));
        const response = await this.client!.receive();
        console.info('Received response:', response);

        return JSON.parse(response);
    }
}