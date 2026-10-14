import hre from "hardhat";
const { ethers } = hre;
async function main(){const [deployer]=await ethers.getSigners();const NFT=await ethers.getContractFactory("EchoAchievementNFT");const nft=await NFT.deploy(deployer.address);await nft.waitForDeployment();const Registry=await ethers.getContractFactory("EchoRecordRegistry");const registry=await Registry.deploy(deployer.address);await registry.waitForDeployment();console.log(JSON.stringify({nft:await nft.getAddress(),registry:await registry.getAddress()}));}
main().catch(e=>{console.error(e);process.exitCode=1});
