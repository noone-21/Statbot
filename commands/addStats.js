import Player from "../models/Player.js";
import parseRawStats from "../utils/parseRawStats.js";

export default {
  name: "addstats",
  description: "Add raw stats by replying to a message containing them",
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

    const loading = await message.reply(`⏳ Adding ${total} stats...`);

    for (const entry of parsed) {
      const player = await Player.findOne({ discordId: entry.discordId }) || new Player({
        discordId: entry.discordId,
        stats: { runs: 0, balls: 0, conceded: 0, deliveries: 0, wickets: 0, ducks: 0 },
        stock: { price: 50, history: [] }
      });

      for (const key of Object.keys(entry)) {
        if (key !== "discordId") player.stats[key] += entry[key];
      }

      await player.save();
    }

    await loading.edit(`✅ ${total}/${total} stats added successfully.`);
  }
};
