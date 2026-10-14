# Dependency Security Report — Phase 5B

Audit date: 2026-10-14  
Branch: `phase-5b-security-hardening`  
Baseline: `64cf52a53dc72520fb69a376e126cce05e6e871f`

## Executive result

| Audit | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `npm audit` | 96 (14 low, 45 moderate, 30 high, 7 critical) | 57 (11 low, 30 moderate, 16 high, 0 critical) | -39 total; all 7 critical removed |
| `npm audit --omit=dev` | 37 (23 moderate, 14 high) | 29 (24 moderate, 5 high) | -8 total; -9 high |

The result is **not zero vulnerabilities**. Production release remains blocked pending a decision on the five production-tree high findings described below. The complete machine-readable before/after evidence is retained in the local ignored `work/` directory.

## Remediation performed

- Replaced `@nomicfoundation/hardhat-toolbox` with the three plugins actually imported by the Hardhat configuration.
- Removed unused Ignition, TypeChain, network-helper, gas-reporter and Solidity-coverage packages. This removed the legacy `request`/`form-data`, old `ethers`, and related critical dependency chains without changing contracts.
- Removed the unused direct React Native AsyncStorage package and its React Native peer tree. MetaMask SDK treats it as optional for native persistence; the web build completes but emits an optional-module warning, so MetaMask real-device verification remains required.
- Updated RainbowKit/Wagmi/Viem only within their existing compatible majors. Resolved versions are RainbowKit 2.2.11, Wagmi 2.19.5 and Viem 2.57.6.
- No `npm audit fix --force`, framework major upgrade, contract deployment, database migration, paid AI call, or chain transaction was performed.

## High and critical advisory disposition

“Installed” reports the relevant audited range where one package name represents several nodes. “Path” is the dependency owner/path class; exact nodes are present in the audit JSON.

| Package | Installed / affected | Advisory | Severity | Dependency path | Runtime exposure | Available fix | Breaking risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `form-data`, `request`, `js-yaml`, `argparse`, `underscore`, `underscore.string`, old `elliptic` | legacy toolbox tree | npm/GitHub advisories reported by baseline audit | Critical | Hardhat Toolbox → gas reporter/coverage/legacy ethers | Dev tooling only | Remove unused tree | Low | **Fixed** by dependency removal |
| `adm-zip` | `<=0.6.0` | GHSA-xcpc-8h2w-3j85, GHSA-7q85-xj36-vmfc, GHSA-rcw4-f5rp-g42v, GHSA-j5f4-cc29-5x44, GHSA-p634-w6r4-rjp2, GHSA-c6fg-446q-cg94, GHSA-8238-w5pm-2374 | High | Hardhat development tree | No production request path; only local artifact tooling | Hardhat 3 migration | High | Remaining; dev-only, risk acceptance required for tooling |
| `undici` | 5.29.0 (`<=6.28.0` advisory range) | GHSA-g9mf-h72j-4rw9 and 12 related HTTP/WebSocket advisories | High | Hardhat / hardhat-verify | Dev/deployment CLI, not Next runtime | Hardhat 3 migration | High | Remaining; never process untrusted responses in deployment tooling |
| `tmp` | `<=0.2.5` | GHSA-52f5-9888-hmc6, GHSA-ph9p-34f9-6g65 | High | Hardhat | Local development/deployment only | Hardhat 3 migration | High | Remaining; dev-only |
| `serialize-javascript` | `<=7.0.4` | GHSA-5c6j-r48x-rmvq, GHSA-qj8w-gfj5-8c6v | High | Mocha / Hardhat test tooling | Test process only | Hardhat/Mocha major migration | High | Remaining; dev-only |
| `lodash` | `<=4.17.23` | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh, GHSA-xxjr-mmjv-4gpg | High | Transitive wallet/tooling dependency | Potential browser bundle exposure; vulnerable APIs are not called by application code | Upstream dependency update; audit currently offers a lockfile fix that did not complete reliably | Medium | **Production blocker / upstream remediation required** |
| `ws` | nested 8.18.0 (`8.0.0–8.20.1`) | GHSA-58qx-3vcg-4xpx, GHSA-96hv-2xvq-fx4p | High | Wagmi → WalletConnect/Reown → nested Viem/ws | WalletConnect WebSocket path | Wagmi 3.7.7 according to npm audit | High | **Production blocker**; do not force Wagmi 3 without migration |
| `@fastify/busboy` | `<=3.2.1` | GHSA-x8mw-p69m-v3mx, GHSA-gxm5-99cw-xjw9 | High | Wallet connector transitive tree | Browser wallet integration; server does not parse uploads with it | Upstream connector update | Medium | **Production blocker / upstream** |
| `postcss` | Next-bundled 8.4.31 | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | High | Next 15 internal build dependency | Build-time CSS processing; CSS input is repository-controlled | Next 16.4 according to npm audit | High | Remaining; not an HTTP runtime parser, formal risk acceptance needed |
| `braces`, `chokidar`, `fast-glob`, `micromatch` | Tailwind 3 / ESLint trees | GHSA-vfj7-8cjw-p6xm and propagated advisories | High | Tailwind and eslint-config-next | Build/lint only with repository-controlled globs | Tailwind 4 / Next tooling major migration | High | Remaining; dev-only |
| `@next/eslint-plugin-next`, `eslint-config-next` | 15.5.27 | Propagated `fast-glob`/`micromatch` advisories | High | Direct lint configuration | Lint only | Next tooling major upgrade | High | Remaining; dev-only |
| `hardhat` | 2.29.1 | Aggregate of the Hardhat dependency findings above | High | Direct dev dependency | Contract compile/test/deploy CLI only | Hardhat 3.19 per npm audit | High | Remaining; migration deferred because it changes plugin/config semantics |
| `tailwindcss` | 3.4.19 | Aggregate of watcher/glob findings | High | Direct dev dependency | Build/watch only | Tailwind 4.3 per npm audit | High | Remaining; migration would alter existing UI pipeline |

