import { WebSocket } from 'ws';
import { Logger } from "../types/Logger.js";


export class WebSocketClient {
    websocket: WebSocket | null;
    private readonly url: string;
    private readonly extraHeaders: Record<string, string>;
    private readonly pingInterval: number;
    private readonly pingTimeout: number;
    private readonly logger: Logger | Console;

    constructor(
        url: string,
        extraHeaders?: Record<string, string>,
        pingInterval: number = 20,
        pingTimeout: number = 20,
        logger?: Logger
    ) {
        this.url = url;
        this.extraHeaders = extraHeaders || {};
        this.websocket = null;
        this.pingInterval = pingInterval;
        this.pingTimeout = pingTimeout;
        this.logger = logger || console;
    }

    async connect(): Promise<WebSocket> {
        try {
            if (typeof this.extraHeaders !== 'object') {
                throw new Error('Headers must be a dictionary');
            }

            this.logger.info(`Connecting to ${this.url}`);

            this.websocket = new WebSocket(this.url, {
                headers: this.extraHeaders,
                handshakeTimeout: this.pingTimeout * 1000,
            });

            return new Promise((resolve, reject) => {
                if (!this.websocket) return reject(new Error('WebSocket not initialized'));

                this.websocket.on('open', () => {
                    this.logger.info('WebSocket connection established');
                    resolve(this.websocket as WebSocket);
                });

                this.websocket.on('error', (error: any) => {
                    this.logger.error(`WebSocket connection error: ${error}`);
                    reject(error);
                });
            });
        } catch (e) {
            this.logger.error(`Unexpected connection error: ${e}`);
            throw e;
        }
    }

    async close(): Promise<void> {
        if (this.websocket) {
            try {
                this.websocket.close();
                this.logger.info('WebSocket connection closed');
            } catch (e) {
                this.logger.error(`Error closing WebSocket: ${e}`);
            } finally {
                this.websocket = null;
            }
        }
    }

    async send(message: any): Promise<void> {
        if (!this.websocket) {
            throw new Error('WebSocket connection closed');
        }

        try {
            this.websocket.send(typeof message === 'string' ? message : JSON.stringify(message));
            this.logger.debug('Message sent: ****');
        } catch (e) {
            this.logger.error('Cannot send message: WebSocket connection closed');
            throw e;
        }
    }

    async receive(): Promise<string> {
        if (!this.websocket) {
            throw new Error('WebSocket connection closed');
        }

        return new Promise((resolve, reject) => {
            this.websocket?.on('message', (data: { toString: () => string | PromiseLike<string>; }) => {
                this.logger.debug('Message received: ****');
                resolve(data.toString());
            });

            this.websocket?.on('error', (error: any) => {
                this.logger.error('Cannot receive message: WebSocket connection closed');
                reject(error);
            });
        });
    }
}
