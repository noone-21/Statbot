export default function calculatePrice(stats) {
  const { runs, wickets, ducks } = stats;

  // Base value: 50 coins
  // Formula:
  // +0.2 coins per run
  // +2.5 coins per wicket
  // -1.5 coins per duck

  let price = 50 + (runs * 0.2) + (wickets * 2.5) - (ducks * 1.5);
  return Math.max(10, Math.round(price)); // Price should not go below 10
}