No critical findings remain after remediation.

## Moderate and low advisory inventory

The rows below record every remaining npm audit package entry. Entries with no direct advisory are aggregate propagation nodes: their status follows the named child package.

| Packages | Severity | Dependency path / exposure | Fix and breaking risk | Status |
| --- | --- | --- | --- | --- |
| `@rainbow-me/rainbowkit`, `wagmi`, `@wagmi/connectors` | Moderate | Direct wallet UI → connector trees; browser runtime | npm proposes Wagmi 3; high migration risk | Remaining; upstream/migration required |
| `@walletconnect/core`, `ethereum-provider`, `sign-client`, `universal-provider`, `utils` | Moderate | Wagmi → WalletConnect; browser runtime | Upgrade arrives through connector migration; medium/high risk | Remaining; production risk review required |
| `@reown/appkit`, `appkit-controllers`, `appkit-pay`, `appkit-scaffold-ui`, `appkit-ui`, `appkit-utils` | Moderate | WalletConnect/Reown; browser runtime | Upstream connector migration; medium/high risk | Remaining |
| `@gemini-wallet/core`, `@metamask/sdk`, `sdk-communication-layer`, `rpc-errors`, `utils` | Moderate | Optional injected-wallet connectors; browser runtime | Connector-major migration | Remaining; no real-device success claimed |
| nested `viem` 2.23.2 | Moderate | WalletConnect utils; browser runtime | Root Viem is fixed at 2.57.6, but nested copy is upstream-controlled | Remaining |
| `uuid` 8/9 | Moderate | MetaMask/transitive tools; browser/tool runtime | `>=11.1.1` is a major API jump for owners | Remaining |
| `decode-uri-component`, `query-string` | Moderate | Wallet dependency parsing | No compatible fixed release exposed by current owner | Remaining |
| `next` 15.5.27 | Moderate | Direct production framework; propagated internal advisory | npm proposes Next 16.4; high App Router migration risk | **Production risk acceptance or planned migration required** |
| `postcss-nested`, `postcss-selector-parser` | Moderate | Tailwind build pipeline | Tailwind/PostCSS ecosystem migration; high UI regression risk | Remaining; build-time |
| `mocha` | Moderate | Hardhat test runner | Hardhat 3 migration | Remaining; test-only |
| `@nomicfoundation/hardhat-chai-matchers`, `hardhat-ethers`, `hardhat-verify` | Moderate | Contract development/deployment tooling | Hardhat 3/plugin migration | Remaining; dev-only |
| `@ethersproject/abi`, `abstract-provider`, `abstract-signer`, `hash`, `signing-key`, `transactions`, `elliptic` | Low | Transitive legacy wallet/tooling paths | Upstream package replacement | Remaining; application uses ethers 6.17 directly |
| `@sentry/node` | Low | Transitive tooling | Upstream update | Remaining |
| `cookie` | Low | Transitive dependency; application cookie names are constants | Upstream update | Remaining; constrained usage |
| `diff` | Low | Test/development tooling | Upstream update | Remaining; dev-only |
| `solc` | Low | Hardhat compiler tooling | Hardhat/solc migration | Remaining; dev-only |

## Compatibility and operational findings

- The root package tree is internally installable. `npm ls --depth=0` is clean. `npm ls --all` reports the known `valtio → use-sync-external-store@1.2.0` React peer range mismatch; this is an upstream wallet dependency warning and not represented as fixed.
- Wallet code still targets Robinhood Mainnet chain ID 4663. Session state is invalidated on account or network changes and expired sessions are rejected. MetaMask, Rabby, Coinbase Wallet and Robinhood-compatible wallets were **not real-device tested** in this environment.
- Next.js remains on 15.5.27; App Router, route handlers, middleware, cookies, headers, image handling and all eight routes remain in place.
- Hardhat remains on 2.29.1. Contract source and business logic were not changed and no deployment ran.
- AI Worker now has an explicit 120-second default OpenAI timeout and one SDK retry (both configurable). BullMQ workers use `maxRetriesPerRequest: null`, preventing blocking worker commands from failing because a finite ioredis request retry limit is exhausted.

## Release decision

Do not describe this tree as vulnerability-free. Before production release, either migrate the WalletConnect/Wagmi tree to versions that remove the five production high findings, or document a time-bounded, owner-approved risk acceptance with compensating monitoring. The Next 16, Tailwind 4 and Hardhat 3 migrations should be isolated projects with UI/contract regression gates rather than forced audit upgrades.
