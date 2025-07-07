import User from "../models/User.js";
import Player from "../models/Player.js";

export default {
  name: "buy",
  description: "Buy player stocks",
  async execute(message, args) {
    const [mention, amountStr] = args;
    const amount = parseInt(amountStr);
    const targetId = mention.replace(/[<@!>]/g, "");

    const player = await Player.findOne({ discordId: targetId });
    if (!player) return message.reply("Player not found.");

    const user = await User.findOne({ discordId: message.author.id }) || new User({ discordId: message.author.id, balance: 1000, portfolio: [] });
    const totalCost = player.stock.price * amount;

    if (user.balance < totalCost) return message.reply("You don't have enough balance.");

    user.balance -= totalCost;
    const existing = user.portfolio.find(p => p.playerId.equals(player._id));
    if (existing) existing.quantity += amount;
    else user.portfolio.push({ playerId: player._id, quantity: amount });

    await user.save();
    message.reply(`✅ Bought ${amount} shares of <@${targetId}> for ${totalCost} coins.`);
  }
};
