# SPARKD ELITES — secure wallet verification milestone

Status: **Design / pending backend selection**. This document does not enable a paywall or weekly rewards.

## Constants
- Solana mainnet token mint: `BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump`
- Minimum access value: USD 20.00
- Free demo: Level 1 **and** first boss.
- Levels 2–5 require valid server-verified eligibility when gating is enabled.
- Do not edit production sparkdcoin.com without explicit authorization.

## Authentication protocol
1. `POST /api/wallet/challenge` with public wallet address. Validate base58 and Solana public-key length; generate a cryptographically random nonce and a server timestamp. Save hashed nonce with short expiry and single-use state. Return a canonical message including domain, purpose, wallet, nonce, issued-at, expiry, and chain.
2. Wallet signs message via `signMessage`. **Connecting alone is not authentication**.
3. `POST /api/wallet/verify` with address, challenge identifier, and signature. Verify Ed25519 signature against canonical message and public key; consume nonce atomically to prevent replay. Enforce domain binding, expiry, rate limits, and challenge ownership. Issue short-lived secure server session (HttpOnly, Secure, SameSite cookie).
4. `GET /api/wallet/eligibility` authenticates session, queries Solana RPC **server-side** with `getTokenAccountsByOwner` for the exact mint, sums raw integer amounts across all owned token accounts, and converts using mint decimals. Do not use browser-supplied balances.
5. Retrieve an independently validated USD price for the **exact mint** from a trusted pricing provider, with freshness, liquidity, and stale/unavailable handling. Compare precise decimal values: token balance × USD price >= 20.00. Never treat price-feed failure as eligible.
6. Return `{eligible, balanceTokens, usdValue, priceTimestamp, checkedAt, expiresAt}`. Cache for a short period and revalidate at level-unlock checkpoints. Do not expose API keys.
7. Server-side game progression must require a fresh verified entitlement. A client-side `if` statement or localStorage flag is not a security boundary. Server-verified scoring and progression are required before rewards.

## Player experience
- No wallet required for Level 1 and its boss.
- After defeating first boss, display eligibility check and wallet connection.
- If qualified, unlock Levels 2–5.
- If not qualified, explain current balance, USD value, and how to retry; **never** request seed phrases, private keys, transfers, or spending approvals.
- If pricing or RPC is unavailable, explain verification is temporarily unavailable and preserve completed demo progress locally.
- Do not automatically send players to purchase tokens; avoid implying token value appreciation or guaranteed prizes.

## Testing / acceptance criteria
- Valid Phantom and Solflare message signatures pass; mismatched wallet, altered message, expired/replayed nonce fail.
- Multiple token accounts aggregate correctly; zero balance, wrong mint, frozen/invalid token-account responses, RPC timeout, stale/illiquid price fail closed.
- Values immediately below, exactly at, and above USD 20 are handled without floating-point rounding errors.
- Changing browser state or forging API responses does not unlock server-gated content.
- Refresh/reconnect, wallet account switch, mobile wallet deep links, network disconnect, and browser back/forward cache are tested.
- Weekly leaderboard rewards stay disabled until independent anti-cheat and continuous holding-history checks, legal review, and prize rules are implemented.

## Infrastructure decision pending
A Supabase project is visible to the connected account, but it has not been confirmed as belonging to SPARKD ELITES. **Do not create tables, deploy functions, or store secrets there without confirmation.** Once the correct backend is confirmed, implement the challenge, verification, eligibility, sessions, and integration tests there.
