import { z } from "zod";
import { GetBlockResponse } from "starknet";

export const ConfigSchema = z.object({
  starknetRpcUrl: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const GetBlockSchema = z.object({
  blockNumber: z.number().optional(),
});

export type GetBlockArgs = z.infer<typeof GetBlockSchema>;

/**
 * Error codes for Starknet operations
 */
export enum StarknetErrorCode {
  RPC_ERROR = "rpc_error",
}

export class StarknetError extends Error {
  constructor(
    message: string,
    public readonly code: StarknetErrorCode | string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "StarknetError";
  }
}

export enum ServerMode {
  STDIO = "stdio",
  SSE = "sse",
}

export interface ServerConfig {
  mode: ServerMode;
  port?: number; // For SSE mode
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
