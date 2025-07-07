import { Client, GatewayIntentBits, Collection } from "discord.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPrefix } from "./utils/getPrefix.js";

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.name, command.default);
}

client.on("ready", () => {
  console.log(`${client.user.tag} is online`);
  mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to MongoDB"));
});

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;

  const prefix = await getPrefix(message.guild.id);
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);
    message.reply("❌ There was an error executing that command.");
  }
});

client.login(process.env.TOKEN);
