export * from "./types.js";
import { config } from "dotenv";
import { ServerMode } from "./types.js";
import logger from "./utils/logger.js";
import { StarknetSseServer } from "./sse_server.js";
import { StarknetStdioServer } from "./stdio_server.js";
// Load environment variables
config();
/**
 * Validates environment variables and starts the Starknet MCP server
 */
export async function main() {
    // Get configuration from environment
    const starknetRpcUrl = process.env.STARKNET_RPC_URL || "";
    const config = {
        starknetRpcUrl,
    };
    const mode = process.env.SERVER_MODE?.toLowerCase() || ServerMode.STDIO;
    const serverConfig = {
        port: parseInt(process.env.PORT || "3000"),
        mode,
    };
    // Validate required environment variables
    if (!starknetRpcUrl) {
        logger.error("STARKNET_RPC_URL environment variable is required");
        process.exit(1);
    }
    try {
        const server = mode === "sse"
            ? new StarknetSseServer(config, serverConfig)
            : new StarknetStdioServer(config);
        await server.start();
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map