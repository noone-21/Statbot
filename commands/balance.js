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
  "The best things in life are free. The second best are very expensive. — Coco Chanel",
  "Money is like manure. You have to spread it around or it smells. — J. Paul Getty",
  "When I had money everyone called me brother. — Polish Proverb",
  "Money is a terrible master but an excellent servant. — P.T. Barnum",
];

export default {
  name: "balance",
  aliases: ["bal", "coins", "checkbalance", "checkbal", "wallet"],
  description: "Check your coin balance",
  usage: "+balance [@user | userID | username]",
  async execute(message, args) {
    let user = null;
    let target = null;

    // 1. Mentioned user
    if (message.mentions.users.size > 0) {
      target = message.mentions.users.first();
    }

    // 2. User ID or fuzzy match
    else if (args.length > 0) {
      const query = args.join(" ").toLowerCase();

      // Try fetching by ID
      if (/^\d{17,19}$/.test(query)) {
        try {
          target = await message.client.users.fetch(query);
        } catch {
          console.log("Invalid ID or user not found. Trying fuzzy match...");
        }
      }

      // Fallback: fuzzy match
      if (!target) {
        const members = await message.guild.members.fetch();
        const match = members.find(
          (m) =>
            m.user.username.toLowerCase().includes(query) ||
            m.displayName.toLowerCase().includes(query)
        );
        if (match) {
          target = match.user;
        } else {
          return message.reply("❌ Couldn't find a user with that name or ID.");
        }
      }
    }

    // 3. Default to self
    if (!target) {
      target = message.author;
    }

    user = (await User.findOne({ discordId: target.id })) || new User({
      discordId: target.id,
      balance: 0,
      portfolio: [],
    });
    await user.save();

    const formattedBalance = user.balance.toLocaleString();
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("💰 Your Treasure Vault 💰")
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields({
        name: "👤 Account Holder:",
        value: `**${target.username}**`,
      })
      .addFields({
        name: "🪙 Current Balance:",
        value: `**${formattedBalance} coins**`,
      })
      .addFields({
        name: "💭 Words of Wisdom",
        value: `*"${randomQuote}"*`,
      })
      .setFooter({ text: "✨ Premium Economy System ✨", iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
