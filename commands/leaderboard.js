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
    "Paginated leaderboard with dropdown to switch between runs, wickets, and more",
  async execute(message) {
    // Map dropdown options to database fields
    const TYPES = {
      runs: "🏏 Runs",
      wickets: "🎯 Wickets",
      highScore: "🔝 High Score",
      highestWickets: "🎳 Most Wickets",
      hundreds: "💯 Centuries",
      fifties: "5️⃣0️⃣ Half Centuries",
      fiveWicketHauls: "5️⃣ Five Wickets hauls",
      threeWicketHauls: "3️⃣ Three Wickets hauls",
      ducks: "🦆 Ducks",
      conceded: "🎯 Runs Conceded",
      ballsBowled: "🏏 Balls Bowled",
      ballsPlayed: "🏏 Balls Played",
      matches: "🏆 Matches Played",
    };

    // Field mapping to database schema
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
      matches: "stats.matches",
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
      highScore: 0x9b59b6, // Purple
      highestWickets: 0x1abc9c, // Turquoise
      hundreds: 0xf1c40f, // Yellow
      fifties: 0xd35400, // Dark Orange
      fiveWicketHauls: 0x27ae60, // Dark Green
      threeWicketHauls: 0x16a085, // Light Green
      ducks: 0x7f8c8d, // Gray
      conceded: 0xc0392b, // Dark Red
      ballsBowled: 0x8e44ad, // Dark Purple
      ballsPlayed: 0x2980b9, // Dark Blue
      matches: 0x3498db, // Blue
    };

    // Fun cricket quotes to display at random
    const CRICKET_QUOTES = [
      "Cricket is a game of glorious uncertainties.",
      "In cricket, as in life, timing is everything.",
      "Form is temporary, class is permanent.",
      "Cricket is not just a game, it's a way of life.",
      "The essence of cricket is not merely taking wickets and scoring runs.",
      "Cricket is a game that teaches you the importance of teamwork.",
      "Every ball is a new opportunity.",
      "In cricket, patience is a virtue.",
      "A good cricketer is always learning.",
      "Cricket is a sport that unites nations.",
      "The thrill of cricket lies in its unpredictability.",
      "Cricket is a game of skill, strategy, and sportsmanship.",
      "In cricket, every player has a role to play.",
      "Cricket is a sport that transcends boundaries.",
      "The beauty of cricket is in its simplicity and complexity.",
      "Cricket is a game where every run counts.",
      "In cricket, the mind is as important as the body.",
      "Cricket is a sport that brings people together.",
      "The spirit of cricket is about respect and fair play.",
      "Cricket is a game of passion and dedication.",
      "In cricket, every match is a new challenge.",
      "Cricket is a sport that teaches you resilience.",
      "The joy of cricket is in the journey, not just the destination.",
      "Cricket is a game that celebrates diversity.",
      "In cricket, every player has the potential to be a hero.",
      "Cricket is a sport that inspires generations.",
      "The magic of cricket lies in its ability to create unforgettable moments.",
      "Cricket is a game that tests your character and skill.",
      "In cricket, teamwork makes the dream work.",
      "Cricket is a sport that teaches you humility and respect.",
      "The essence of cricket is in its traditions and values.",
      "Cricket is a game that requires both mental and physical strength.",
      "In cricket, every ball is a new beginning.",
      "Cricket is a sport that fosters camaraderie and friendship.",
      "The beauty of cricket is in its unpredictability and excitement.",
      "Cricket is a game that challenges you to be your best.",
      "In cricket, every player has a story to tell.",
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
      const sortField = FIELD_MAPPING[type] || `stats.${type}`;
      return await Player.find({ guildId: message.guild.id })
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

      const getValue = (player, type) => {
        return player.stats[type];
      };

      return {
        position: authorIndex + 1,
        value: formatNumber(getValue(allPlayers[authorIndex], selectedType)),
        player: allPlayers[authorIndex],
      };
    };

    const getEmbed = () => {
      const start = page * perPage;
      const end = start + perPage;
      const players = allPlayers.slice(start, end);

      const typeLabel = TYPES[selectedType] || selectedType;
      const typeColor = TYPE_COLORS[selectedType] || 0x3498db;

      const getValue = (player, type) => {
        return player.stats[type];
      };

      // Check if all players have zero values
      const allZero = players.every((p) => {
        const value = getValue(p, selectedType);
        return !value || value === 0;
      });

      let list = "";
      if (allZero) {
        list =
          "❌ **Empty Leaderboard** ❌\nNo players have recorded any stats for this category yet. Be the first to make your mark!";
      } else {
        players.forEach((p, i) => {
          const index = start + i + 1;
          const value = formatNumber(getValue(p, selectedType));
          // Skip players with zero values
          if (value === "0") return;

          const rankEmoji = EMOJIS[index] || `\`${index}.\``;
          const playerName = p.name || p.username || `Unknown Player`;

          if (index <= 3) {
            list += `${rankEmoji} **${playerName}** : \t **${value}**\n`;
          } else {
            list += `${rankEmoji} ${playerName} : \t ${value}\n`;
          }

          // Highlight if it's the message author
          if (p.discordId === message.author.id) {
            list = list.replace(new RegExp(`(${rankEmoji} .+\\n)$`), `**$1**`);
          }
        });

        // If all entries were skipped due to zero values
        if (!list) {
          list =
            "❌ **Empty Leaderboard** ❌\nNo players have recorded any stats for this category yet. Be the first to make your mark!";
        }
      }

      const authorPosition = findAuthorPosition();
      let authorInfo = "";
      if (
        authorPosition &&
        (authorPosition.position < start + 1 ||
          authorPosition.position > end) &&
        authorPosition.value !== "0"
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
          .setCustomId("next")
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(
            allPlayers.length <= perPage ||
              (page + 1) * perPage >= allPlayers.length ||
              !allPlayers
                .slice((page + 1) * perPage, (page + 2) * perPage)
                .some((p) => {
                  const value = p.stats[selectedType];
                  return value && value > 0;
                })
          )
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
          await i.deferUpdate();
          allPlayers = await fetchPlayers(selectedType);
          await getUsernames();
          // Don't need editReply after deferUpdate - the update call below will show the refreshed data
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
        // Only remove the components but keep the original embed
        const currentEmbed = sent.embeds[0];
        await sent.edit({
          components: [],
          embeds: [currentEmbed],
        });
      } catch (error) {
        console.log("Failed to update message after collector ended");
      }
    });
    // Ensure the collector is cleaned up properly
    collector.on("dispose", () => {
      console.log("Collector disposed");
    });
  },
};
