import Player from "../models/Player.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export default {
  name: "leaderboard",
  description:
    "Paginated leaderboard with dropdown to switch between runs, wickets, and stock price",
  async execute(message) {
    const TYPES = {
      runs: "🏏 Runs",
      wickets: "🎯 Wickets",
      impact: "💥 Impact",
      avg: "📊 Bat Avg",
      highScore: "🔝 High Score",
      mostWickets: "🎳 Most Wickets",
      "100s": "💯 Centuries",
      "50s": "5️⃣0️⃣ Half Centuries",
      "5w": "5️⃣ Five Wickets",
      "3w": "3️⃣ Three Wickets",
      ducks: "🦆 Ducks",
      conceded: "🎯 Runs Conceded",
      deliveries: "🏏 Balls Bowled",
      balls: "🏏 Balls Played",
    };

    const EMOJIS = {
      1: "🥇",
      2: "🥈",
      3: "🥉",
    };

    // Add type-based colors for visual variety
    const TYPE_COLORS = {
      runs: 0xe74c3c, // Red
      wickets: 0x2ecc71, // Green
      impact: 0xe67e22, // Orange
      avg: 0x3498db, // Blue
      highScore: 0x9b59b6, // Purple
      mostWickets: 0x1abc9c, // Turquoise
      "100s": 0xf1c40f, // Yellow
      "50s": 0xd35400, // Dark Orange
      "5w": 0x27ae60, // Dark Green
      "3w": 0x16a085, // Light Green
      ducks: 0x7f8c8d, // Gray
      conceded: 0xc0392b, // Dark Red
      deliveries: 0x8e44ad, // Dark Purple
      balls: 0x2980b9, // Dark Blue
    };

    // Fun cricket quotes to display at random
    const CRICKET_QUOTES = [
      "Cricket is a game of glorious uncertainties.",
      "In cricket, as in life, timing is everything.",
      "Form is temporary, class is permanent.",
      "Cricket is not just a game, it's a way of life.",
      "The essence of cricket is not merely taking wickets and scoring runs.",
      "Cricket is a game that teaches you the importance of teamwork.",
    ];

    let selectedType = "runs";
    let page = 0;
    const perPage = 10;
    let loadingMessage = null;

    // Show loading message
    loadingMessage = await message.channel.send(
      "🏏 **Gathering statistics** | *Loading leaderboard...*"
    );

    const fetchPlayers = async (type) => {
      const sortField = type === "price" ? "stock.price" : `stats.${type}`;
      return await Player.find()
        .sort({ [sortField]: -1 })
        .limit(50);
    };

    let allPlayers = await fetchPlayers(selectedType);

    // Get usernames for players
    const getUsernames = async () => {
      for (const player of allPlayers) {
        if (!player.name && player.discordId) {
          try {
            const user = await message.client.users.fetch(player.discordId);
            player.username = user.username;
          } catch (error) {
            player.username = `User-${player.discordId}`;
          }
        }
      }
    };

    await getUsernames();

    const formatNumber = (num) => {
      return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
    };

    // Find if message author is in the leaderboard
    const findAuthorPosition = () => {
      const authorId = message.author.id;
      const authorIndex = allPlayers.findIndex((p) => p.discordId === authorId);

      if (authorIndex === -1) return null;

      return {
        position: authorIndex + 1,
        value:
          selectedType === "price"
            ? formatNumber(allPlayers[authorIndex].stock.price) + " coins"
            : formatNumber(allPlayers[authorIndex].stats[selectedType]),
        player: allPlayers[authorIndex],
      };
    };

    const getEmbed = () => {
      const start = page * perPage;
      const end = start + perPage;
      const players = allPlayers.slice(start, end);

      const typeLabel = TYPES[selectedType] || selectedType;
      const typeColor = TYPE_COLORS[selectedType] || 0x3498db;

      // Check if all players have zero values
      const allZero = players.every((p) => {
        const value =
          selectedType === "price" ? p.stock.price : p.stats[selectedType];
        return !value || value === 0;
      });

      let list = "";
      if (allZero) {
        list = "❌ **Empty Leaderboard** ❌\nNo players have recorded any stats for this category yet. Be the first to make your mark!";
      } else {
        players.forEach((p, i) => {
          const index = start + i + 1;
          const value =
            selectedType === "price"
              ? `${formatNumber(p.stock.price)} coins`
              : formatNumber(p.stats[selectedType]);
          // Skip players with zero values
          if (value === "0" || value === "0 coins") return;

          const rankEmoji = EMOJIS[index] || `\`${index}.\``;
          const playerName = p.name || p.username || `Unknown Player`;

          // Changed separator from "—" to ": \t"
          if (index <= 3) {
            list += `${rankEmoji} **${playerName}** : \t **${value}**\n`;
          } else {
            // For ranks beyond top 3, use normal formatting
            list += `${rankEmoji} ${playerName} : \t ${value}\n`;
          }

          // Highlight if it's the message author
          if (p.discordId === message.author.id) {
            list = list.replace(new RegExp(`(${rankEmoji} .+\\n)$`), `**$1**`);
          }
        });

        // If all entries were skipped due to zero values
        if (!list) {
          list = "❌ **Empty Leaderboard** ❌\nNo players have recorded any stats for this category yet. Be the first to make your mark!";
        }
      }

      const authorPosition = findAuthorPosition();
      let authorInfo = "";
      if (
        authorPosition &&
        (authorPosition.position < start + 1 ||
          authorPosition.position > end) &&
        authorPosition.value !== "0" &&
        authorPosition.value !== "0 coins"
      ) {
        authorInfo = `\n━━━━━━━━━━━━━━━━━━━━━\n**Your Position:** #${authorPosition.position} with ${authorPosition.value}`;
      }

      // Pick a random cricket quote
      const randomQuote =
        CRICKET_QUOTES[Math.floor(Math.random() * CRICKET_QUOTES.length)];

      return new EmbedBuilder()
        .setTitle(`🏆 Cricket Leaderboard | ${typeLabel}`)
        .setDescription(`${list || "No data available."}${authorInfo}`)
        .setColor(typeColor)
        .setThumbnail(
          message.guild.iconURL({ dynamic: true }) ||
            "https://i.imgur.com/6BELyPi.png"
        )
        .setFooter({
          text: `${randomQuote} • Page ${page + 1}/${Math.ceil(
            allPlayers.length / perPage
          )}`,
        })
        .setTimestamp();
    };

    const getComponents = () => [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("◀ Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),

        new ButtonBuilder()
          .setCustomId("refresh")
          .setEmoji("🔄")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Primary)
          .setDisabled((page + 1) * perPage >= allPlayers.length)
      ),
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("selectType")
          .setPlaceholder(`📊 Currently showing: ${TYPES[selectedType]}`)
          .addOptions(
            Object.entries(TYPES).map(([value, label]) => ({
              label,
              value,
              default: value === selectedType,
            }))
          )
      ),
    ];

    // Remove loading message
    if (loadingMessage) await loadingMessage.delete().catch(() => {});

    const sent = await message.channel.send({
      embeds: [getEmbed()],
      components: getComponents(),
    });

    const collector = sent.createMessageComponentCollector({ time: 120_000 }); // Extended timeout

    collector.on("collect", async (i) => {
      if (i.user.id !== message.author.id)
        return i.reply({
          content: "You can't interact with this leaderboard.",
          ephemeral: true,
        });

      if (i.isButton()) {
        if (i.customId === "next") page++;
        if (i.customId === "prev") page--;
        if (i.customId === "refresh") {
          allPlayers = await fetchPlayers(selectedType);
          await getUsernames();
          await i.deferUpdate();
          await i.editReply({ content: "🔄 Leaderboard refreshed!" });
        }
      }

      if (i.isStringSelectMenu() && i.customId === "selectType") {
        selectedType = i.values[0];
        page = 0;
        allPlayers = await fetchPlayers(selectedType);
        await getUsernames();
      }

      await i.update({
        embeds: [getEmbed()],
        components: getComponents(),
      });
    });

    collector.on("end", async () => {
      try {
        await sent.edit({
          components: [],
          embeds: [
            getEmbed().setFooter({
              text: "This leaderboard is no longer interactive",
            }),
          ],
        });
      } catch {}
    });
  },
};
