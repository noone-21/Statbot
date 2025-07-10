export default function calculatePrice(stats, price) {
  const { runs, wickets, ducks, balls, conceded } = stats;

  // Batting
  const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;
  const runImpact = Math.pow(runs, 1.25);            // Faster impact growth
  const srImpact = Math.pow(strikeRate, 1.15);       // Higher SR reward

  // Bowling
  const efficiency = conceded > 0 ? wickets / conceded : 0;
  const wicketImpact = Math.pow(wickets * 5, 1.3);    // Bigger boost per wicket
  const efficiencyImpact = Math.pow(efficiency * 100, 1.25); // Economy-wicket blend

  // Penalty
  const duckPenalty = Math.pow(ducks + 1, 1.6) * 150; // Sharper penalty

  const finalPrice =
    price + runImpact + srImpact + wicketImpact + efficiencyImpact - duckPenalty;

  return Math.max(0, Math.round(finalPrice));
}
