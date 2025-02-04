import { Config, ServerConfig, StarknetServer } from "./types.js";
/**
 * StarknetServer implements a Model Context Protocol server for Starknet
 * It provides tools for interacting with the Starknet network, such as posting notes
 */
export declare class StarknetSseServer implements StarknetServer {
    private server;
    private provider;
    private transport?;
    private app;
    constructor(config: Config, serverConfig: ServerConfig);
    /**
     * Sets up error and signal handlers for the server
     */
    private setupHandlers;
    shutdown(code?: number): Promise<never>;
    /**
     * Registers available tools with the MCP server
     */
    private setupToolHandlers;
    /**
     * Handles the get_block tool execution
     * @param args - Tool arguments containing block number
     */
    private handleGetBlock;
    /**
     * Handles errors during tool execution
     * @param error - The error to handle
     */
    private handleError;
    /**
     * Starts the MCP server
     */
    start(): Promise<void>;
}
