import { z } from "zod";
import { GetBlockResponse } from "starknet";
export declare const ConfigSchema: z.ZodObject<{
    starknetRpcUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    starknetRpcUrl: string;
}, {
    starknetRpcUrl: string;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare const GetBlockSchema: z.ZodObject<{
    blockNumber: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    blockNumber?: number | undefined;
}, {
    blockNumber?: number | undefined;
}>;
export type GetBlockArgs = z.infer<typeof GetBlockSchema>;
/**
 * Error codes for Starknet operations
 */
export declare enum StarknetErrorCode {
    RPC_ERROR = "rpc_error"
}
export declare class StarknetError extends Error {
    readonly code: StarknetErrorCode | string;
    readonly status?: number | undefined;
    constructor(message: string, code: StarknetErrorCode | string, status?: number | undefined);
}
export declare enum ServerMode {
    STDIO = "stdio",
    SSE = "sse"
}
export interface ServerConfig {
    mode: ServerMode;
    port?: number;
}
export interface StarknetServer {
    start(): Promise<void>;
    shutdown(code?: number): Promise<never>;
}
export interface GetBlockResult {
    success: boolean;
    error?: string;
    block?: GetBlockResponse;
}
