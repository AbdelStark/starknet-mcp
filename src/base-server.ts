import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
  ErrorCode,
  McpError,
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import { RpcProvider } from "starknet";
import { Logger } from "pino";
import {
  Config,
  ConfigSchema,
  GetBlockSchema,
  StarknetError,
  StarknetServer,
} from "./types.js";

export const SERVER_NAME = "starknet-mcp";
export const SERVER_VERSION = "0.0.1";
export abstract class BaseStarknetServer implements StarknetServer {
  protected readonly server: Server;
  protected readonly provider: RpcProvider;
  protected readonly logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.logger = logger;

    // Validate configuration using Zod schema
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    // Initialize Starknet RPC provider
    this.provider = new RpcProvider({
      nodeUrl: config.starknetRpcUrl,
    });

    // Initialize MCP server
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  protected setupHandlers(): void {
    // Log MCP errors
    this.server.onerror = (error) => {
      this.logger.error({ error }, "MCP Server Error");
    };

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      await this.shutdown();
    });

    process.on("SIGTERM", async () => {
      await this.shutdown();
    });

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      this.logger.error("Uncaught Exception", error);
      this.shutdown(1);
    });

    process.on("unhandledRejection", (reason) => {
      this.logger.error("Unhandled Rejection", reason);
      this.shutdown(1);
    });

    // Register tool handlers
    this.setupToolHandlers();
  }

  protected setupToolHandlers(): void {
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
      this.logger.debug({ name, args }, "Tool called");

      try {
        switch (name) {
          case "get_block":
            return await this.handleGetBlock(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  protected async handleGetBlock(args: unknown) {
    const result = GetBlockSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
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

  protected handleError(error: unknown) {
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

    this.logger.error({ error }, "Unexpected error");
    throw new McpError(ErrorCode.InternalError, "An unexpected error occurred");
  }

  public async shutdown(code = 0): Promise<never> {
    this.logger.info("Shutting down server...");
    try {
      await this.server.close();
      this.logger.info("Server shutdown complete");
      process.exit(code);
    } catch (error) {
      this.logger.error({ error }, "Error during shutdown");
      process.exit(1);
    }
  }

  abstract start(): Promise<void>;
}
