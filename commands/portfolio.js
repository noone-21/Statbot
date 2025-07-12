import User from "../models/User.js";
import Player from "../models/Player.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

export default {
  name: "portfolio",
  aliases: ["investments", "stocks", "holdings", "port"],
  usage: "+portfolio [@user | userID | username]",
  description: "View your or another user's portfolio",
  async execute(message, args) {
    let userId = null;
    let user = null;

    // 1. Mentioned user
    if (message.mentions.users.size > 0) {
      user = message.mentions.users.first();
      userId = user.id;
    }
    // 2. ID or fuzzy match
    else if (args[0]) {
      const query = args.join(" ").toLowerCase();

      if (/^\d{17,19}$/.test(query)) {
        try {
          user = await message.client.users.fetch(query);
          userId = user.id;
        } catch {
          console.log(`User ID ${query} not found, trying name match.`);
        }
      }

      if (!user) {
        const members = await message.guild.members.fetch();
        const match = members.find(
          (m) =>
            m.user.username.toLowerCase().includes(query) ||
            m.displayName.toLowerCase().includes(query)
        );

        if (match) {
  user = match.user;
  userId = user.id;
} else {
  const embed = new EmbedBuilder()
  .setColor(0xFF0000)
  .setTitle("User not found")
  .setDescription("❌ Couldn't find a user with that name or ID.");

return message.reply({ embeds: [embed] });
}
      }
    }
    // 3. Default to self
    else {
      user = message.author;
      userId = user.id;
    }

    const userDoc = await User.findOne({ discordId: userId }).populate(
      "portfolio.playerId"
    );

  if (!userDoc || userDoc.portfolio.length === 0) {
  const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
  .setColor(0xFF0000)
  .setTitle(`🗂️ ${user.username}'s Portfolio`)
  .setDescription("❌Doesn't own any stocks.")
  .setThumbnail(user.displayAvatarURL({ dynamic: true }));

return message.reply({ embeds: [embed] });
  }

    for (const item of userDoc.portfolio) {
      if (!item.playerId.username && item.playerId.discordId) {
        try {
          const discordUser = await message.client.users.fetch(
            item.playerId.discordId
          );
          item.playerId.username = discordUser.username;
        } catch {
          item.playerId.username = `User-${item.playerId.discordId}`;
        }
      }
    }

    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(userDoc.portfolio.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    function generateEmbed(page) {
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = Math.min(
        startIndex + ITEMS_PER_PAGE,
        userDoc.portfolio.length
      );
      const currentPageItems = userDoc.portfolio.slice(startIndex, endIndex);

      let pageValue = 0;
      let pageProfitLoss = 0;
      const fields = [];

      currentPageItems.forEach((p, index) => {
        const currentPrice = p.playerId.stock.price;
        const stockValue = p.quantity * currentPrice;
        const initialInvestment = p.buyPrice || 0;

        const avgPurchasePrice =
          p.quantity > 0 ? initialInvestment : 0;

        const profitLoss = stockValue - initialInvestment;
        const profitLossPercent =
          avgPurchasePrice > 0
            ? ((stockValue - avgPurchasePrice) / avgPurchasePrice) * 100
            : 0;

        pageValue += stockValue;
        pageProfitLoss += profitLoss;

        const profitLossEmoji = profitLoss >= 0 ? "📈" : "📉";
        const profitLossText = profitLoss >= 0 ? "Profit" : "Loss";

        fields.push({
          name: `🏅 ${p.playerId.username || `<@${p.playerId.discordId}>`}`,
          value: [
            `📦 **Quantity**: ${p.quantity.toLocaleString()}`,
            `💸 **Buy Price**: $${avgPurchasePrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            `💰 **Current Price**: $${currentPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            `${profitLossEmoji} **${profitLossText}**: $${Math.abs(
              profitLoss
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} (${profitLossPercent.toFixed(2)}%)`,
            `💵 **Total Value**: $${stockValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          ].join("\n"),
          inline: false,
        });

        if (index < currentPageItems.length - 1) {
          fields.push({
            name: "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            value: "",
            inline: false,
          });
        }
      });

      let totalValue = 0;
      let totalProfitLoss = 0;
      userDoc.portfolio.forEach((p) => {
        const currentPrice = p.playerId.stock.price;
        const stockValue = p.quantity * currentPrice;
        const initialInvestment = p.buyPrice;
        totalValue += stockValue;
        totalProfitLoss += stockValue - initialInvestment;
      });

      if (currentPageItems.length > 0) {
        fields.push({
          name: "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          value: "",
          inline: false,
        });
      }

      const totalPLEmoji = totalProfitLoss >= 0 ? "📈" : "📉";
      const totalPLText = totalProfitLoss >= 0 ? "Profit" : "Loss";
      const totalPLPercent =
        userDoc.portfolio.length > 0
          ? (totalProfitLoss / (totalValue - totalProfitLoss)) * 100
          : 0;

      fields.push({
        name: "📊 Portfolio Summary",
        value: [
          `💵 **Total Portfolio Value**: $${totalValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          `${totalPLEmoji} **Total ${totalPLText}**: $${Math.abs(
            totalProfitLoss
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          `📅 **Average Performance**: ${totalPLPercent.toFixed(2)}%`,
        ].join("\n"),
        inline: true,
      });

      const pagePLEmoji = pageProfitLoss >= 0 ? "📈" : "📉";
      const pagePLText = pageProfitLoss >= 0 ? "Profit" : "Loss";
      fields.push({
        name: "📄 Page Summary",
        value: [
          `💵 **Total Page Value**: $${pageValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          `${pagePLEmoji} **Page ${pagePLText}**: $${Math.abs(
            pageProfitLoss
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        ].join("\n"),
        inline: true,
      });

      return new EmbedBuilder()
        .setTitle(`🗂️ ${user.username || message.author.username}'s Portfolio (Page ${page + 1}/${totalPages})`)
        .setDescription(`Your investment portfolio contains ${userDoc.portfolio.length} different stocks.`)
        .setColor(0x00bfff)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(fields)
        .setFooter({ text:  `✨ Requested by ${message.author.username}`,iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("previous")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1 || totalPages === 1)
    );

    const msg = await message.channel.send({
      embeds: [generateEmbed(currentPage)],
      components: totalPages > 1 ? [row] : [],
    });

    if (totalPages > 1) {
      const collector = msg.createMessageComponentCollector({
        time: 60000, // 1 min
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: "These buttons are not for you!",
            ephemeral: true,
          });
        }

        await interaction.deferUpdate();

        if (interaction.customId === "previous" && currentPage > 0) {
          currentPage--;
        } else if (
          interaction.customId === "next" &&
          currentPage < totalPages - 1
        ) {
          currentPage++;
        }

        row.components[0].setDisabled(currentPage === 0);
        row.components[1].setDisabled(currentPage === totalPages - 1);

        await msg.edit({
          embeds: [generateEmbed(currentPage)],
          components: [row],
        });
      });

      collector.on("end", () => {
        row.components.forEach((button) => button.setDisabled(true));
        msg.edit({ components: [] }).catch(() => {});
      });
    }
  }
}