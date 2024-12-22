import { GenericResponseBody, SessionResponse } from "../types/dtos.js";

export abstract class EventAbc {
    abstract authorizeStack(
        clientId?: string,
        clientSecret?: string,
        scope?: string
    ): Promise<SessionResponse>;

    abstract destroyStack(data?: string): Promise<GenericResponseBody>;

    abstract bootstrapStack(data?: string): Promise<GenericResponseBody>;

    abstract generateAnswer(data?: string): Promise<GenericResponseBody>;

    abstract storeData(files: string[], metadata?: Record<string, any>): Promise<GenericResponseBody>;
}
