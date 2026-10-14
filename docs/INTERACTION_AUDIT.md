# ECHO MARKET Interaction Audit

Date: 2026-10-15  
Branch: `audit-full-website-interactions`  
Viewport coverage: Chromium 1440×900 and Chromium mobile emulation 390×844

## Scope and evidence labels

- **Browser**: exercised with Playwright against the running Next.js application.
- **Stubbed API**: browser interaction exercised with request interception only to validate empty/error UI; no stub is present in production code.
- **Static + unit**: implementation and existing security tests verified, but no external service was used.
- **Blocked**: requires a wallet, PostgreSQL, Redis, OpenAI, storage, or deployed contracts.

The scan found 32 JSX source locations containing buttons/links. After mapped desktop/mobile navigation and gallery tabs are expanded, there are at least 48 static interaction paths plus data-driven artwork, vote, generation, NFT, and Echo Chain links.

## Interaction matrix

| Page | Element | Expected action | Actual result / feedback | Backend dependency | Test status | Fix status |
| --- | --- | --- | --- | --- | --- | --- |
| Global | Logo | Navigate home | Correct client navigation | None | Browser desktop/mobile | Pass |
| Global | 8 desktop navigation links | Navigate and identify current route | Routes correctly; current link now has cyan state and `aria-current=page` | None | Browser, 8 routes | **Fixed** |
| Global | Mobile menu toggle | Open/close menu | Visible state, `aria-expanded`, Escape and outside-click close | None | Browser mobile + keyboard | **Fixed** |
| Global | 8 mobile navigation links | Route and close menu | Correct route; menu closes; active state updates | None | Browser, 8 routes | Pass |
| Global | Connect Wallet | Open RainbowKit selector | Real connector entry point; no fake connection | Browser wallet / WalletConnect | Button visible; real wallet blocked | Unverified externally |
| Global | Wallet dropdown | Show wallet operations | Escape/outside-click close; constrained mobile width; ARIA menu state | Connected wallet | Static + component logic | **Fixed** |
| Global | Switch network | Request chain 4663 | Wagmi `switchChain`; error retained in wallet state | Wallet | Static + compatibility test | External verification blocked |
| Global | Sign in/out/disconnect | SIWE or session/wallet teardown | Loading/error state present; real API calls only | Wallet + PostgreSQL + Redis | Security/unit | External verification blocked |
| Home | Enter Challenge | Navigate `/create` | Correct route | None | Browser click | Pass |
| Home | Explore Gallery / View All | Navigate `/gallery` | Correct route | None | Browser click | Pass |
| Home | Challenge CTA | Navigate to create only during submission | Rendered only for real open challenge | PostgreSQL | Static | Blocked by database |
| Home | Empty-state documentation link | Navigate `/docs` | Real link | None | Covered by route suite | Pass |
| Home | Artwork cards | Open gallery query for that artwork | Link exists only when an artwork exists | PostgreSQL/storage | Static | Data unavailable |
| Home | Retry controls | Re-fetch failed query | Visible error and real refetch | API | Stubbed API 500 | Pass |
| Create | Prompt / counters / selectors | Edit validated request | 800-character limit and minimum hint | None | Static | Pass |
| Create | Generate | Submit one real generation request | Disabled without wallet/open challenge; loading prevents duplicate submission | Wallet, DB, Redis, OpenAI, storage | Browser unavailable-state | External flow blocked |
| Create | Retry generation | Re-run failed request | Visible error button calls real generation path | Same as above | Static | Blocked externally |
| Create | Download | Download returned image | Rendered only for actual image URL | Storage | Static | Blocked externally |
| Create | Submit | Persist real challenge submission | Requires image, title, login and open window; submitting disables button | Wallet + DB + storage | Security/unit | End-to-end blocked |
| Create | Generation history buttons | Restore persisted job into preview | Uses `/api/generations` data; no placeholder | DB | Static | Blocked externally |
| Gallery | Current/History/Latest tabs | Change query mode | `aria-selected` changes and each mode issues its own API query | PostgreSQL | Browser + stubbed API | Pass |
| Gallery | Retry | Retry failed gallery request | Error panel and second request confirmed | API | Browser with HTTP 500 | Pass |
| Gallery | Artwork cards | Display real public submissions | Uniform cards; author/votes DTO policy remains phase-gated | DB/storage | Static + privacy unit tests | Detail view not implemented |
| Vote | Wallet gate | Explain inability to vote | Explicit connect/sign-in state, no simulated vote | Wallet | Browser | Pass |
| Vote | Sign & Vote | Nonce, signature, persistence | Pending disables all vote buttons; success only after backend 2xx | Wallet + DB + Redis | Security/unit | Real wallet blocked |
| Reveal | Explorer/NFT links | Open real Blockscout transaction | Link rendered only when transaction hash exists | DB/mainnet RPC | Static + hash unit tests | No deployed data |
| Echo Chain | Node and explorer records | Show real finalized lineage | Empty state without records; no fabricated nodes | DB/mainnet | Browser empty state + static | Node navigation not implemented |
| Profile | Wallet gate | Connect and sign in | Honest unauthenticated state | Wallet | Browser route suite | Pass |
| Profile | NFT explorer links | Open actual transaction | Rendered only for persisted transaction hash | DB/mainnet | Static | No deployed data |
| Docs | Content cards | Display implementation status | No fake controls; Testnet wording corrected to Mainnet | None | Browser route suite | **Fixed** |

## Browser execution

The Playwright suite performs 38 explicit click/keyboard activations across desktop and mobile: home CTAs, logo, all desktop links, all mobile links and menu toggles, three gallery filters in both projects, retry controls, and keyboard activation. It also checks active navigation, wallet-required states, API 500 feedback, retry behavior, and horizontal overflow across all eight mobile routes.

API interception is limited to `tests/e2e/fixtures.ts` and validates empty/error rendering. It is not imported by application code. Real success paths for generation, submission, voting, settlement and NFT minting were not executed because the required services and authorization are absent.

## Remaining gaps

- Gallery has no dedicated artwork detail route/dialog, sorting, pagination, or load-more control; cards are presentation-only on the Gallery page.
- Reveal has no historical challenge selector or previous/next controls.
- Echo Chain renders a timeline but has no explicit previous/next node controls or node detail dialog.
- Docs currently contains informational cards only; it has no TOC, anchors, copy buttons, collapsible regions, or back-to-top control.
- There is no global toast/dialog system. Existing inline `role=status`, `role=alert`, loading, disabled and empty states are consistent and honest.
- Real wallet modal behavior, account switching, signature rejection, session restoration, paid AI, object storage, real database records, Redis workers, settlement, and NFT/explorer success remain externally unverified.
