import assert from "node:assert/strict";
import test from "node:test";
import { ROBINHOOD_CHAIN_ID, ROBINHOOD_EXPLORER, assertRobinhoodChain, explorerTx } from "../lib/onchain-policy";
import { ROBINHOOD_CHAIN_ID as walletChainId, robinhoodChain } from "../lib/chain";
test("all browser and server defaults target verified Robinhood mainnet", () => { assert.equal(ROBINHOOD_CHAIN_ID, 4663); assert.equal(walletChainId, 4663); assert.equal(robinhoodChain.id, 4663); assert.equal(robinhoodChain.testnet, false); assert.equal(robinhoodChain.rpcUrls.default.http[0], "https://rpc.mainnet.chain.robinhood.com"); assert.equal(ROBINHOOD_EXPLORER, "https://robinhoodchain.blockscout.com"); });
test("testnet chain and malformed explorer values fail closed", () => { assert.doesNotThrow(() => assertRobinhoodChain(4663)); assert.throws(() => assertRobinhoodChain(46630), /WRONG_CHAIN_ID/); assert.throws(() => explorerTx("not-a-hash"), /INVALID_TRANSACTION_HASH/); });
test("mainnet write approval is disabled unless exact flag is present", () => { const original = process.env.MAINNET_TRANSACTION_APPROVED; delete process.env.MAINNET_TRANSACTION_APPROVED; assert.notEqual(process.env.MAINNET_TRANSACTION_APPROVED, "true"); process.env.MAINNET_TRANSACTION_APPROVED = original; });
