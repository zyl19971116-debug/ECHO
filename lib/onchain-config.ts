import "server-only";
import { defineChain, getAddress, http, createPublicClient, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { assertRobinhoodChain, ROBINHOOD_EXPLORER, ROBINHOOD_CHAIN_ID } from "@/lib/onchain-policy";

export { ROBINHOOD_CHAIN_ID, ROBINHOOD_EXPLORER };
export const robinhoodMainnet = defineChain({ id: ROBINHOOD_CHAIN_ID, name: "Robinhood Chain", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } }, blockExplorers: { default: { name: "Robinhood Chain Explorer", url: ROBINHOOD_EXPLORER, apiUrl: `${ROBINHOOD_EXPLORER}/api` } }, testnet: false });
export function rpcUrl() { return process.env.ROBINHOOD_SERVER_RPC_URL || process.env.ROBINHOOD_MAINNET_RPC_URL || robinhoodMainnet.rpcUrls.default.http[0]; }
export function publicChainClient() { return createPublicClient({ chain: robinhoodMainnet, transport: http(rpcUrl(), { timeout: 15_000 }) }); }
export async function checkedPublicClient() { const client = publicChainClient(); assertRobinhoodChain(await client.getChainId()); return client; }
export function contractAddresses() { if (!process.env.ECHO_MAINNET_NFT_ADDRESS || !process.env.ECHO_MAINNET_REGISTRY_ADDRESS) throw new Error("CONTRACTS_NOT_DEPLOYED"); return { nft: getAddress(process.env.ECHO_MAINNET_NFT_ADDRESS), registry: getAddress(process.env.ECHO_MAINNET_REGISTRY_ADDRESS) }; }
export async function awardWalletClient() { if (process.env.MAINNET_TRANSACTION_APPROVED !== "true") throw new Error("MAINNET_TRANSACTION_APPROVAL_REQUIRED"); const key = process.env.MAINNET_AWARD_MINTER_PRIVATE_KEY; if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error("AWARD_MINTER_NOT_CONFIGURED"); const client = await checkedPublicClient(); const account = privateKeyToAccount(key as `0x${string}`); return { publicClient: client, walletClient: createWalletClient({ account, chain: robinhoodMainnet, transport: http(rpcUrl(), { timeout: 15_000 }) }), account }; }
export function explorerTx(hash: string) { return `${ROBINHOOD_EXPLORER}/tx/${hash}`; }
export function explorerAddress(address: string) { return `${ROBINHOOD_EXPLORER}/address/${address}`; }
