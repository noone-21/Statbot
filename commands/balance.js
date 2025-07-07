import { EmbedBuilder } from "discord.js";
import User from "../models/User.js";

// Collection of money-related quotes
const quotes = [
  "The real measure of your wealth is how much you'd be worth if you lost all your money. — Anonymous",
  "Wealth is not about having a lot of money; it's about having a lot of options. — Chris Rock",
  "It's not how much money you make, but how much money you keep. — Robert Kiyosaki",
  "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver. — Ayn Rand",
  "The more you learn, the more you earn. — Warren Buffett",
  "Money often costs too much. — Ralph Waldo Emerson",
  "The lack of money is the root of all evil. — Mark Twain",
  "Money is a terrible master but an excellent servant. — P.T. Barnum",
  "Time is money. — Benjamin Franklin",
  "Money can't buy happiness, but it can make you awfully comfortable while you're being miserable. — Clare Boothe Luce",
  "A penny saved is a penny earned. — Benjamin Franklin",
  "The best things in life are free. The second best are very expensive. —Coco Chanel",
  "Money is like manure. You have to spread it around or it smells. — J. Paul Getty",
  "When I had money everyone called me brother. — Polish Proverb",
  "Money is a terrible master but an excellent servant. — P.T. Barnum",
];

export default {
  name: "balance",
  description: "Check your coin balance",
  async execute(message) {
    const user =
      (await User.findOne({ discordId: message.author.id })) ||
      new User({ discordId: message.author.id, balance: 1000, portfolio: [] });
    await user.save();

    // Get a random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    // Format the balance with commas
    const formattedBalance = user.balance.toLocaleString();

    // Create an enhanced embedded message
    // Create an enhanced embedded message
    const embed = new EmbedBuilder()
      .setColor("#FFD700") // Gold color
      .setTitle("💰 Your Treasure Vault 💰")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields({
        name: "👤 Account Holder: ", value: `**${message.author.username}**`,
      })
      .addFields({
        name: "🪙 Current Balance: ",
        value: `**${formattedBalance} coins**`,
      })
      .addFields({ name: "💭 Words of Wisdom", value: `*"${randomQuote}"*` })
      .setFooter({ text: "✨ Premium Economy System ✨" })
      .setTimestamp();

    // Send the embedded message
    message.reply({ embeds: [embed] });
  },
};
