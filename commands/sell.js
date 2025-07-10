import { EmbedBuilder } from "discord.js";
import User from "../models/User.js";
import Player from "../models/Player.js";

export default {
  name: "sell",
  aliases: ["ss", "sellstocks"],
  usage: "+sell [@player | userID | username] [amount]",
  description: "Sell player stocks",
  async execute(message, args) {
    if (!args.length) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Error")
            .setDescription("Please specify a player to sell stocks from."),
        ],
      });
    }

    const amountStr = args.at(-1);
    const maybeUsername = args.slice(0, -1).join(" ");
    const query = args.length > 1 ? maybeUsername : args[0];
    let userId = null;
    let targetUser = null;

    // 1. Mention
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
      userId = targetUser.id;
    }

    // 2. ID or fuzzy username
    else {
      if (/^\d{17,19}$/.test(query)) {
        try {
          targetUser = await message.client.users.fetch(query);
          userId = targetUser.id;
        } catch {
          console.log("ID fetch failed. Trying fuzzy.");
        }
      }

      if (!targetUser) {
        const members = await message.guild.members.fetch({ query, limit: 10 });
        const match = members.find(
          (m) =>
            m.user.username.toLowerCase().includes(query.toLowerCase()) ||
            m.displayName.toLowerCase().includes(query.toLowerCase())
        );
        if (match) {
          targetUser = match.user;
          userId = match.id;
        } else {
          const players = await Player.find({ guildId: message.guild.id });
          for (const player of players) {
            if (!player.username) {
              try {
                const fetched = await message.client.users.fetch(player.discordId);
                player.username = fetched.username;
              } catch {
                player.username = `User-${player.discordId}`;
              }
            }
          }
          const matchPlayer = players.find((p) =>
            p.username?.toLowerCase().includes(query.toLowerCase())
          );
          if (matchPlayer) {
            userId = matchPlayer.discordId;
            try {
              targetUser = await message.client.users.fetch(userId);
            } catch {
              return message.reply("❌ Found user in DB but couldn't fetch Discord profile.");
            }
          } else {
            return message.reply("❌ Player not found.");
          }
        }
      }
    }

    if (!userId) {
      return message.reply("❌ You must specify a valid player to sell shares from.");
    }

    const player = await Player.findOne({ discordId: userId, guildId: message.guild.id });
    if (!player) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("❌ Player Not Found")
            .setDescription("That player does not exist in our stock market."),
        ],
      });
    }

    const user = await User.findOne({ discordId: message.author.id });
    if (!user) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("❌ No Portfolio")
            .setDescription("You don't own any stocks."),
        ],
      });
    }

    const holding = user.portfolio.find((p) => p.playerId.equals(player._id));
    if (!holding) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("❌ No Shares")
            .setDescription("You don't own any shares of this player."),
        ],
      });
    }

    // Determine amount
    let amount = 0;
    if (args.length > 1) {
      amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("❌ Invalid Amount")
              .setDescription("Please provide a valid amount to sell."),
          ],
        });
      }

      if (holding.quantity < amount) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("❌ Not Enough Shares")
              .setDescription(`You only own ${holding.quantity} shares.`),
          ],
        });
      }
    } else {
      amount = holding.quantity;
    }

    const saleValue = amount * player.stock.price;
    holding.quantity -= amount;
    user.balance += saleValue;

    if (holding.quantity === 0) {
      user.portfolio = user.portfolio.filter((p) => !p.playerId.equals(player._id));
    }

    // ✅ Add sold shares back to available supply (up to 20 max)
    const currentAvailable = player.stock.shares ?? 0;
    player.stock.shares = Math.min(currentAvailable + amount, 20);

    await user.save();
    await player.save();

    const successEmbed = new EmbedBuilder()
      .setColor(0x4BB543)
      .setTitle("💰 Stock Sale Successful")
      .setDescription(`You've successfully sold **${amount}** shares of <@${userId}>!`)
      .addFields(
        { name: "📊 Shares Sold", value: `${amount}`, inline: true },
        { name: "💵 Price per Share", value: `${player.stock.price} coins`, inline: true },
        { name: "💸 Total Sale Value", value: `${saleValue} coins`, inline: true },
        { name: "📦 Shares Remaining (You)", value: `${holding.quantity}`, inline: true },
        { name: "📈 Player's Available Shares", value: `${player.stock.shares}`, inline: true },
        { name: "🏦 New Balance", value: `${user.balance} coins`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "💹 StatBot Stock Market | Sell Transaction" });

    message.reply({ embeds: [successEmbed] });
  },
};
