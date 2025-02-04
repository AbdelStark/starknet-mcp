import { Config } from "./types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BaseStarknetServer } from "./base-server.js";
import { Logger } from "pino";

/**
 * StarknetStdioServer implements a Model Context Protocol server for Starknet
 * using STDIO as the transport.
 *
 * This class leverages the shared logic in BaseStarknetServer.
 */
export class StarknetStdioServer extends BaseStarknetServer {
  private readonly transport: StdioServerTransport;

  constructor(config: Config, logger: Logger) {
    // Call base constructor to initialize provider, server, logger, and setup handlers.
    super(config, logger);

    // Setup STDIO-specific transport.
    this.transport = new StdioServerTransport();

    // Ensure stdout is only used for JSON-RPC.
    process.stdout.on("error", (error) => {
      this.logger.error({ error }, "Error writing to stdout");
    });
  }

  async start(): Promise<void> {
    await this.server.connect(this.transport);
    this.logger.info("STDIO Server started");
  }

  // No need to override shutdown() here as BaseStarknetServer.shutdown() works for both servers.
}
