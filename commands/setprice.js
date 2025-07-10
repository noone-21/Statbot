import { EmbedBuilder } from "discord.js";
import Player from "../models/Player.js";

export default {
    name: "setprice",
    description: "Set the stock price of a specific player manually.",
    usage: "+setprice [@user | username | userId] [price]",
    aliases: ["updateprice", "set"],
    async execute(message, args) {
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Only admins can run this command.");
        }

        if (args.length < 2) {
            return message.reply("❌ Usage: `+setprice @user 50000`");
        }

        const price = parseInt(args.at(-1));
        const query = args.slice(0, -1).join(" ").toLowerCase();

        if (isNaN(price) || price < 0) {
            return message.reply("❌ Please enter a valid numeric price.");
        }

        let userId = null;
        let targetUser = null;

        // Try mention
        if (message.mentions.users.size > 0) {
            targetUser = message.mentions.users.first();
            userId = targetUser.id;
        } else {
            // Try userId or fuzzy name
            if (/^\d{17,19}$/.test(query)) {
                try {
                    targetUser = await message.client.users.fetch(query);
                    userId = targetUser.id;
                } catch {
                    return message.reply("❌ Couldn't fetch user from that ID.");
                }
            }

            if (!userId) {
                const members = await message.guild.members.fetch({ query, limit: 10 });
                const match = members.find(
                    (m) =>
                        m.user.username.toLowerCase().includes(query) ||
                        m.displayName.toLowerCase().includes(query)
                );
                if (match) {
                    targetUser = match.user;
                    userId = targetUser.id;
                }
            }
        }

        if (!userId) {
            return message.reply("❌ Couldn't identify the user.");
        }

        let player = await Player.findOne({
            discordId: userId,
            guildId: message.guild.id,
        });

        if (!player) {
            player = new Player({
                discordId: userId,
                guildId: message.guild.id,
                username: targetUser?.username ?? "Unknown",
                stats: {
                    runs: 0,
                    wickets: 0,
                    balls: 0,
                    conceded: 0,
                    ducks: 0,
                },
                stock: {
                    price: price,
                    shares: 20,
                    trend: 0,
                    outstanding: 0,
                },
            });
        } else {
            player.stock.price = price;
        }

        await player.save();

        player.stock.price = price;
        await player.save();

        const embed = new EmbedBuilder()
            .setColor("#FFD700")
            .setTitle("💸 Stock Price Updated")
            .setDescription(
                `Stock price for <@${userId}> has been manually set.`
            )
            .addFields(
                { name: "🧑 Player", value: `${targetUser?.username || "Unknown User"}` },
                { name: "💰 New Price", value: `${price} coins` }
            )
            .setFooter({ text: "Player Stock Market Admin Tool" })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },
};
