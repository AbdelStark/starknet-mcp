import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
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
  ServerConfig,
  StarknetServer,
} from "./types.js";
import logger from "./utils/logger.js";
import express from "express";
import { RpcProvider } from "starknet";
const SERVER_NAME = "nostr-mcp";
const SERVER_VERSION = "0.0.15";

/**
 * StarknetServer implements a Model Context Protocol server for Starknet
 * It provides tools for interacting with the Starknet network, such as posting notes
 */
export class StarknetSseServer implements StarknetServer {
  private server: Server;
  private provider: RpcProvider;
  private transport?: SSEServerTransport;
  private app: express.Application;

  constructor(config: Config, serverConfig: ServerConfig) {
    // Validate configuration using Zod schema
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    // Initialize Starknet RPC provider
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
    this.app = express();

    // Initialize transport based on mode
    this.app.get("/sse", async (req, res) => {
      this.transport = new SSEServerTransport("/messages", res);
      await this.server.connect(this.transport);
    });

    this.app.post("/messages", async (req, res) => {
      if (!this.transport) {
        res.status(400).json({ error: "No active SSE connection" });
        return;
      }
      await this.transport.handlePostMessage(req, res);
    });

    this.app.listen(serverConfig.port, () => {
      logger.info(`SSE Server listening on port ${serverConfig.port}`);
    });

    this.setupHandlers();
  }

  /**
   * Sets up error and signal handlers for the server
   */
  private setupHandlers(): void {
    // Log MCP errors
    this.server.onerror = (error) => {
      logger.error({ error }, "MCP Server Error");
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
      logger.error("Uncaught Exception", error);
      this.shutdown(1);
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection", reason);
      this.shutdown(1);
    });

    this.setupToolHandlers();
  }

  public async shutdown(code = 0): Promise<never> {
    logger.info("Shutting down server...");
    try {
      if (this.transport) {
        await this.server.close();
      }
      logger.info("Server shutdown complete");
      process.exit(code);
    } catch (error) {
      logger.error({ error }, "Error during shutdown");
      process.exit(1);
    }
  }

  /**
   * Registers available tools with the MCP server
   */
  private setupToolHandlers(): void {
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

  /**
   * Handles the get_block tool execution
   * @param args - Tool arguments containing block number
   */
  private async handleGetBlock(args: unknown) {
    const result = GetBlockSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`,
      );
    }

    // For now, just get the latest block
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

  /**
   * Handles errors during tool execution
   * @param error - The error to handle
   */
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

  /**
   * Starts the MCP server
   */
  async start(): Promise<void> {
    logger.info({ mode: "sse" }, "Starknet MCP server running");
  }
}
