import Player from "../models/Player.js";

export default {
  name: "resetstats",
  description: "Reset all player stats and stock prices (new season)",
  async execute(message) {
    if (message.author.id !== process.env.OWNER_ID) {
      return message.reply("Only the bot owner can reset stats.");
    }

    // Send initial message while user waits
    const statusMessage = await message.reply("⏳ Resetting all player stats and stock prices. Please wait...");

    const players = await Player.find();

    for (const player of players) {
      player.stats = {
        runs: 0,
        balls: 0,
        conceded: 0,
        deliveries: 0,
        wickets: 0,
        ducks: 0
      };
      player.stock = {
        price: 50,
        history: []
      };
      await player.save();
    }

    // Update the message when complete
    await statusMessage.edit("🧹 All stats and stock prices have been reset.");
  }
};
