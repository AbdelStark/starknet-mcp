import { Config, StarknetServer } from "./types.js";
export declare class StarknetStdioServer implements StarknetServer {
    private server;
    private provider;
    constructor(config: Config);
    private setupHandlers;
    shutdown(code?: number): Promise<never>;
    private setupToolHandlers;
    private handleGetBlock;
    private handleError;
    start(): Promise<void>;
}
