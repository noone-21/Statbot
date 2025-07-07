import Player from "../models/Player.js";
import { EmbedBuilder } from "discord.js";

export default {
  name: "stats",
  description: "View detailed stats of yourself or another player",
  async execute(message, args) {
    let userId = null;
    let user = null;

    // Mentioned user
    if (message.mentions.users.size > 0) {
      user = message.mentions.users.first();
      userId = user.id;
    }
    // Username search
    else if (args[0]) {
      const username = args.join(" ").toLowerCase();
      const guildUsers = await message.guild.members.fetch();
      const match = guildUsers.find(m =>
        m.user.username.toLowerCase() === username ||
        m.displayName.toLowerCase() === username
      );
      if (match) {
        user = match.user;
        userId = user.id;
      } else {
        return message.reply("❌ User not found by that username.");
      }
    }
    // No args = self
    else {
      user = message.author;
      userId = user.id;
    }

    const player = await Player.findOne({ discordId: userId });
    const s = player?.stats || {
      runs: 0,
      balls: 0,
      conceded: 0,
      deliveries: 0,
      wickets: 0,
      ducks: 0
    };

    // Basic Calcs
    const avg = s.balls > 0 ? (s.runs / s.balls).toFixed(1) : "0.0";
    const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : "0.0";
    const bowlAvg = s.wickets > 0 ? (s.conceded / s.wickets).toFixed(1) : "0.0";
    const eco = s.deliveries > 0 ? ((s.conceded / s.deliveries) * 6).toFixed(1) : "0.0";

    const fifties = s.runs >= 50 ? Math.floor(s.runs / 50) : 0;
    const hundreds = s.runs >= 100 ? Math.floor(s.runs / 100) : 0;
    const highScore = s.runs; // Optional: store max score later

    const threeW = s.wickets >= 3 ? Math.floor(s.wickets / 3) : 0;
    const fiveW = s.wickets >= 5 ? Math.floor(s.wickets / 5) : 0;
    const best = s.wickets > 0 ? `${Math.min(6, s.wickets)}` : "0";

    const battingInnings = s.balls > 0 ? 1 : 0;
    const bowlingInnings = s.deliveries > 0 ? 1 : 0;

    // Rating Calculations
    // BATTING RATING
    const batScore = (
      (s.runs / 2) +                       // Runs
      (parseFloat(sr) * 0.75) +           // Strike Rate
      (fifties * 5) +                     // Bonus for 50s
      (hundreds * 10) +                   // Bonus for 100s
      ((parseFloat(avg) || 0) * 2)        // Batting avg
    ) - (s.ducks * 4);                    // Duck penalty

    const batRating = Math.min(99, Math.round(60 + (batScore / 10))); // Base 60, scaled

    // BOWLING RATING
    const bowlScore = (
      (s.wickets * 4) +
      ((s.deliveries > 0 ? (18 - parseFloat(eco)) * 5 : 0)) +  // Economy reward
      ((s.wickets > 0 ? (35 - parseFloat(bowlAvg)) * 3 : 0)) + // Bowling avg reward
      (threeW * 4) + (fiveW * 6)
    ) - (s.conceded / 10); // Penalty for conceding runs

    const bowlRating = Math.min(99, Math.round(60 + (bowlScore / 10))); // Base 60, scaled

    // ALL-ROUNDER RATING
    const allRounder = Math.min(99, Math.round((batRating + bowlRating) / 2));
    const impactScore = Math.round(batScore + bowlScore);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${user.username}'s HandCricket Stats`,
        iconURL: user.displayAvatarURL()
      })
      .setTitle(`📅 Season 1 | Matches: ${battingInnings + bowlingInnings} | Impact: ${impactScore}`)
      .setDescription(`All-Rounder ⚡ ${allRounder} | Bat: ${batRating} | Bowl: ${bowlRating}`)
      .addFields(
        {
          name: "🏏 **Batting**",
          value: [
            `🧢 Innings: **${battingInnings}**`,
            `💥 Runs: **${s.runs}**`,
            `⚾ Balls: **${s.balls}**`,
            `📊 Avg: **${avg}**`,
            `🚀 SR: **${sr}**`,
            `🌟 50s: **${fifties}**`,
            `💯 100s: **${hundreds}**`,
            `🦆 Ducks: **${s.ducks}**`,
            `🏆 High Score: **${highScore}**`
          ].join("\n"),
          inline: true
        },
        {
          name: "🎯 **Bowling**",
          value: [
            `🧢 Innings: **${bowlingInnings}**`,
            `🔥 Wickets: **${s.wickets}**`,
            `⚾ Balls: **${s.deliveries}**`,
            `📊 Avg: **${bowlAvg}**`,
            `⏳ Eco: **${eco}**`,
            `🎯 3w: **${threeW}**`,
            `🏅 5w: **${fiveW}**`,
            `🏃 Runs Conceded: **${s.conceded}**`,
            `🌟 Best: **${best}**`
          ].join("\n"),
          inline: true
        }
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setColor(0x00b0f4)
      .setFooter({ text: "HandCricket Bot • Season 1" })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
