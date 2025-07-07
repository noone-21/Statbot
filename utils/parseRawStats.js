export default function parseRawStats(raw) {
  const lines = raw.trim().split("\n");
  const parsed = [];

  for (const line of lines) {
    const [id, runs, balls, conceded, deliveries, wickets] = line.split(",").map(x => x.trim());

    let fifties = 0;
    let hundreds = 0;
    let threeWicketHauls = 0;
    let fiveWicketHauls = 0;
    let batInnings = 0;
    let bowlInnings = 0;

    if (runs >= 50 && runs < 100) {
      fifties = 1;
    }
    if (runs >= 100) {
      hundreds = 1;
    }
    if (wickets >= 3 && wickets < 5) {
      threeWicketHauls = 1;
    }
    if (wickets >= 5) {
      fiveWicketHauls = 1;
    }
    if (balls > 0) {
      batInnings = 1;
    }
    if (deliveries > 0) {
      bowlInnings = 1;
    }
    parsed.push({
      discordId: id,
      runs: Number(runs),
      ballsPlayed: Number(balls),
      conceded: Number(conceded),
      ballsBowled: Number(deliveries),
      wickets: Number(wickets),
      ducks: Number(runs) === 0 ? 1 : 0,
      fifties: Number(fifties),
      hundreds: Number(hundreds),
      threeWicketHauls: Number(threeWicketHauls),
      fiveWicketHauls: Number(fiveWicketHauls),
      matches: Number(1),
      batInnings: Number(batInnings),
      bowlInnings: Number(bowlInnings),
      recentMatches: [{
        runs: Number(runs),
        balls: Number(balls),
        wickets: Number(wickets),
        deliveries: Number(deliveries),
        conceded: Number(conceded),
      }]
    });
  }

  return parsed;
}
