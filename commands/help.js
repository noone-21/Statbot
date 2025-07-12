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
      // ✅ Page 1: Bot Introduction
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🤖 StumpEX — Overview")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription([
          "Welcome to **StumpEx**, your all-in-one hand cricket stats tracker and stocks for Discord! 🏏",
          "",
          "**🔹 What It Does:**",
        
          "• Tracks detailed stats (runs, wickets, impact, etc.)",
          "• Includes a stock market-like investment system",
          "• Coins economy & leaderboard system",
          "",
          "**🔗 Support Server:**",
          "[Join Here](https://discord.gg/9Tmm9c5ajN)",
          "",
          //"**Invite bot to your server**",
          //"[Invite]",
          //"",
          "**👨‍💻 Developers:**",
          "• daniibhaii — `1244979225924993094`",
          "• rebelhere — `1159085791327301723`",
          "• .aatiq_ — `915415308565622874`",
        ].join("\n"))
        .setFooter({
          text: `✨ Requested by ${message.author.username} | Page 1 of 4`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp(),

      // ✅ Page 2: Stats Commands
      new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle("📖 HandCricket Bot — Help Menu")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription("📊 **Stats Commands**\n\n" + [
          "**+stats [@user]** — See your or other player’s stats.",
          "**+addstats** — Add raw stats from a match. 🔒 Admin only.",
          "**+removestats** — Remove raw stats from a match. 🔒 Admin only.",
          "**+leaderboard** — View top players (runs, wickets, etc).",
          "**+impact** — Check impact scores and rankings.",
        ].join("\n"))
        .setFooter({
          text: `✨ Requested by ${message.author.username} | Page 2 of 4`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp(),

      // ✅ Page 3: Stock Market Commands
      new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("📖 HandCricket Bot — Help Menu")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription("📈 **Stock Market Commands**\n\n" + [
          "**+price [@user]** — Check a player's stock price.",
          "**+buy @user amount** — Invest in a player.",
          "**+sell @user amount** — Sell stocks you own.",
          "**+portfolio** — View your holdings and profit/loss.",
          "**+balance** — Check your coin balance.",
          "**+market** — See Top 10 players by stock price.",
        ].join("\n"))
        .setFooter({
          text: `✨ Requested by ${message.author.username} | Page 3 of 4`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp(),

      // ✅ Page 4: Admin Commands
      new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle("📖 HandCricket Bot — Help Menu")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription("⚙️ **Admin Commands**\n\n" + [
          "**+addbalance @user amount** — Add coins to a user. 🔒",
          "**+removebalance @user amount** — Remove coins. 🔒",
        ].join("\n"))
        .setFooter({
          text: `✨ Requested by ${message.author.username} | Page 4 of 4`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp(),
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
      time: 30000, // 30 secs
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "Only the user who requested help can navigate.",
          ephemeral: true,
        });
      }

      await interaction.deferUpdate();

      if (interaction.customId === "next" && page < pages.length - 1) page++;
      else if (interaction.customId === "prev" && page > 0) page--;

      const updatedRow = new ActionRowBuilder().addComponents(
        ButtonBuilder.from(row.components[0]).setDisabled(page === 0),
        ButtonBuilder.from(row.components[1]).setDisabled(page === pages.length - 1)
      );

      await sentMessage.edit({
        embeds: [pages[page]],
        components: [updatedRow],
      });
    });

    collector.on("end", () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        ButtonBuilder.from(row.components[0]).setDisabled(true),
        ButtonBuilder.from(row.components[1]).setDisabled(true)
      );
      sentMessage.edit({ components: [] }).catch(() => {});
    });
  },
};