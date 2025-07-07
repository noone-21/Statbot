import Player from "../models/Player.js";
import calculatePrice from "../utils/calculatePrice.js";

export default {
  name: "updatemarket",
  description: "Update stock prices based on stats",
  async execute(message) {
    if (message.author.id !== process.env.OWNER_ID) {
      return message.reply("Only the bot owner can update the market.");
    }

    const players = await Player.find();

    for (const player of players) {
      const newPrice = Math.round(calculatePrice(player.stats));
      player.stock.history.push(player.stock.price);
      player.stock.price = newPrice;
      await player.save();
    }

    message.reply("📈 Market updated based on latest stats!");
  }
};
