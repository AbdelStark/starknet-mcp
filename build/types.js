import { z } from "zod";
export const ConfigSchema = z.object({
    starknetRpcUrl: z.string(),
});
export const GetBlockSchema = z.object({
    blockNumber: z.number().optional(),
});
/**
 * Error codes for Starknet operations
 */
export var StarknetErrorCode;
(function (StarknetErrorCode) {
    StarknetErrorCode["RPC_ERROR"] = "rpc_error";
})(StarknetErrorCode || (StarknetErrorCode = {}));
export class StarknetError extends Error {
    constructor(message, code, status) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = "StarknetError";
    }
}
export var ServerMode;
(function (ServerMode) {
    ServerMode["STDIO"] = "stdio";
    ServerMode["SSE"] = "sse";
})(ServerMode || (ServerMode = {}));
//# sourceMappingURL=types.js.map