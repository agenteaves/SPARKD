# SPARKD Contest Integrity

The contest keeps a server-side record of eligible entries and the random draw that assigns podium placements.

## Eligibility

Entries must have a verified SPARKD burn and must not be rejected. Participant aliases connect known creator IDs and wallet addresses so one participant cannot occupy multiple podium positions through alternate identities.

## Draw record

At the submission deadline, the lifecycle function cryptographically shuffles the eligible entry IDs, selects up to three distinct finalists, and shuffles those finalists into podium order. The database records the eligible count, entrant commitment, random seed, finalist IDs, placement IDs, timestamp, and algorithm.

The draw is idempotent per contest. Existing winner and payout records are retained, and queued prizes are $15, $10, and $5 worth of SOL for first, second, and third place.
