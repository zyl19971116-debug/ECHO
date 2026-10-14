import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
describe("ECHO contracts",()=>{
  it("mints once per challenge and rank and protects issuer role",async()=>{const[a,b]=await ethers.getSigners();const F=await ethers.getContractFactory("EchoAchievementNFT");const n=await F.deploy(a.address);const h=ethers.keccak256(ethers.toUtf8Bytes("work"));await expect(n.mintAward(b.address,1,1,h,"ipfs://award")).to.emit(n,"AwardMinted");expect(await n.ownerOf(1)).to.eq(b.address);await expect(n.mintAward(b.address,1,1,h,"x")).to.be.revertedWith("award claimed");await expect(n.connect(b).mintAward(b.address,2,1,h,"x")).to.be.reverted});
  it("records immutable challenge result",async()=>{const[a,b]=await ethers.getSigners();const F=await ethers.getContractFactory("EchoRecordRegistry");const r=await F.deploy(a.address);const h=ethers.keccak256(ethers.toUtf8Bytes("result"));await expect(r.recordChallengeResult(1,h)).to.emit(r,"ChallengeResultRecorded");await expect(r.recordChallengeResult(1,h)).to.be.revertedWith("already recorded");await expect(r.connect(b).recordChallengeResult(2,h)).to.be.reverted;const[x,at]=await r.getChallengeResult(1);expect(x).to.eq(h);expect(at).to.be.gt(0)})
});
