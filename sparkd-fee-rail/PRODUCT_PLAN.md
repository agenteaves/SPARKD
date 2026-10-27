# SPARKD Swap: MVP and path to a SPARKD-native network

## Product promise

**Swap supported crypto through the SPARKD app. The app service fee is paid in SPARKD; an app sponsor pays the Solana network fee in SOL.** The sponsor is a project operating cost and needs a funded SOL reserve. Buying SPARKD earlier does not prepay later Solana transactions.

The app must label four separate values in every quote:

| Quote line | Meaning |
| --- | --- |
| Swap input | The amount of the selected crypto being traded. If that asset is SOL, it is trade principal. |
| Expected output | Estimated amount after route costs and slippage assumptions. |
| Route / pool cost | DEX liquidity or routing charges included in the actual route and quote. |
| SPARKD app fee | The app's fee, shown in SPARKD and estimated USD value. |
| Network gas | Paid by the SPARKD app sponsor in SOL; user is not asked for SOL as gas in this app. |

The interface should never describe a swap as “free” or imply all trading costs are the SPARKD fee. A live quote must come from the selected router immediately before transaction construction.

## Make the first release useful

1. Start with a small list of liquid pairs requested by the community. Do not list a pair until the router can return a valid route and the project can explain its liquidity and failure risks.
2. Optimize for a short flow: connect wallet, select pair, enter amount, review quote, approve once, receive a confirmation link.
3. Put the user's total before-approval costs in one review card. Keep route cost, SPARKD app fee, and sponsor-paid network fee individually visible.
4. Make fee payment and the swap atomic if the chosen transaction composition allows it. If a swap fails, the app fee should not be collected; verify this behavior on Devnet before launch.
5. Do not make token holding look like an investment promise. State that users need enough SPARKD for the app fee and may need to obtain it separately.

## Rollout

### Stage 0 — prototype

The local page demonstrates the intended flow and lets the team change sample fee economics. Its Devnet tab reads an on-chain quote from a verified Raydium CPMM pool and can connect Phantom for read-only balance checks. It does not request signatures or submit transactions.

### Stage 1 — Devnet proof

- Select a router integration and a Solana fee-sponsorship provider or self-hosted sponsor.
- Verify the sponsor allows the exact swap/router and SPL Token program instructions. In this design, SPARKD is the app's service fee, transferred to the app in the same transaction; the sponsor pays the network fee from its balance and does not need to accept SPARKD as its own payment token.
- Build a transaction with the user's swap and SPARKD fee authorization plus sponsor as fee payer.
- Exercise success, rejected quote, expired quote, insufficient SPARKD, failed swap, duplicate request, sponsor depleted, and wallet rejection.
- Confirm no SPARKD app fee settles when the swap fails. Confirm no user SOL is used as network gas; if SOL is a swap input, display it as the amount traded.
- Use disposable Devnet keys and a test token. Do not load production keys or real funds into this stage.

#### Current implementation state

