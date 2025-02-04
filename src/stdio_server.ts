import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
  ErrorCode,
  McpError,
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import {
  Config,
  ConfigSchema,
  GetBlockSchema,
  StarknetError,
  StarknetServer,
} from "./types.js";
import logger from "./utils/logger.js";
import { RpcProvider } from "starknet";

const SERVER_NAME = "nostr-mcp";
const SERVER_VERSION = "0.0.15";

export class StarknetStdioServer implements StarknetServer {
  private server: Server;
  private provider: RpcProvider;

  constructor(config: Config) {
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
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
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

  async shutdown(code = 0): Promise<never> {
    logger.info("Shutting down server...");
    try {
      await this.server.close();
      logger.info("Server shutdown complete");
      process.exit(code);
    } catch (error) {
      logger.error({ error }, "Error during shutdown");
      process.exit(1);
    }
  }

  private setupToolHandlers(): void {
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
        } as Tool,
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
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`,
            );
        }
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  private async handleGetBlock(args: unknown) {
    const result = GetBlockSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`,
      );
    }

    const block = await this.provider.getBlock("latest");
    return {
      content: [
        {
          type: "text",
          text: `Block fetched successfully!\nNumber: ${block.block_number}\nHash: ${block.block_hash}`,
        },
      ] as TextContent[],
    };
  }

  private handleError(error: unknown) {
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
        ] as TextContent[],
      };
    }

    logger.error({ error }, "Unexpected error");
    throw new McpError(ErrorCode.InternalError, "An unexpected error occurred");
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info({ mode: "stdio" }, "Starknet MCP server running");
  }
}
