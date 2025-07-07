import User from "../models/User.js";
import Player from "../models/Player.js";
import { EmbedBuilder } from "discord.js";

export default {
  name: "buy",
  description: "Buy player stocks",
  async execute(message, args) {
    // Check if arguments are provided
    if (!args.length || args.length < 2) {
      const helpEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Missing Arguments")
        .setDescription("You need to specify who and how many shares to buy.")
        .addFields(
          { name: "Usage", value: "`buy @player amount`" },
          { name: "Example", value: "`buy @username 10`" }
        )
        .setFooter({ text: "Player Stock Market" });
      return message.reply({ embeds: [helpEmbed] });
    }

    const [mention, amountStr] = args;
    const amount = parseInt(amountStr);
    
    // Validate amount is a number
    if (isNaN(amount) || amount <= 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Invalid Amount")
        .setDescription("Please provide a valid positive number for the amount.");
      return message.reply({ embeds: [errorEmbed] });
    }

    const targetId = mention.replace(/[<@!>]/g, "");

    const player = await Player.findOne({ discordId: targetId });
    if (!player) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Player Not Found")
        .setDescription("The specified player was not found in our database.");
      return message.reply({ embeds: [errorEmbed] });
    }

    const user = await User.findOne({ discordId: message.author.id }) || 
                new User({ discordId: message.author.id, balance: 1000, portfolio: [] });
    
    const totalCost = player.stock.price * amount;

    if (user.balance < totalCost) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Insufficient Balance")
        .setDescription(`You need ${totalCost} coins but only have ${user.balance}.`);
      return message.reply({ embeds: [errorEmbed] });
    }

    user.balance -= totalCost;
    const existing = user.portfolio.find(p => p.playerId.equals(player._id));
    if (existing) existing.quantity += amount;
    else user.portfolio.push({ playerId: player._id, quantity: amount });

    await user.save();
    
    // Fetch the target user to get their avatar
    const targetUser = await message.client.users.fetch(targetId).catch(() => null);
    
    // Calculate portfolio stats
    const totalShares = existing ? existing.quantity : amount;
    const portfolioValue = user.portfolio.reduce((total, item) => {
      return total + (item.playerId.equals(player._id) ? 
      player.stock.price * item.quantity : 0);
    }, 0);
    
    const successEmbed = new EmbedBuilder()
      .setColor("#32CD32") // Lime green - more appealing than bright green
      .setTitle("🚀 Purchase Successful")
      .setDescription(`You've successfully acquired ${amount} shares of <@${targetId}>!`)
      .setThumbnail(targetUser?.displayAvatarURL({ dynamic: true }) || 'https://cdn.discordapp.com/embed/avatars/0.png')
      .addFields(
      { name: "💰 Transaction Details", value: `${amount} shares × ${player.stock.price} coins = **${totalCost} coins**`, inline: false },
      { name: "📊 Share Price", value: `${player.stock.price} coins`, inline: true },
      { name: "📈 Shares Owned", value: `${totalShares} shares`, inline: true },
      { name: "💵 Your Balance", value: `${user.balance} coins`, inline: true },
      { name: "📊 Player Stats", value: `Market Value: ${player.stock.price * player.stock.outstanding} coins\nStock Trend: ${player.stock.trend > 0 ? '📈 Rising' : player.stock.trend < 0 ? '📉 Falling' : '➡️ Stable'}` }
      )
      .setTimestamp()
      .setFooter({ text: "🏦 Player Stock Market | Happy investing!" });
    
    message.reply({ embeds: [successEmbed] });
  }
};
