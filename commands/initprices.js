import { EmbedBuilder } from "discord.js";
import Player from "../models/Player.js";

export default {
  name: "initprices",
  description: "Initialize base stock price for all or a specific role's members.",
  aliases: ["init", "initialize"],
  usage: "+initprices [@role]",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Only admins can run this command.");
    }

    let targetMembers;
    const guild = message.guild;

    // Role Mentioned
    if (message.mentions.roles.size > 0) {
      const role = message.mentions.roles.first();
      targetMembers = role.members.filter((m) => !m.user.bot);
    } else {
      // No role mentioned – get all members
      const allMembers = await guild.members.fetch();
      targetMembers = allMembers.filter((m) => !m.user.bot);
    }

    if (targetMembers.size === 0) {
      return message.reply("❌ No valid (non-bot) members found to initialize.");
    }

    await message.channel.send("⏳ Initializing stock prices...");

    let created = 0;
    let skipped = 0;

    for (const member of targetMembers.values()) {
      const existing = await Player.findOne({
        discordId: member.id,
        guildId: guild.id,
      });

      if (existing) {
        skipped++;
        continue;
      }

      await Player.create({
        discordId: member.id,
        guildId: guild.id,
        username: member.user.username,
        stats: {
          runs: 0,
          wickets: 0,
          balls: 0,
          conceded: 0,
          ducks: 0,
        },
        stock: {
          price: 50000,
          shares: 20,
          trend: 0,
          outstanding: 0,
        },
      });

      created++;
    }

    const embed = new EmbedBuilder()
      .setColor("#4CAF50")
      .setTitle("📦 Stock Prices Initialized")
      .setDescription(
        `Initialized stock prices for ${
          message.mentions.roles.size > 0
            ? `members in role ${message.mentions.roles.first()}`
            : "all server members"
        }.`
      )
      .addFields(
        { name: "✅ New Players", value: `${created}`, inline: true },
        { name: "⏩ Already Existing", value: `${skipped}`, inline: true },
        { name: "👥 Total Processed", value: `${created + skipped}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "🏦 Player Stock Market" });

    return message.channel.send({ embeds: [embed] });
  },
};
