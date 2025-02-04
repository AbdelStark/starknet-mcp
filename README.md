# 🌐 Starknet MCP Server

A Model Context Protocol (MCP) server that enables AI models to interact with Starknet.

[![smithery badge](https://smithery.ai/badge/@AbdelStark/starknet-mcp)](https://smithery.ai/server/@AbdelStark/starknet-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue?style=flat-square)](https://github.com/modelcontextprotocol/typescript-sdk)
[![Starknet](https://img.shields.io/badge/Starknet-Protocol-purple?style=flat-square)](https://starknet.io/)


## 🚀 Features

- 📝 Get the latest block from Starknet

## 👷‍♂️ TODOs

- [ ] Add tools to be able to interact with smart contracts on Starknet

## 📋 Prerequisites

- Node.js 18+

## 🛠️ Installation

### Installing via Smithery

To install Starknet MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@AbdelStark/nostr-mcp):

```bash
npx -y @smithery/cli install @AbdelStark/starknet-mcp --client claude
```

### Manual Installation
1. Clone the repository:

```bash
git clone https://github.com/AbdelStark/starknet-mcp
cd starknet-mcp
```

1. Install dependencies:

```bash
npm install
```

1. Create a `.env` file:

> 💡 You can copy the `.env.example` file and modify it as needed.

```env
# Log level (debug, info, warn, error)
LOG_LEVEL=debug
# Node environment (development, production)
NODE_ENV=development
# Server mode (stdio or sse)
SERVER_MODE=sse
# Port for SSE mode
PORT=9000
# Starknet RPC URL
STAKNET_RPC_URL=https://...
```

## 🚦 Usage

### Starting the Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

### Available Tools

#### `get_block`

Gets the latest block from the Starknet blockchain.

Example input:

```json
{
  "blockNumber": 1234567890
}
```

## 🔧 Development

### Project Structure

```text
starknet-mcp/
├── src/
│   ├── index.ts        # Main server entry point
│   ├── types.ts        # TypeScript type definitions
├── .env               # Environment configuration
└── tsconfig.json     # TypeScript configuration
```

### Running Tests

```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Starknet Docs](http://docs.starknet.io/)
- [Starknetjs Docs](https://starknetjs.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- [Visual testing tool for MCP servers](https://github.com/modelcontextprotocol/inspector)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [Awesome MCP Clients](https://github.com/punkpeye/awesome-mcp-clients)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## 📬 Contact

Feel free to follow me if you'd like, using my public key:

```text
npub1hr6v96g0phtxwys4x0tm3khawuuykz6s28uzwtj5j0zc7lunu99snw2e29
```

Or just **scan this QR code** to find me:

![Starknet Public Key QR Code](https://hackmd.io/_uploads/SkAvwlYYC.png)
