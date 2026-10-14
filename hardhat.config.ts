import "@nomicfoundation/hardhat-toolbox";import type{HardhatUserConfig}from"hardhat/config";
const remote=process.env.ROBINHOOD_RPC_URL&&process.env.DEPLOYER_PRIVATE_KEY?{robinhoodTestnet:{url:process.env.ROBINHOOD_RPC_URL,accounts:[process.env.DEPLOYER_PRIVATE_KEY]}}:{};
const config:HardhatUserConfig={solidity:{version:"0.8.24",settings:{optimizer:{enabled:true,runs:200},evmVersion:"cancun"}},networks:{...remote}};export default config;
