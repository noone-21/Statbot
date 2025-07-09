import Player from "../models/Player.js";
import parseRawStats from "../utils/parseRawStats.js";

export default {
  name: "removestats",
  aliases: ["removerawstats", "removeraw"],
  usage: "+removestats [reply to raw stats message]",
  description: "Remove stats by replying to a message with raw stats",
  async execute(message) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply("Only the admin can run this command.");
    }

    const repliedMsg = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId)
      : null;

    if (!repliedMsg || !repliedMsg.content.includes("Raw statistics of the match:")) {
      return message.reply("Please reply to a message containing raw match stats.");
    }

    const codeBlockMatch = repliedMsg.content.match(/```python([\s\S]+?)```/);
    if (!codeBlockMatch) return message.reply("No code block found in the replied message.");

    const raw = codeBlockMatch[1].trim();
    const parsed = parseRawStats(raw);
    const total = parsed.length;

    const enriched = parsed.map(entry => ({
      ...entry,
      guildId: message.guild.id
    }));

    const loading = await message.reply(`⏳ Removing stats for ${total} players...`);

    for (const entry of enriched) {
      const player = await Player.findOne({ discordId: entry.discordId, guildId: message.guild.id });
      if (!player) continue;

      for (const key of Object.keys(entry)) {
        if (["discordId", "recentMatches", "highScore", "highestWickets"].includes(key)) continue;

        // Subtract safely without going negative
        player.stats[key] = Math.max(0, (player.stats[key] || 0) - entry[key]);
      }

      // Remove matching recent match if present
      const matchToRemove = entry.recentMatches?.[0];

      if (matchToRemove) {
        const index = player.stats.recentMatches.findIndex(m =>
          Number(m.runs) === Number(matchToRemove.runs) &&
          Number(m.balls) === Number(matchToRemove.balls) &&
          Number(m.wickets) === Number(matchToRemove.wickets) &&
          Number(m.deliveries) === Number(matchToRemove.deliveries) &&
          Number(m.conceded) === Number(matchToRemove.conceded)
        );

        if (index !== -1) {
          player.stats.recentMatches.splice(index, 1);
        } else {
          console.log("No match found. Check types or structure.");
        }
      }


      // Recalculate highScore and highestWickets (since one match is being removed)
      player.stats.highScore = Math.max(...player.stats.recentMatches.map(m => m.runs), 0);
      player.stats.highestWickets = Math.max(...player.stats.recentMatches.map(m => m.wickets), 0);

      // console.log(player.stats)

      await player.save();
    }

    await loading.edit(`✅ Removed stats for ${total}/${total} players.`);
  }
};
