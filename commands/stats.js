import Player from "../models/Player.js";
import { EmbedBuilder } from "discord.js";

export default {
  name: "stats",
  aliases: ["playerstats", "cricketstats", "handcricketstats"],
  usage: "+stats [@user | userID | username]",
  description: "View detailed stats of yourself or another player",
  async execute(message, args) {
    let userId = null;
    let user = null;

    // Mentioned user
    if (message.mentions.users.size > 0) {
      user = message.mentions.users.first();
      userId = user.id;
    }
    // User ID or username/nickname fuzzy search
    else if (args[0]) {
      const query = args.join(" ").toLowerCase();

      // Check if it's a numeric ID
      if (/^\d{17,19}$/.test(query)) {
        try {
          user = await message.client.users.fetch(query);
          userId = user.id;
        } catch {
          console.log(`User ID ${query} not found, trying name match.`);
        }
      }

      // If not a valid ID or not found, try matching username or nickname
      if (!user) {
        const members = await message.guild.members.fetch();
        const match = members.find(
          (m) =>
            m.user.username.toLowerCase().includes(query) ||
            m.displayName.toLowerCase().includes(query)
        );

        if (match) {
          user = match.user;
          userId = user.id;
        } else {
          // Try to find the user by username in the database (last fallback)
          const allPlayers = await Player.find({ guildId: message.guild.id });


          

          // Fetch usernames for all players
          for (const player of allPlayers) {
            if (!player.username && player.discordId) {
              try {
                const fetchedUser = await message.client.users.fetch(player.discordId);
                player.username = fetchedUser.username;
              } catch {
                player.username = `User-${player.discordId}`;
              }
            }
          }

          const playerMatch = allPlayers.find(
            (p) => p.username && p.username.toLowerCase().includes(query)
          );

          if (playerMatch) {
            userId = playerMatch.discordId;
            try {
              user = await message.client.users.fetch(userId);
            } catch {
              return message.reply("❌ Found player in DB but couldn't fetch their Discord profile.");
            }
          } else {
            return message.reply("❌ Couldn't find a user with that username or ID.");
          }
        }
      }
    }
    // No args = self
    else {
      user = message.author;
      userId = user.id;
    }


    const player = await Player.findOne({ discordId: userId, guildId: message.guild.id });
    const s = player?.stats || {
      runs: 0,
      ballsPlayed: 0,
      conceded: 0,
      ballsBowled: 0,
      wickets: 0,
      ducks: 0,
      fifties: 0,
      hundreds: 0,
      highScore: 0,
      highestWickets: 0,
      threeWicketHauls: 0,
      fiveWicketHauls: 0,
      matches: 0,
      batInnings: 0,
      bowlInnings: 0,
      recentMatches: [],
    };

    // Basic Calcs
    const sr =
      s.ballsPlayed > 0 ? ((s.runs / s.ballsPlayed) * 100).toFixed(1) : "0.0";
    const bowlAvg = s.wickets > 0 ? (s.conceded / s.wickets).toFixed(1) : "0.0";
    const batAvg =
      s.batInnings > 0 ? (s.runs / s.batInnings).toFixed(1) : "0.0";
    const eco =
      s.ballsBowled > 0 ? ((s.conceded / s.ballsBowled) * 6).toFixed(1) : "0.0";

    const fifties = s.fifties || 0;
    const hundreds = s.hundreds || 0;

    const threeW = s.threeWicketHauls || 0;
    const fiveW = s.fiveWicketHauls || 0;

    const battingInnings = s.batInnings || 0;
    const bowlingInnings = s.bowlInnings || 0;

    // Rating Calculations
    // BATTING RATING
    const batScore =
      s.runs / 2 + // Runs
      parseFloat(sr) * 0.75 + // Strike Rate
      fifties * 5 + // Bonus for 50s
      hundreds * 10 + // Bonus for 100s
      (parseFloat(batAvg) || 0) * 2 - // Batting avg
      s.ducks * 4; // Duck penalty

    const batRating = Math.min(99, Math.round(60 + batScore / 10)); // Base 60, scaled

    // BOWLING RATING
    const bowlScore =
      s.wickets * 4 +
      (s.ballsBowled > 0 ? (18 - parseFloat(eco)) * 5 : 0) + // Economy reward
      (s.wickets > 0 ? (35 - parseFloat(bowlAvg)) * 3 : 0) + // Bowling avg reward
      threeW * 4 +
      fiveW * 6 -
      s.conceded / 10; // Penalty for conceding runs

    const bowlRating = Math.min(99, Math.round(60 + bowlScore / 10)); // Base 60, scaled

    // ALL-ROUNDER RATING
    const allRounder = Math.min(99, Math.round((batRating + bowlRating) / 2));

    //--------------------------------

    // Final Impact Score
    const impactScoreRaw =
      Math.pow(s.runs, 0.6) +
      Math.pow(s.wickets * 5, 0.8) +
      fifties * 12 +
      hundreds * 25 +
      (batAvg > 2 ? Math.pow(batAvg, 1.2) : -Math.pow(2 - batAvg, 2)) +
      (sr > 80 ? Math.pow(sr / 10, 1.3) : -Math.pow((80 - sr) / 10, 2)) +
      (eco < 7 ? Math.pow(8 - eco, 1.5) : -Math.pow(eco - 7, 1.5)) +
      (bowlAvg < 25
        ? Math.pow(30 - bowlAvg, 1.2)
        : -Math.pow(bowlAvg - 25, 1.2)) -
      Math.pow(s.ducks, 1.3) * 5;

    // Ensure impact score is never negative
    const impactScore = Math.round(Math.max(0, impactScoreRaw));

    //PLAYER ROLE
    let role = "";
    let roleRating = 0;

    const ratingDiff = Math.abs(batRating - bowlRating);

    if (ratingDiff <= 10 && batRating >= 65 && bowlRating >= 65) {
      role = "All-Rounder ⚡";
      roleRating = allRounder;
    } else if (batRating > bowlRating) {
      role = "Batter 🏏";
      roleRating = batRating;
    } else {
      role = "Bowler 🎯";
      roleRating = bowlRating;
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${user.username}'s HandCricket Stats`,
        iconURL: user.displayAvatarURL(),
      })
      .setTitle(`📅 Season 1 | Matches: ${s.matches} | Impact: ${impactScore}`)
      .setDescription(
        `${role} ${roleRating} | Bat: ${batRating} | Bowl: ${bowlRating}`
      )
      .addFields(
        {
          name: "🏏 **Batting**",
          value: [
            `🧢 Innings: **${battingInnings}**`,
            `💥 Runs: **${s.runs}**`,
            `⚾ Balls: **${s.ballsPlayed}**`,
            `📊 Avg: **${batAvg}**`,
            `🚀 SR: **${sr}**`,
            `🌟 50s: **${fifties}**`,
            `💯 100s: **${hundreds}**`,
            `🦆 Ducks: **${s.ducks}**`,
            `🏆 High Score: **${s.highScore}**`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "🎯 **Bowling**",
          value: [
            `🧢 Innings: **${bowlingInnings}**`,
            `🔥 Wickets: **${s.wickets}**`,
            `⚾ Balls: **${s.ballsBowled}**`,
            `📊 Avg: **${bowlAvg}**`,
            `⏳ Eco: **${eco}**`,
            `🎯 3w: **${threeW}**`,
            `🏅 5w: **${fiveW}**`,
            `🏃 Runs Conceded: **${s.conceded}**`,
            `🌟 Best: **${s.highestWickets}**`,
          ].join("\n"),
          inline: true,
        }
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setColor(0x00b0f4)
      .setFooter({ text: "HandCricket Bot • Season 1" })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};