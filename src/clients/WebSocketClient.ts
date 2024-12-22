import { WebSocket } from 'ws';
import { Logger } from "../types/Logger.js";

export class WebSocketClient {
    private websocket: WebSocket | null;
    private readonly url: string;
    private readonly extraHeaders: Record<string, string>;
    private pingInterval: number;
    private pingTimeout: number;
    private readonly logger: Logger | Console;

    constructor(
        url: string,
        extraHeaders: Record<string, string> = {},
        pingInterval: number = 20,
        pingTimeout: number = 20,
        logger: Logger | Console = console
    ) {
        this.url = url;
        this.extraHeaders = extraHeaders;
        this.websocket = null;
        this.pingInterval = pingInterval;
        this.pingTimeout = pingTimeout;
        this.logger = logger;
    }

    async connect(): Promise<void> {
        this.logger.info(`Connecting to ${this.url}`);

        if (this.websocket) {
            this.logger.info('WebSocket is already connected.');
            return;
        }

        this.websocket = new WebSocket(this.url, {
            headers: this.extraHeaders,
            handshakeTimeout: this.pingTimeout * 1000,
        });

        this.addWebSocketHandlers();

        return new Promise((resolve, reject) => {
            this.websocket?.once('open', () => {
                this.logger.info('WebSocket connection established');
                resolve();
            });

            this.websocket?.once('error', (error: any) => {
                this.logger.error(`WebSocket connection error: ${error}`);
                reject(error);
            });
        });
    }

    private addWebSocketHandlers(): void {
        if (!this.websocket) return;

        this.websocket.on('close', (code, reason) => {
            this.logger.info(`WebSocket closed: Code=${code}, Reason=${reason.toString()}`);
            this.websocket = null;
        });

        this.websocket.on('ping', () => {
            this.logger.debug('Ping received');
            this.websocket?.pong();
        });

        this.websocket.on('pong', () => {
            this.logger.debug('Pong received');
        });

        this.websocket.on('error', (error: any) => {
            this.logger.error(`WebSocket error: ${error}`);
        });
    }

    async close(): Promise<void> {
        if (!this.websocket) {
            this.logger.info('WebSocket is not connected.');
            return;
        }

        return new Promise((resolve) => {
            this.websocket?.once('close', () => {
                this.logger.info('WebSocket connection closed');
                this.websocket = null;
                resolve();
            });

            this.websocket?.close();
        });
    }

    async send(message: any): Promise<void> {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        return new Promise((resolve, reject) => {
            try {
                const data = typeof message === 'string' ? message : JSON.stringify(message);
                this.websocket?.send(data, (error) => {
                    if (error) {
                        this.logger.error(`Failed to send message: ${error}`);
                        return reject(error);
                    }

                    this.logger.debug('Message sent: ****');
                    resolve();
                });
            } catch (e) {
                this.logger.error(`Error sending message: ${e}`);
                reject(e);
            }
        });
    }

    async receive(): Promise<string> {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        return new Promise((resolve, reject) => {
            this.websocket?.once('message', (data) => {
                this.logger.debug('Message received: ****');
                resolve(data.toString());
            });

            this.websocket?.once('error', (error: any) => {
                this.logger.error(`Error receiving message: ${error}`);
                reject(error);
            });
        });
    }

    setHeader(key: string, value: string): void {
        this.extraHeaders[key] = value;
    }

    addEventListener(event: string, listener: (...args: any[]) => void): void {
        if (!this.websocket) {
            throw new Error('WebSocket is not connected');
        }

        this.websocket.on(event, listener);
    }

    setPingInterval(interval: number): void {
        this.pingInterval = interval;
    }

    setPingTimeout(timeout: number): void {
        this.pingTimeout = timeout;
    }
}
