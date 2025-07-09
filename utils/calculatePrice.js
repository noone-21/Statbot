export default function calculatePrice(stats) {
  const { runs, wickets, ducks } = stats;

  const basePrice = 50000;

  // Exponential contributions
  const runImpact = Math.pow(runs, 1.15);        // Moderate growth
  const wicketImpact = Math.pow(wickets * 5, 1.2); // Stronger impact per wicket
  const duckPenalty = Math.pow(ducks + 1, 1.4) * 120; // Exponential penalty

  const finalPrice = basePrice + runImpact + wicketImpact - duckPenalty;

  return Math.max(0, Math.round(finalPrice)); // Minimum price: 5,000
}