export const ROBINHOOD_TESTNET_CHAIN_ID = 46630;
export const ROBINHOOD_EXPLORER = "https://explorer.testnet.chain.robinhood.com";
export function assertRobinhoodTestnet(chainId: number) { if (chainId !== ROBINHOOD_TESTNET_CHAIN_ID) throw new Error("WRONG_CHAIN_ID"); }
export function explorerTx(hash: string) { if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error("INVALID_TRANSACTION_HASH"); return `${ROBINHOOD_EXPLORER}/tx/${hash}`; }
export function receiptOutcome(status: "success" | "reverted") { if (status !== "success") throw new Error("RECEIPT_FAILED"); return "CONFIRMED" as const; }
