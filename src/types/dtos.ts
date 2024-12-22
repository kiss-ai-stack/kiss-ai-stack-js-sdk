export interface SessionResponse {
    access_token: string;
    client_id?: string;
    client_secret?: string;
    scope?: string;
}

export interface GenericResponseBody {
    result: string;
}

export interface FileObject {
    name: string;
    content: string;
}

export interface DocumentsRequestBody {
    files: FileObject[];
    metadata: Record<string, any>;
}

export interface QueryRequestBody {
    query: string;
}

export interface SessionRequest {
    client_id?: string;
    client_secret?: string;
    scope?: string;
}
