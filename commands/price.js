import Player from "../models/Player.js";

export default {
  name: "price",
  description: "Check the current stock price of a player",
  async execute(message, args) {
    const mention = args[0];
    if (!mention) return message.reply("Usage: `+price @user`");

    const id = mention.replace(/[<@!>]/g, "");
    const player = await Player.findOne({ discordId: id });

    if (!player) return message.reply("Player not found.");

    message.reply(`💰 <@${id}>'s current stock price is **${player.stock.price} coins**.`);
  }
};
