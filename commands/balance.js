import User from "../models/User.js";

export default {
  name: "balance",
  description: "Check your coin balance",
  async execute(message) {
    const user = await User.findOne({ discordId: message.author.id }) || new User({ discordId: message.author.id, balance: 1000, portfolio: [] });
    await user.save();
    message.reply(`💰 You have **${user.balance} coins**.`);
  }
};
