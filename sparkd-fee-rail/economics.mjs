/** Pure demo calculations for SPARKD fee quotes and sponsor sustainability. */
export function feeQuote({ feeUsd, sparkdPriceUsd, tradeUsd }) {
  const fee = finiteNonnegative(feeUsd, 'feeUsd');
  const price = finitePositive(sparkdPriceUsd, 'sparkdPriceUsd');
  const trade = finiteNonnegative(tradeUsd, 'tradeUsd');
  const feeTokenAmount = Math.ceil(fee / price);
  return {
    feeUsd: fee,
    sparkdPriceUsd: price,
    tradeUsd: trade,
    feeTokenAmount,
    // Explicitly illustrative only; a live quote must come from the routing provider.
    routeCostUsd: Math.round(trade * 0.003 * 100) / 100,
  };
}

export function economics({ feeUsd, sponsorCostUsd, swapsPerDay, monthlyOperatingUsd, daysPerMonth = 30 }) {
  const fee = finiteNonnegative(feeUsd, 'feeUsd');
  const sponsor = finiteNonnegative(sponsorCostUsd, 'sponsorCostUsd');
  const daily = finiteNonnegative(swapsPerDay, 'swapsPerDay');
  const overhead = finiteNonnegative(monthlyOperatingUsd, 'monthlyOperatingUsd');
  const days = finitePositive(daysPerMonth, 'daysPerMonth');
  const contribution = fee - sponsor;
  const monthlySwaps = daily * days;
  const monthlyNet = contribution * monthlySwaps - overhead;
  return {
    contributionPerSwapUsd: round(contribution, 6),
    monthlySwaps,
    monthlyNetUsd: round(monthlyNet, 2),
    breakEvenSwapsPerDay: contribution > 0 ? Math.ceil(overhead / contribution / days) : null,
  };
}

function finiteNonnegative(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new RangeError(`${name} must be a finite non-negative number`);
  return number;
}

function finitePositive(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new RangeError(`${name} must be a finite positive number`);
  return number;
}

function round(value, digits) {
  const scale = 10 ** digits;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}
