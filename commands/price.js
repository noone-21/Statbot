import { EmbedBuilder } from "discord.js";
import Player from "../models/Player.js";

// Helper function to format numbers with commas
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default {
  name: "price",
  description: "Check the current stock price and market information of a player",
  usage: "+price @user",
  async execute(message, args) {
    try {
      const mention = args[0];
      if (!mention) {
        return message.reply({
          content: "❌ **Usage:** `+price @user`\nCheck a player's current stock price and market information.",
          ephemeral: true
        });
      }

      const id = mention.replace(/[<@!>]/g, "");
      const player = await Player.findOne({ discordId: id });

      if (!player) return message.reply("❌ Player not found in the database.");
      
      // Get the user to obtain their avatar
      const user = await message.client.users.fetch(id).catch(() => null);
      if (!user) return message.reply("❌ Could not fetch user information.");
      
      // Calculate market cap
      const marketCap = player.stock.price * (player.stock.shares || 0);
      
      // Determine price change status (placeholder - implement actual tracking)
      const priceChange = player.stock.priceChange || 0;
      const changeSymbol = priceChange >= 0 ? "📈" : "📉";
      const changeColor = priceChange >= 0 ? '#2ecc71' : '#e74c3c';
      
      // Create an embed with the stock information
      const embed = new EmbedBuilder()
        .setColor(changeColor)
        .setTitle(`${user.username}'s Investment Portfolio`)
        .setDescription(`📊 **Market Data for ${user.username}**`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '💰 Current Stock Price', value: `**${formatNumber(player.stock.price)}** coins`, inline: true },
          { name: '\u200B', value: '\u200B', inline: true }, // Empty field for better layout
          { name: '📈 Available Shares', value: `**${formatNumber(player.stock.shares || 0)}** shares`, inline: true },
          { name: `${changeSymbol} Price Change`, value: `**${priceChange >= 0 ? '+' : ''}${priceChange}%**`, inline: true },
          { name: '\u200B', value: '\u200B', inline: true }, // Empty field for better layout
        )
        .addFields(
          { name: '📝 Trading Information', value: 'Use `+buy <amount>` to purchase shares\nUse `+sell <amount>` to sell shares' }
        )
        .setFooter({ text: "✨ Premium Economy System ✨" })
        .setTimestamp()
        .setDescription(`📊 **Market Data for ${user.username}**\n\n`)
      
      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in price command:", error);
      message.reply("❌ An error occurred while fetching stock information.");
    }
  }
};
