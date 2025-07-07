import User from "../models/User.js";
import Player from "../models/Player.js";

export default {
  name: "portfolio",
  description: "View your portfolio",
  async execute(message) {
    const user = await User.findOne({ discordId: message.author.id }).populate("portfolio.playerId");
    if (!user || user.portfolio.length === 0) {
      return message.reply("You don't own any stocks.");
    }

    const fields = user.portfolio.map(p => ({
      name: `<@${p.playerId.discordId}>`,
      value: `📦 Quantity: ${p.quantity}\n💸 Value: ${p.quantity * p.playerId.stock.price}`,
      inline: true,
    }));

    message.channel.send({
      embeds: [{
        title: `${message.author.username}'s Portfolio`,
        color: 0xff9900,
        fields,
        timestamp: new Date(),
      }]
    });
  }
};
