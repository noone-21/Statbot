import User from "../models/User.js";
import Player from "../models/Player.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
  name: "portfolio",
  aliases: ["investments", "stocks", "holdings"],
  usage: "+portfolio",
  description: "View your portfolio",
  async execute(message) {
    const user = await User.findOne({ discordId: message.author.id }).populate(
      "portfolio.playerId"
    );
    if (!user || user.portfolio.length === 0) {
      return message.reply(
        "❌ You don't own any stocks yet. Use the `buy` command to get started!"
      );
    }

    // Ensure we have usernames for all players in portfolio
    for (const item of user.portfolio) {
      if (!item.playerId.username && item.playerId.discordId) {
        try {
          const discordUser = await message.client.users.fetch(
            item.playerId.discordId
          );
          item.playerId.username = discordUser.username;
        } catch (error) {
          item.playerId.username = `User-${item.playerId.discordId}`;
        }
      }
    }

    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(user.portfolio.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    // Function to generate embed for a specific page
    function generateEmbed(page) {
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = Math.min(
        startIndex + ITEMS_PER_PAGE,
        user.portfolio.length
      );
      const currentPageItems = user.portfolio.slice(startIndex, endIndex);

      // Calculate page value and profit/loss
      let pageValue = 0;
      let pageProfitLoss = 0;

      const fields = [];

      // Add each player with improved formatting
      currentPageItems.forEach((p, index) => {
        const currentPrice = p.playerId.stock.price;
        const stockValue = p.quantity * currentPrice;

        // Use buyPrice from schema (total amount spent)
        const initialInvestment = p.buyPrice || 0;

        // Calculate average purchase price per share
        const avgPurchasePrice =
          p.quantity > 0 ? initialInvestment : 0;

        const profitLoss = stockValue - initialInvestment;
        const profitLossPercent =
          avgPurchasePrice > 0
            ? (((currentPrice*p.quantity) - avgPurchasePrice) / avgPurchasePrice) * 100
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

        // Add separator between player entries (except after the last one)
        if (index < currentPageItems.length - 1) {
          fields.push({
            name: "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            value: "", // Zero-width space
            inline: false,
          });
        }
      });

      // Calculate total portfolio value and profit/loss
      let totalValue = 0;
      let totalProfitLoss = 0;
      user.portfolio.forEach((p) => {
        const currentPrice = p.playerId.stock.price;
        const purchasePrice = p.buyPrice;
        const stockValue = p.quantity * currentPrice;
        const initialInvestment = purchasePrice;
        totalValue += stockValue;
        totalProfitLoss += stockValue - initialInvestment;
      });

      // Add separator before summaries
      if (currentPageItems.length > 0) {
        fields.push({
          name: "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          value: "",
          inline: false,
        });
      }
      // Add total value as a separate field with more detail
      const totalPLEmoji = totalProfitLoss >= 0 ? "📈" : "📉";
      const totalPLText = totalProfitLoss >= 0 ? "Profit" : "Loss";
      const totalPLPercent =
        user.portfolio.length > 0
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
      // Add page summary
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

      return {
        title: `🗂️ ${message.author.username}'s Portfolio (Page ${
          page + 1
        }/${totalPages})`,
        description: `Your investment portfolio contains ${user.portfolio.length} different stocks.`,
        color: 0x00bfff,
        fields,
        thumbnail: {
          url: message.author.displayAvatarURL({ dynamic: true }),
        },
        footer: {
          text: "Use the buy and sell commands to manage your portfolio",
        },
        timestamp: new Date(),
      };
    }

    // Rest of the code remains the same
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
        time: 5 * 60 * 1000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: "These buttons are not for you!",
            ephemeral: true,
          });
        }

        await interaction.deferUpdate();

        if (interaction.customId === "previous") {
          if (currentPage > 0) currentPage--;
        } else if (interaction.customId === "next") {
          if (currentPage < totalPages - 1) currentPage++;
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
        msg.edit({ components: [row] }).catch(() => {});
      });
    }
  },
};
