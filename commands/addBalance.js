import User from "../models/User.js";

export default {
  name: "addbalance",
  aliases: ["addbal", "givebalance"],
  usage: "<@user> <amount>",
  description: "Admin: Add balance to user",
  async execute(message, args) {
    if (message.author.id !== process.env.OWNER_ID) return message.reply("Only the bot owner can use this.");

    const [mention, amountStr] = args;
    const amount = parseInt(amountStr);
    const targetId = mention.replace(/[<@!>]/g, "");

    const user = await User.findOne({ discordId: targetId }) || new User({ discordId: targetId, balance: 0, portfolio: [] });
    user.balance += amount;
    await user.save();

    message.reply(`✅ Added ${amount} coins to <@${targetId}>.`);
  }
};
