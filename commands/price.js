import { EmbedBuilder } from "discord.js";
import Player from "../models/Player.js";

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default {
  name: "price",
  aliases: ["stockprice", "currentprice", "marketinfo"],
  description: "Check the current stock price and market information of a player",
  usage: "+price [@user | userID | username]",
  async execute(message, args) {
    try {
      let userId = null;
      let user = null;

      // 1. Mentioned user
      if (message.mentions.users.size > 0) {
        user = message.mentions.users.first();
        userId = user.id;
      }

      // 2. userID or fuzzy name
      else if (args[0]) {
        const query = args.join(" ").toLowerCase();

        // If input is numeric userID
        if (/^\d{17,19}$/.test(query)) {
          try {
            user = await message.client.users.fetch(query);
            userId = user.id;
          } catch {
            console.log(`User ID ${query} not found, trying fuzzy match.`);
          }
        }

        // Fuzzy search by username or nickname
        if (!user) {
          const members = await message.guild.members.fetch({ query, limit: 10 });
          const match = members.find(
            (m) =>
              m.user.username.toLowerCase().includes(query) ||
              m.displayName.toLowerCase().includes(query)
          );

          if (match) {
            user = match.user;
            userId = user.id;
          } else {
            // Last fallback: database scan by username
            const allPlayers = await Player.find({ guildId: message.guild.id });

            for (const player of allPlayers) {
              if (!player.username && player.discordId) {
                try {
                  const fetchedUser = await message.client.users.fetch(player.discordId);
                  player.username = fetchedUser.username;
                } catch {
                  player.username = `User-${player.discordId}`;
                }
              }
            }

            const playerMatch = allPlayers.find((p) =>
              p.username?.toLowerCase().includes(query)
            );

            if (playerMatch) {
              userId = playerMatch.discordId;
              try {
                user = await message.client.users.fetch(userId);
              } catch {
                return console.log("❌ Found player in DB but couldn't fetch their Discord profile.");
              }
            } else {
              return console.log("❌ Couldn't find a user with that username or ID.");
            }
          }
        }
      }

      // 3. No args = self
      else {
        user = message.author;
        userId = user.id;
      }

      const player = await Player.findOne({ discordId: userId, guildId: message.guild.id });
      if (!player) return message.reply("❌ Player not found!");

      const marketCap = player.stock.price * (player.stock.shares || 0);
      const priceChange = player.stock.priceChange || 0;
      const changeSymbol = priceChange >= 0 ? "📈" : "📉";
      const changeColor = priceChange >= 0 ? '#2ecc71' : '#e74c3c';

      const embed = new EmbedBuilder()
        .setColor(changeColor)
        .setTitle(`${user.username}'s Investment Portfolio`)
        .setDescription(`📊 **Market Data for ${user.username}**\n\n`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '💰 Current Stock Price', value: `**${formatNumber(player.stock.price)}** coins`, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: '📈 Available Shares', value: `**${formatNumber(player.stock.shares || 0)}** shares`, inline: true },
          { name: `${changeSymbol} Price Change`, value: `**${priceChange >= 0 ? '+' : ''}${priceChange}%**`, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: '📝 Trading Information', value: 'Use `+buy <amount>` to purchase shares\nUse `+sell <amount>` to sell shares' }
        )
        .setFooter({ text: "✨ Premium Economy System ✨", iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in price command:", error);
      return message.reply("❌ An error occurred while fetching stock information.");
    }
  },
};
