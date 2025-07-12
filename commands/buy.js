import User from "../models/User.js";
import Player from "../models/Player.js";
import { EmbedBuilder } from "discord.js";

export default {
  name: "buy",
  aliases: ["purchase", "bs","buystocks"],
  usage: "buy [@player | userID | username] <amount>",
  description: "Buy player stocks",
  async execute(message, args) {
    if (!args.length || args.length < 2) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("❌ Missing Arguments")
            .setDescription("You need to specify who and how many shares to buy.")
            .addFields(
              { name: "Usage", value: "`buy @player amount`" },
              { name: "Example", value: "`buy ajit007 2`" }
            )
            .setFooter({ text: "Player Stock Market" }),
        ],
      });
    }

    const amountStr = args.at(-1);
    const amount = parseInt(amountStr);
    const query = args.slice(0, -1).join(" ").toLowerCase();

    if (isNaN(amount) || amount <= 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("❌ Invalid Amount")
            .setDescription("Please provide a valid positive number for the amount."),
        ],
      });
    }

    let userId = null;
    let targetUser = null;

    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
      userId = targetUser.id;
    } else {
      if (/^\d{17,19}$/.test(query)) {
        try {
          targetUser = await message.client.users.fetch(query);
          userId = targetUser.id;
        } catch {
          console.log(`User ID ${query} not found. Trying fuzzy match.`);
        }
      }

      if (!targetUser) {
        const members = await message.guild.members.fetch({ query, limit: 10 });
        const match = members.find(
          (m) =>
            m.user.username.toLowerCase().includes(query) ||
            m.displayName.toLowerCase().includes(query)
        );
        if (match) {
          targetUser = match.user;
          userId = targetUser.id;
        } else {
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
              targetUser = await message.client.users.fetch(userId);
            } catch {
              const embed = new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("❌ Found player but couldn't fetch their Discord profile.");

            }
          } else {
            const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription("❌ Couldn't find a player with that username or ID.");
          }
        }
      }
    }

    if (!userId) {
      const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription("❌ You must specify a valid user to buy shares for.");
    }

    const player = await Player.findOne({ discordId: userId, guildId: message.guild.id });
    if (!player) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("❌ Player Not Found")
            .setDescription("Couldn't find the specified player.")
            .setFooter({
          text: `✨ Requested by ${message.author.username} `,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp(),
        ],
      });
    }

    const availableShares = player.stock.shares ?? 20;
    if (availableShares < amount) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FFA500")
            .setTitle("❌ Not Enough Shares")
            .setDescription(
              `<@${userId}> only has **${availableShares}** shares available. Please reduce your purchase amount.`
            )
            .setFooter({
          text: `✨ Requested by ${message.author.username} `,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp(),
        ],
      });
    }

    const user =
      (await User.findOne({ discordId: message.author.id })) ||
      new User({ discordId: message.author.id, balance: 100000, portfolio: [] });

    const totalCost = player.stock.price * amount;

    // ✅ NEW: Ownership limit enforcement
    const existing = user.portfolio.find((p) => p.playerId.equals(player._id));
    const alreadyOwned = existing?.quantity || 0;

if (alreadyOwned + amount > 4) {
  const remaining = 4 - alreadyOwned;
  const msgLines = [];

  if (alreadyOwned > 0) {
    msgLines.push(`You already own **${alreadyOwned}** shares of <@${userId}>.`);
  }

  msgLines.push(
    `You can only own **4 shares per player**, so you can only buy **${remaining}** more.`
  );

  const member = message.mentions.members.first() || message.member;
  const user = member.user;

const embed = new EmbedBuilder()
  .setColor(0xFF0000)
  .setTitle("❌ Max Ownership Limit")
  .setDescription(msgLines.join("\n"))
  .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
  .setFooter({
          text: `✨ Requested by ${message.author.username} `,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

return message.reply({ embeds: [embed] });
}


     if (user.balance < totalCost) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("❌ Insufficient Balance")
            .setDescription(`You need ${totalCost} coins but only have ${user.balance}.`)
            .setFooter({
          text: `✨ Requested by ${message.author.username} `,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp(),
        ],
      });
    }

    user.balance -= totalCost;

    if (existing) {
      existing.buyPrice += amount * player.stock.price;
      existing.quantity += amount;
    } else {
      user.portfolio.push({
        playerId: player._id,
        quantity: amount,
        buyPrice: player.stock.price * amount,
      });
    }

    player.stock.shares = availableShares - amount;

    await user.save();
    await player.save();

    const totalShares = existing ? existing.quantity : amount;

    const successEmbed = new EmbedBuilder()
      .setColor("#32CD32")
      .setTitle("🚀 Purchase Successful")
      .setDescription(`You've successfully acquired ${amount} shares of <@${userId}>!`)
      .setThumbnail(
        targetUser?.displayAvatarURL({ dynamic: true }) ??
          "https://cdn.discordapp.com/embed/avatars/0.png"
      )
      .addFields(
        {
          name: "💰 Transaction Details",
          value: `${amount} shares × ${player.stock.price} = **${totalCost} coins**`,
        },
        {
          name: "📈 Share Price",
          value: `${player.stock.price} coins`,
          inline: true,
        },
        {
          name: "📊 Shares Owned",
          value: `${totalShares} shares`,
          inline: true,
        },
        {
          name: "📦 Shares Remaining",
          value: `${player.stock.shares} left`,
          inline: true,
        },
        {
          name: "💵 Your Balance",
          value: `${user.balance} coins`,
          inline: true,
        },
        {
          name: "📊 Player Stats",
          value: `Market Value: ${player.stock.price * player.stock.outstanding} coins\nStock Trend: ${
            player.stock.trend > 0 ? "📈 Rising" : player.stock.trend < 0 ? "📉 Falling" : "➡️ Stable"
          }`,
        }
      )
      .setTimestamp()
      .setFooter({ text: "🏦 Player Stock Market | Happy investing!" });

    message.reply({ embeds: [successEmbed] });
  },
};