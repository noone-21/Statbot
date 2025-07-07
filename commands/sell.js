import { EmbedBuilder } from "discord.js";
import User from "../models/User.js";
import Player from "../models/Player.js";

export default {
  name: "sell",
  description: "Sell player stocks",
  async execute(message, args) {
    if (!args.length) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('Please specify a player to sell stocks from.');
      return message.reply({ embeds: [errorEmbed] });
    }
    
    const mention = args[0];
    const targetId = mention.replace(/[<@!>]/g, "");
    
    // Amount is optional - if not provided, sell all shares
    const amountStr = args[1];
    let amount;
    
    // Find the player
    const player = await Player.findOne({ discordId: targetId });
    if (!player) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('Player not found.');
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Check if user owns stocks
    const user = await User.findOne({ discordId: message.author.id });
    if (!user) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('You don\'t own any stocks.');
      return message.reply({ embeds: [errorEmbed] });
    }
    
    const holding = user.portfolio.find(p => p.playerId.equals(player._id));
    if (!holding) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('You don\'t own any shares of this player.');
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Determine amount to sell
    if (amountStr) {
      amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Error')
          .setDescription('Please provide a valid amount.');
        return message.reply({ embeds: [errorEmbed] });
      }
      if (holding.quantity < amount) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Error')
          .setDescription(`You only have ${holding.quantity} shares available to sell.`);
        return message.reply({ embeds: [errorEmbed] });
      }
    } else {
      amount = holding.quantity; // Sell all shares
    }
    
    // Process the sale
    const saleValue = amount * player.stock.price;
    holding.quantity -= amount;
    user.balance += saleValue;
    
    if (holding.quantity === 0) user.portfolio = user.portfolio.filter(p => !p.playerId.equals(player._id));
    
    await user.save();
    
    // Create success embed
    const successEmbed = new EmbedBuilder()
      .setColor(0x4BB543) // A more pleasant green color
      .setTitle('💰 Stock Sale Successful')
      .setDescription(`You've successfully sold **${amount}** shares of <@${targetId}>!`)
      .addFields(
      { name: '📊 Shares Sold', value: `${amount}`, inline: true },
      { name: '💵 Price per Share', value: `${player.stock.price} coins`, inline: true },
      { name: '💸 Total Sale Value', value: `${saleValue} coins`, inline: true },
      { name: '📈 Remaining Shares', value: `${holding.quantity}`, inline: true },
      { name: '🏦 New Balance', value: `${user.balance} coins`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: '💹 StatBot Stock Market | Sell Transaction' });
    
    message.reply({ embeds: [successEmbed] });
  }
};
