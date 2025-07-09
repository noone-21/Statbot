import Prefix from "../models/Prefix.js";

export default {
  name: "prefix",
  aliases: ["setprefix", "changeprefix"],
  usage: "<newPrefix>",
  description: "Change the command prefix",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("You need to be an admin to change the prefix.");
    }

    const newPrefix = args[0];
    if (!newPrefix) return message.reply("Please provide a new prefix.");

    await Prefix.findOneAndUpdate(
      { guildId: message.guild.id },
      { prefix: newPrefix },
      { upsert: true }
    );

    message.channel.send(`✅ Prefix changed to \`${newPrefix}\``);
  }
};
