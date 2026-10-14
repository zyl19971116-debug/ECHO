import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from "hardhat/config";
const rpc = process.env.ROBINHOOD_SERVER_RPC_URL || process.env.ROBINHOOD_RPC_URL || "https://rpc.testnet.chain.robinhood.com";
const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];
const config: HardhatUserConfig = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" } },
  networks: { robinhoodTestnet: { url: rpc, chainId: 46630, accounts } },
  etherscan: { apiKey: { robinhoodTestnet: "empty" }, customChains: [{ network: "robinhoodTestnet", chainId: 46630, urls: { apiURL: "https://explorer.testnet.chain.robinhood.com/api", browserURL: "https://explorer.testnet.chain.robinhood.com" } }] },
};
export default config;
