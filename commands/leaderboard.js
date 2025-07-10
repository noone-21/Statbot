import Player from "../models/Player.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
  AttachmentBuilder
} from "discord.js";
import { generateLeaderboardImage } from "../utils/generateLeaderboardImage.js";

export default {
  name: "leaderboard",
  aliases: ["lb", "leaderboards", "cricketlb"],
  description: "Shows the image-based leaderboard with dropdown and pagination.",
  async execute(message, args) {
    const TYPES = {
      runs: "🏏 Runs",
      wickets: "🎯 Wickets",
      highScore: "🔝 High Score",
      highestWickets: "🎳 Most Wickets",
      hundreds: "💯 Centuries",
      fifties: "5️⃣ Half Centuries",
      fiveWicketHauls: "5️⃣ Five Wicket Hauls",
      threeWicketHauls: "3️⃣ Three Wicket Hauls",
      ducks: "🦆 Ducks",
      conceded: "🎯 Runs Conceded",
      ballsBowled: "🏏 Balls Bowled",
      ballsPlayed: "🏏 Balls Played",
      matches: "🏆 Matches Played"
    };

    const FIELD_MAPPING = {
      runs: "stats.runs",
      wickets: "stats.wickets",
      highScore: "stats.highScore",
      highestWickets: "stats.highestWickets",
      hundreds: "stats.hundreds",
      fifties: "stats.fifties",
      fiveWicketHauls: "stats.fiveWicketHauls",
      threeWicketHauls: "stats.threeWicketHauls",
      ducks: "stats.ducks",
      conceded: "stats.conceded",
      ballsBowled: "stats.ballsBowled",
      ballsPlayed: "stats.ballsPlayed",
      matches: "stats.matches"
    };

    let selectedType = args[0]?.toLowerCase();
    if (!TYPES[selectedType]) selectedType = "runs";
    const perPage = 10;
    let page = 0;

    const loadingMessage = await message.channel.send(
      "🏏 **Gathering statistics** | *Loading leaderboard...*"
    );

    const fetchPlayers = async (type) => {
      const sortField = FIELD_MAPPING[type] || `stats.${type}`;
      const allPlayers = await Player.find({ guildId: message.guild.id })
        .sort({ [sortField]: -1 });

      let players = allPlayers.filter(p => (p.stats?.[type] || 0) > 0);

      let rank = 1;
      for (const p of players) {
        try {
          const user = message.client.users.cache.get(p.discordId)
            || await message.client.users.fetch(p.discordId);
          p.username = user.username;
          p.avatarURL = user.displayAvatarURL({ extension: "png", size: 64 });
        } catch {
          p.username = `User-${p.discordId}`;
          p.avatarURL = null;
        }
        p.rank = rank++;
      }

      return players;
    };

    let allPlayers = await fetchPlayers(selectedType);

    const getPagePlayers = () => {
      const start = page * perPage;
      const end = start + perPage;
      const players = allPlayers.slice(start, end);

      // Fill up empty rows with placeholders
      while (players.length < perPage) {
        players.push(null);
      }

      return players;
    };

    const buildMessage = async () => {
      const imageBuffer = await generateLeaderboardImage(
        getPagePlayers(),
        selectedType,
        TYPES[selectedType],
        perPage
      );

      const attachment = new AttachmentBuilder(imageBuffer, { name: "leaderboard.png" });

      const embed = new EmbedBuilder()
        .setImage("attachment://leaderboard.png")
        .setColor(0x2ecc71)
        .setFooter({
          text: `Requested by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL()
        });

      return {
        embeds: [embed],
        files: [attachment],
        components: getComponents()
      };
    };

    const getComponents = () => [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("◀ Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Primary)
          .setDisabled((page + 1) * perPage >= allPlayers.length)
      ),
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("selectType")
          .setPlaceholder(`📊 Showing: ${TYPES[selectedType]}`)
          .addOptions(
            Object.entries(TYPES).map(([key, label]) => ({
              label,
              value: key,
              default: key === selectedType
            }))
          )
      )
    ];

    await loadingMessage.delete().catch(() => {});
    const sent = await message.channel.send(await buildMessage());

    const collector = sent.createMessageComponentCollector({ time: 120_000 });

    collector.on("collect", async (i) => {
      if (i.user.id !== message.author.id) {
        return i.reply({
          content: "You can't interact with this leaderboard.",
          ephemeral: true
        });
      }

      if (i.isButton()) {
        if (i.customId === "next") page++;
        if (i.customId === "prev") page--;
      }

      if (i.isStringSelectMenu() && i.customId === "selectType") {
        selectedType = i.values[0];
        page = 0;
        allPlayers = await fetchPlayers(selectedType);
      }

      await i.deferUpdate();
      await sent.edit(await buildMessage());
    });

    collector.on("end", async () => {
      try {
        await sent.edit({ components: [] });
      } catch (err) {
        console.log("Failed to disable components:", err);
      }
    });
  }
};
