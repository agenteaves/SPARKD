# SPARKD Fee Rail

An isolated project for testing a SPARKD-denominated fee experience on Solana using Kora fee abstraction.

## Goal

Let participating SPARKD applications charge a disclosed fee in SPARKD while a Kora paymaster covers the underlying Solana transaction fee in SOL. This is an application-level fee system; it does not replace SOL as Solana's protocol fee currency.

## Scope

- Keep development separate from the public SPARKD website until the fee flow is working and reviewed.
- First validate the SPARKD mint and Kora fee-token configuration in a test environment.
- Build and test the paymaster flow, fee policy, sponsor limits, and token accounting.
- Add partner-app support only after the SPARKD app flow is stable.
- Consider a production burn or treasury split only after sponsor costs and operations are modeled.

## Safety

- Never commit private keys, seed phrases, RPC secrets, or production credentials.
- Use test wallets and test tokens during development.
- Do not enable production transactions until the fee payer's allowed programs, token allowlist, spend limits, and failure handling are reviewed.

## Status

Project foundation only. No SPARKD website or production app integration has been added.