- Completed: Devnet RPC health check, Raydium Devnet pool metadata validation, and live read-only CPMM quotes.
- Completed: Phantom wallet connection in the local Devnet panel and read-only SOL/test-SPARKD balance display. This does not sign transactions.
- Completed: Read-only Devnet preview that combines a fresh pool quote with the configured test-SPARKD fee and checks the wallet's SOL trade principal and test-token balance.
- Completed: Pimlico Devnet sponsor check, a disposable six-decimal SPARKD test mint, sponsor-funded token accounts, and an atomic Raydium CPMM swap plus 1 test SPARKD app-fee transfer. The confirmed [Devnet transaction](https://explorer.solana.com/tx/5WZgooFYPLiB41oDqUbo7nCCT2mB4Je5LYBLjvSCAJ7PfuykfYmvoyzsNX1bZnfhSjCV9CU5X93z3BxpyHNCm3h4?cluster=devnet) swapped 0.001 SOL as trade input. The user wallet's SOL balance fell by exactly the 1,000,000 lamports traded; the sponsor paid the 10,000-lamport network fee and 1,488,440 lamports of rent. The SPARKD fee and swap succeeded in that one transaction.
- Not completed: transaction construction, user signature, Kora submission from the product flow, failure handling, anti-replay controls, monitoring, and the mainnet pilot.
- Scope: this confirms one Devnet success path using disposable keys and test tokens. The app page remains a quote/prototype interface with read-only wallet connection and preview; the transaction builder is a smoke proof, not a production feature. A swap that uses SOL requires SOL as trade principal; other pairs do not require SOL input.

### Stage 2 — narrow mainnet pilot

- Publish fee amount/formula, receiver, refund behavior, supported pairs, and support contact.
- Fund a dedicated sponsor wallet and set per-transaction, per-wallet, and daily spend caps with alerts and a stop switch.
- Start with a small invited cohort and limited transaction volume. Run a security review of transaction construction, fee transfer, replay protection, signer policy, and browser/server boundaries.
- Reconcile each successful swap, SPARKD service fee, sponsor SOL outflow, provider invoice, and operating cost.

### Stage 3 — evidence-led growth

Add pairs or increase sponsorship limits only after the previous cohort demonstrates reliable completion, returning users, controlled fraud/spam, and positive contribution after sponsor/RPC/hosting costs. Keep a reserve policy that can replenish sponsor SOL without assuming SPARKD price appreciation.

### Stage 4 — evaluate a SPARKD-native network

Treat a separate chain as a new product and security project, not a code toggle. Before committing, require all of the following:

- Several consecutive months of real, organic swap usage and positive service contribution after operating expenses.
- Measured repeat-user and retention data showing users choose the app again.
- Written validator/operator interest and a sustainable reward/fee model.
- Independent chain, bridge, and swap audits; incident response and upgrade governance.
- A credible liquidity, wallet, RPC, explorer, and asset migration plan for the existing Solana SPARKD.
- A documented threat model, chain launch budget, treasury runway, and rollback/continuity plan.

Until those gates are met, the Solana app is the cheaper way to test whether SPARKD-denominated app fees have real use.

## What to measure

Use event instrumentation with privacy-respecting, pseudonymous wallet identifiers. Do not store seed phrases or private keys. Avoid collecting more personal data than needed.

| Metric | Why it matters |
| --- | --- |
| Quote-to-completed-swap conversion | Tests whether the app is understandable and useful. |
| Successful / failed swaps and failure reasons | Shows route quality and reliability. |
| 7-day and 30-day returning wallets | Shows repeat use, beyond one-time incentive activity. |
| Median time from quote to confirmation | Measures user experience. |
| SPARKD app fees collected | Measures actual service usage. |
| Sponsor SOL spent per successful swap | Measures the cost hidden from the user's gas balance. |
| SPARKD fee USD value at execution | Allows fee revenue to be compared with sponsor invoices. |
| Net contribution after sponsor, RPC, hosting, support, and payment costs | Tests whether the service can sustain itself. |
| Sponsor-wallet runway and failed-sponsor events | Protects reliability and prevents surprise service stops. |

Do not use raw swap volume or token price as the only success signal. Wash trading and incentives can inflate activity without showing lasting product demand.

## Pricing and sponsor economics

For each successful swap, estimate:

`net contribution = SPARKD app fee value at execution − sponsor SOL cost − per-swap provider/payment costs`

Then subtract monthly fixed costs such as RPC, hosting, monitoring, support, audits, and security operations. The sustainability tab in the prototype models a simplified version; replace all sample assumptions with measured invoices and realized fee values.

To offer a low price without creating an unfunded subsidy:

1. Measure sponsor cost distribution, including account creation/rent where applicable, priority fees, and provider charges.
2. Pick a plainly disclosed fee that covers the measured cost plus a chosen service reserve, or explicitly budget a capped subsidy for the pilot.
3. Set spend caps so a bot, exploit, or fee spike cannot drain the sponsor wallet.
4. Monitor sponsor balances and pause new quotes before reserves fall below the funded minimum.
5. Revisit the fee only from measured unit economics; do not rely on future SPARKD appreciation to cover current SOL bills.

Undercutting a competing app's service fee is a pricing strategy. It does not make Solana's protocol fee disappear; the sponsor pays it. The routing/pool fee may also remain, and should be disclosed separately.

## Mainnet release blockers

- Confirm SPARKD mint address, token program, decimals, mint extensions, and fee receiver.
- Confirm the selected sponsor actually supports SPARKD as a payment token and supports the chosen transaction form.
- Confirm current router support, quote freshness, supported program IDs, and atomic fee behavior.
- Obtain provider pricing and determine the required SOL float and replenishment process.
- Add wallet signing, server-side quote validation, anti-replay protections, sponsor allowlists/limits, monitoring, privacy notice, and emergency pause.
- Complete Devnet scenario testing and independent review before real funds are used.
