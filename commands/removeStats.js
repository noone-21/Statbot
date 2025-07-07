import Player from "../models/Player.js";
import parseRawStats from "../utils/parseRawStats.js";

export default {
  name: "removestats",
  description: "Remove stats by replying to a message with raw stats",
  async execute(message) {
    if (message.author.id !== process.env.OWNER_ID) {
      return message.reply("Only the bot owner can run this command.");
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

    const loading = await message.reply(`⏳ Removing stats for ${total} players...`);

    for (const entry of parsed) {
      const player = await Player.findOne({ discordId: entry.discordId });
      if (!player) continue;

      for (const key of Object.keys(entry)) {
        if (key !== "discordId") player.stats[key] = Math.max(0, player.stats[key] - entry[key]);
      }

      await player.save();
    }

    await loading.edit(`✅ Removed stats for ${total}/${total} players.`);
  }
};
