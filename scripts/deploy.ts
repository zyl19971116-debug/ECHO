import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import hre from "hardhat";
const { ethers } = hre;
const EXPECTED_CHAIN_ID = 46630n;
async function main() {
  const artifactPath = resolve("deployments/robinhood-testnet.json");
  if (existsSync(artifactPath) || process.env.ECHO_NFT_ADDRESS || process.env.ECHO_REGISTRY_ADDRESS) throw new Error("EXISTING_DEPLOYMENT_REQUIRES_REVIEW");
  const network = await ethers.provider.getNetwork(); if (network.chainId !== EXPECTED_CHAIN_ID) throw new Error(`WRONG_CHAIN_ID:${network.chainId}`);
  const [deployer] = await ethers.getSigners(); if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY_REQUIRED");
  if (!process.env.AWARD_MINTER_PRIVATE_KEY || !/^0x[0-9a-fA-F]{64}$/.test(process.env.AWARD_MINTER_PRIVATE_KEY)) throw new Error("AWARD_MINTER_PRIVATE_KEY_REQUIRED");
  const operatorAddress = new ethers.Wallet(process.env.AWARD_MINTER_PRIVATE_KEY).address;
  const balance = await ethers.provider.getBalance(deployer.address); if (balance === 0n) throw new Error("DEPLOYER_HAS_NO_GAS");
  const NFT = await ethers.getContractFactory("EchoAchievementNFT"); const nft = await NFT.deploy(deployer.address); const nftTx = nft.deploymentTransaction(); if (!nftTx) throw new Error("NFT_DEPLOYMENT_TX_MISSING"); const nftReceipt = await nftTx.wait(1); if (!nftReceipt || nftReceipt.status !== 1) throw new Error("NFT_DEPLOYMENT_FAILED");
  const Registry = await ethers.getContractFactory("EchoRecordRegistry"); const registry = await Registry.deploy(deployer.address); const registryTx = registry.deploymentTransaction(); if (!registryTx) throw new Error("REGISTRY_DEPLOYMENT_TX_MISSING"); const registryReceipt = await registryTx.wait(1); if (!registryReceipt || registryReceipt.status !== 1) throw new Error("REGISTRY_DEPLOYMENT_FAILED");
  if (operatorAddress !== deployer.address) { const issuer = await nft.AWARD_ISSUER_ROLE(); const recorder = await registry.RECORDER_ROLE(); await (await nft.grantRole(issuer, operatorAddress)).wait(1); await (await registry.grantRole(recorder, operatorAddress)).wait(1); await (await nft.revokeRole(issuer, deployer.address)).wait(1); await (await registry.revokeRole(recorder, deployer.address)).wait(1); }
  const artifact = { chainId: Number(network.chainId), network: "Robinhood Chain Testnet", deployer: deployer.address, operator: operatorAddress, version: "1.0.0", deployedAt: new Date().toISOString(), contracts: { EchoAchievementNFT: { address: await nft.getAddress(), transactionHash: nftTx.hash, blockNumber: nftReceipt.blockNumber, constructorArgs: [deployer.address], verificationStatus: "UNVERIFIED" }, EchoRecordRegistry: { address: await registry.getAddress(), transactionHash: registryTx.hash, blockNumber: registryReceipt.blockNumber, constructorArgs: [deployer.address], verificationStatus: "UNVERIFIED" } } };
  mkdirSync(resolve("deployments"), { recursive: true }); writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, { flag: "wx" }); console.log(JSON.stringify(artifact, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "DEPLOYMENT_FAILED"); process.exitCode = 1; });
