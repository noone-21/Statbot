import User from "../models/User.js";
import Player from "../models/Player.js";

export default {
  name: "sell",
  description: "Sell player stocks",
  async execute(message, args) {
    const [mention, amountStr] = args;
    const amount = parseInt(amountStr);
    const targetId = mention.replace(/[<@!>]/g, "");

    const player = await Player.findOne({ discordId: targetId });
    if (!player) return message.reply("Player not found.");

    const user = await User.findOne({ discordId: message.author.id });
    if (!user) return message.reply("You don't own any stocks.");

    const holding = user.portfolio.find(p => p.playerId.equals(player._id));
    if (!holding || holding.quantity < amount) return message.reply("You don't have enough shares.");

    holding.quantity -= amount;
    user.balance += amount * player.stock.price;

    if (holding.quantity === 0) user.portfolio = user.portfolio.filter(p => !p.playerId.equals(player._id));

    await user.save();
    message.reply(`✅ Sold ${amount} shares of <@${targetId}> for ${amount * player.stock.price} coins.`);
  }
};
