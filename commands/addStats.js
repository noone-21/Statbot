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
    const parsed = parseRawStats(raw)
    const total = parsed.length;

    const enriched = parsed.map(entry => ({
      ...entry,
      guildId: message.guild.id,
    }));

    // console.log(enriched)

    const loading = await message.reply(`⏳ Adding ${total}/${total} stats...`);

    for (const entry of enriched) {
      const player = await Player.findOne({ discordId: entry.discordId }) || new Player({
        discordId: entry.discordId,
        guildId: message.guild.id,
        stats: { runs: 0, balls: 0, conceded: 0, deliveries: 0, wickets: 0, ducks: 0, fifties: 0, hundreds: 0, threeWicketHauls: 0, fiveWicketHauls: 0, matches: 0, batInnings: 0, bowlInnings: 0, recentMatches: [] },
        stock: { price: 50000, history: [] }
      });

      // console.log("key", key)
      // console.log("entry", entry)
      // console.log("player", player)
      // for (const key of Object.keys(entry)) {
      //   if (key !== "discordId") player.stats[key] += entry[key];
      // }

      for (const key of Object.keys(entry)) {
        if (["discordId", "recentMatches","highScore"].includes(key)) continue;
        player.stats[key] += entry[key];
      }


      // Update recent matches
      const newMatch = entry.recentMatches[0];

      if (player.stats.recentMatches.length >= 10) {
        player.stats.recentMatches.shift();
      }
      player.stats.recentMatches.push(newMatch)
      
      // Update high score and highest wickets
      if(player.stats.highScore < entry.runs) {
        player.stats.highScore = entry.runs;
      }
      if(player.stats.highestWickets < entry.wickets) {
        player.stats.highestWickets = entry.wickets;
      }

      await player.save();
    }

    await loading.edit(`✅ ${total}/${total} stats added successfully.`);
  }
};
