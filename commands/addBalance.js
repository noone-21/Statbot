import User from "../models/User.js";
import { EmbedBuilder } from "discord.js";

export default {
  name: "addbalance",
  aliases: ["addbal", "givebalance"],
  usage: "<@user | userID | username> <amount>",
  description: "Admin: Add balance to a user",
  async execute(message, args) {
    if (message.author.id !== process.env.OWNER_ID) return;

    const [targetArg, amountStr] = args;
    const amount = parseInt(amountStr);

if (!targetArg || isNaN(amount) || amount <= 0) {
  return message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Missing or Invalid Arguments")
        .addFields(
          { name: "Usage", value: "`+addbalance <@user | userID | username> <amount>`" },
          { name: "Example", value: "`+addbalance krishna_51500 1000`" }
        )
        .setFooter({ text: "HandCricket Economy System" })
    ]
  });
}


    let targetUser = null;

    // Mentioned
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    }

    // ID or fuzzy name
    else {
      const query = targetArg.toLowerCase();

      if (/^\d{17,19}$/.test(query)) {
        try {
          targetUser = await message.client.users.fetch(query);
        } catch {
          console.log("User ID not found. Trying fuzzy match...");
        }
      }

      if (!targetUser) {
        const members = await message.guild.members.fetch();
        const match = members.find(
          (m) =>
            m.user.username.toLowerCase().includes(query) ||
            m.displayName.toLowerCase().includes(query)
        );
        if (match) {
          targetUser = match.user;
        } else {
          return message.reply("❌ Couldn't find a user with that name or ID.");
        }
      }
    }

    const dbUser =
      (await User.findOne({ discordId: targetUser.id })) ||
      new User({ discordId: targetUser.id, balance: 0, portfolio: [] });

    dbUser.balance += amount;
    await dbUser.save();

    const formattedAmount = amount.toLocaleString();
    const formattedNewBalance = dbUser.balance.toLocaleString();

    const embed = new EmbedBuilder()
      .setColor("#2ecc71")
      .setTitle(`Added balance to ${targetUser.username}'s wallet 🏏`)
      .addFields(
        {
          name: "Details",
          value: `💰 Amount: ${formattedAmount} units`,
        },
        {
          name: "New Balance",
          value: `💸 ${formattedNewBalance} units`,
        }
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "✨ Premium Economy System ✨" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
