export * from "./types.js";
export * from "./base-server.js";
export * from "./sse_server.js";
export * from "./stdio_server.js";

import { config } from "dotenv";
import { Config, ServerConfig, ServerMode } from "./types.js";
import { StarknetSseServer } from "./sse_server.js";
import { StarknetStdioServer } from "./stdio_server.js";
import pino from "pino";

// Load environment variables
config();

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
  },
});

/**
 * Validates environment variables and starts the Starknet MCP server
 */
export async function main() {
  // Get configuration from environment
  const starknetRpcUrl = process.env.STARKNET_RPC_URL || "";
  const starknetAccountAddress = process.env.STARKNET_ACCOUNT_ADDRESS || "";
  const starknetAccountPrivateKey =
    process.env.STARKNET_ACCOUNT_PRIVATE_KEY || "";
  const config: Config = {
    starknetRpcUrl,
    starknetAccountAddress,
    starknetAccountPrivateKey,
  };
  const mode =
    (process.env.SERVER_MODE?.toLowerCase() as ServerMode) || ServerMode.STDIO;

  const serverConfig: ServerConfig = {
    port: parseInt(process.env.PORT || "3000"),
    mode,
  };

  // Validate required environment variables
  if (!starknetRpcUrl) {
    logger.error("STARKNET_RPC_URL environment variable is required");
    process.exit(1);
  }
  if (!starknetAccountAddress) {
    logger.error("STARKNET_ACCOUNT_ADDRESS environment variable is required");
    process.exit(1);
  }
  if (!starknetAccountPrivateKey) {
    logger.error(
      "STARKNET_ACCOUNT_PRIVATE_KEY environment variable is required"
    );
    process.exit(1);
  }

  try {
    const server =
      mode === ServerMode.SSE
        ? new StarknetSseServer(config, serverConfig, logger)
        : new StarknetStdioServer(config, logger);

    await server.start();
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

// Only run if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error({ error }, "Unhandled error");
    process.exit(1);
  });
}
