import Player from "../models/Player.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

export default {
  name: "resetstocks",
  aliases: ["rsx", "resetprices"],
  usage: "+resetstocks",
  description: "Reset all player stock prices and shares (but keep stats).",
  async execute(message) {
    if (message.author.id !== process.env.OWNER_ID) {
      return message.reply("Only the bot owner can reset stocks.");
    }

    const confirmEmbed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle("⚠️ Stock Reset Confirmation")
      .setDescription("This will reset all player **stock prices and shares** (not stats).")
      .setFooter({ text: "This action cannot be undone" });

    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const confirmMessage = await message.reply({
      embeds: [confirmEmbed],
      components: [row],
    });

    const collector = confirmMessage.createMessageComponentCollector({
      filter: (i) => i.customId === "confirm" || i.customId === "cancel",
      time: 30000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "You cannot use these buttons.",
          ephemeral: true,
        });
      }

      if (interaction.customId === "cancel") {
        const cancelEmbed = new EmbedBuilder()
          .setColor(0x808080)
          .setTitle("Operation Cancelled")
          .setDescription("❌ Stock reset operation has been cancelled.");

        await interaction.update({
          content: "",
          embeds: [cancelEmbed],
          components: [],
        });
        collector.stop();
        return;
      }

      if (interaction.customId === "confirm") {
        await interaction.update({
          content: "⏳ Resetting stock prices and shares. Please wait...",
          embeds: [],
          components: [],
        });

        try {
          const players = await Player.find({ guildId: message.guild.id });

          for (const player of players) {
            player.stock.price = 50000;
            player.stock.shares = 20;
            player.stock.trend = 0;
            player.stock.history = [];
            await player.save();
          }

          await interaction.editReply("💸 All player stock prices and shares have been reset.");
        } catch (err) {
          await interaction.editReply("❌ An error occurred while resetting stocks: " + err.message);
        }

        collector.stop();
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time" && collected.size === 0) {
        await confirmMessage.edit({
          content: "❌ Stock reset operation cancelled due to timeout.",
          components: [],
        });
      }
    });
  },
};
