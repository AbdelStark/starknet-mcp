import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Config, ServerConfig } from "./types.js";
import express from "express";
import cors from "cors";
import { BaseStarknetServer } from "./base-server.js";
import { Logger } from "pino";
import { Server as HTTPServer } from "http";

/**
 * StarknetSseServer implements a Model Context Protocol server for Starknet
 * It provides tools for interacting with the Starknet network, such as posting notes.
 *
 * This class only implements transport-specific logic for SSE.
 */
export class StarknetSseServer extends BaseStarknetServer {
  private transport?: SSEServerTransport;
  private app: express.Application;
  private httpServer?: HTTPServer;

  constructor(
    config: Config,
    private serverConfig: ServerConfig,
    logger: Logger
  ) {
    super(config, logger);
    this.app = express();
    this.setupExpress();
  }

  private setupExpress(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // SSE endpoint for establishing a connection
    this.app.get("/sse", async (req, res) => {
      this.transport = new SSEServerTransport("/messages", res);
      await this.server.connect(this.transport);
    });

    // Endpoint for posting messages
    this.app.post("/messages", async (req, res) => {
      if (!this.transport) {
        res.status(400).json({ error: "No active SSE connection" });
        return;
      }
      await this.transport.handlePostMessage(req, res);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(this.serverConfig.port, () => {
        this.logger.info(
          { port: this.serverConfig.port },
          "SSE Server started"
        );
        resolve();
      });
    });
  }

  async shutdown(code = 0): Promise<never> {
    this.logger.info("Shutting down SSE server...");
    try {
      if (this.transport) {
        await this.server.close();
      }
      if (this.httpServer) {
        await new Promise((resolve) => this.httpServer!.close(resolve));
      }
      return super.shutdown(code);
    } catch (error) {
      this.logger.error({ error }, "Error during shutdown");
      process.exit(1);
    }
  }
}
