import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

export default {
  name: "help",
  description: "Show help menu with bot commands.",
  async execute(message) {
    const pages = [
      new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle("📖 HandCricket Bot — Help Menu")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription("📊 **Stats Commands**\n\n" + [
          "+stats [@user | username] — View Player’s stats.",
          "+addstats — Add raw stats from a match. 🔒 Admin only.",
          "+removestats — Remove raw stats from a match.  🔒 Admin only.",
          "+leaderboard — View top players (runs, wickets, etc).",
          "+impact — Check impact scores and rankings.",
        ].join("\n"))
        .setFooter({
          text: `✨ Requested by ${message.author.username} | Page 1 of 3`,
          iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp(),

      new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("📖 HandCricket Bot — Help Menu")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription("📈 **Stock Market**\n\n" + [
          "+price [@user | username] — Check a player's stock price.",
          "+buy @user amount — Invest in a player.",
          "+sell @user amount — Sell stocks you own.",
          "+portfolio — View your holdings and profit/loss.",
          "+balance — Check your coin balance.",
          "+market — See Top 10 players by stock price.",
        ].join("\n"))
        .setFooter({
          text: `✨ Requested by ${message.author.username} | Page 2 of 3`,
          iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp(),

      new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle("📖 HandCricket Bot — Help Menu")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription("⚙️ **Admin Commands**\n\n" + [
          "+addbalance @user amount — Add coins to a user. 🔒",
          "+removebalance @user amount — Remove coins. 🔒",
        ].join("\n"))
        .setFooter({
          text: `✨ Requested by ${message.author.username} | Page 3 of 3`,
          iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp()
    ];

    let page = 0;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("⏮️ Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next ⏭️")
        .setStyle(ButtonStyle.Primary)
    );

    const sentMessage = await message.reply({
      embeds: [pages[page]],
      components: [row],
    });

    const collector = sentMessage.createMessageComponentCollector({
      time: 60000, // 1 minute
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id)
        return interaction.reply({
          content: "Only the user who requested help can navigate.",
          ephemeral: true,
        });

      await interaction.deferUpdate();

      if (interaction.customId === "next") page++;
      else if (interaction.customId === "prev") page--;

      // Button enable/disable logic
      row.components[0].setDisabled(page === 0);
      row.components[1].setDisabled(page === pages.length - 1);

      await sentMessage.edit({
        embeds: [pages[page]],
        components: [row],
      });
    });

    collector.on("end", () => {
      row.components.forEach((btn) => btn.setDisabled(true));
      sentMessage.edit({ components: [row] }).catch(() => {});
    });
  },
};