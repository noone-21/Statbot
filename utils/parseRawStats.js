export default function parseRawStats(raw) {
  const lines = raw.trim().split("\n");
  const parsed = [];

  for (const line of lines) {
    const [id, runs, balls, conceded, deliveries, wickets] = line.split(",").map(x => x.trim());
    parsed.push({
      discordId: id,
      runs: Number(runs),
      balls: Number(balls),
      conceded: Number(conceded),
      deliveries: Number(deliveries),
      wickets: Number(wickets),
      ducks: Number(runs) === 0 ? 1 : 0
    });
  }

  return parsed;
}
