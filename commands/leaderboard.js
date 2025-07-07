import Player from "../models/Player.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} from "discord.js";

export default {
  name: "leaderboard",
  description: "Paginated leaderboard with dropdown to switch between runs, wickets, and stock price",
  async execute(message) {

    const TYPES = {
       runs: "🏏 Runs",
      wickets: "🎯 Wickets",
      impact: "Impact",
      avg: "Bat Avg",
      highScore: "High Score",
      mostWickets: "Most Wickets",
      "100s": "100s",
      "50s": "50s",
      "5w": "5w",
      "3w": "3w",
      ducks: "Ducks",
      conceded: "Runs Conceded",
      deliveries: "Balls Bowled",
      balls: "Balls Played"
    };

    let selectedType = "runs";
    let page = 0;
    const perPage = 10;

    const fetchPlayers = async (type) => {
      const sortField = type === "price" ? "stock.price" : `stats.${type}`;
      return await Player.find().sort({ [sortField]: -1 }).limit(50);
    };

    let allPlayers = await fetchPlayers(selectedType);

    const getEmbed = () => {
      const start = page * perPage;
      const end = start + perPage;
      const players = allPlayers.slice(start, end);

      const list = players.map((p, i) => {
        const index = start + i + 1;
        const value = selectedType === "price" ? `${p.stock.price} coins` : p.stats[selectedType];
        return `**${index}.** <@${p.discordId}> — ${value}`;
      }).join("\n");

      return new EmbedBuilder()
        .setTitle(`🏆 Leaderboard by ${TYPES[selectedType]}`)
        .setDescription(list || "No data available.")
        .setColor(0x00b0f4)
        .setFooter({ text: `Page ${page + 1} / ${Math.ceil(allPlayers.length / perPage)}` })
        .setTimestamp();
    };

    const getComponents = () => [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("◀ Prev")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),

        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled((page + 1) * perPage >= allPlayers.length)
      ),
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("selectType")
          .setPlaceholder("📊 Select Leaderboard Type")
          .addOptions(
            Object.entries(TYPES).map(([value, label]) => ({
              label,
              value,
              default: value === selectedType
            }))
          )
      )
    ];

    const sent = await message.channel.send({
      embeds: [getEmbed()],
      components: getComponents()
    });

    const collector = sent.createMessageComponentCollector({ time: 60_000 });

    collector.on("collect", async (i) => {
      if (i.user.id !== message.author.id)
        return i.reply({ content: "You can't interact with this leaderboard.", ephemeral: true });

      if (i.isButton()) {
        if (i.customId === "next") page++;
        if (i.customId === "prev") page--;
      }

      if (i.isStringSelectMenu() && i.customId === "selectType") {
        selectedType = i.values[0];
        page = 0;
        allPlayers = await fetchPlayers(selectedType);
      }

      await i.update({
        embeds: [getEmbed()],
        components: getComponents()
      });
    });

    collector.on("end", async () => {
      try {
        await sent.edit({ components: [] });
      } catch {}
    });
  }
};
