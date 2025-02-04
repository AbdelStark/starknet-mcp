import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { ConfigSchema, GetBlockSchema, StarknetError, } from "./types.js";
import logger from "./utils/logger.js";
import { RpcProvider } from "starknet";
const SERVER_NAME = "nostr-mcp";
const SERVER_VERSION = "0.0.15";
export class StarknetStdioServer {
    constructor(config) {
        const result = ConfigSchema.safeParse(config);
        if (!result.success) {
            throw new Error(`Invalid configuration: ${result.error.message}`);
        }
        // Ensure stdout is only used for JSON-RPC
        process.stdout.on("error", (error) => {
            logger.error({ error }, "Error writing to stdout");
        });
        this.provider = new RpcProvider({
            nodeUrl: config.starknetRpcUrl,
        });
        this.server = new Server({
            name: SERVER_NAME,
            version: SERVER_VERSION,
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.onerror = (error) => {
            logger.error({ error }, "MCP Server Error");
        };
        process.on("SIGINT", async () => {
            await this.shutdown();
        });
        process.on("SIGTERM", async () => {
            await this.shutdown();
        });
        process.on("uncaughtException", (error) => {
            logger.error("Uncaught Exception", error);
            this.shutdown(1);
        });
        process.on("unhandledRejection", (reason) => {
            logger.error("Unhandled Rejection", reason);
            this.shutdown(1);
        });
        this.setupToolHandlers();
    }
    async shutdown(code = 0) {
        logger.info("Shutting down server...");
        try {
            await this.server.close();
            logger.info("Server shutdown complete");
            process.exit(code);
        }
        catch (error) {
            logger.error({ error }, "Error during shutdown");
            process.exit(1);
        }
    }
    setupToolHandlers() {
        // Same tool handlers as SSE server
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "get_block",
                    description: "Get a block from the Starknet blockchain",
                    inputSchema: {
                        type: "object",
                        properties: {
                            blockNumber: {
                                type: "number",
                                description: "The block number to get",
                            },
                        },
                        required: [],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            logger.debug({ name, args }, "Tool called");
            try {
                switch (name) {
                    case "get_block":
                        return await this.handleGetBlock(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                return this.handleError(error);
            }
        });
    }
    async handleGetBlock(args) {
        const result = GetBlockSchema.safeParse(args);
        if (!result.success) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${result.error.message}`);
        }
        const block = await this.provider.getBlock("latest");
        return {
            content: [
                {
                    type: "text",
                    text: `Block fetched successfully!\nNumber: ${block.block_number}\nHash: ${block.block_hash}`,
                },
            ],
        };
    }
    handleError(error) {
        if (error instanceof McpError) {
            throw error;
        }
        if (error instanceof StarknetError) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Starknet error: ${error.message}`,
                        isError: true,
                    },
                ],
            };
        }
        logger.error({ error }, "Unexpected error");
        throw new McpError(ErrorCode.InternalError, "An unexpected error occurred");
    }
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        logger.info({ mode: "stdio" }, "Starknet MCP server running");
    }
}
//# sourceMappingURL=stdio_server.js.map