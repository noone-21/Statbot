import Player from "../models/Player.js";

export default {
  name: "market",
  description: "Display stock prices of all players",
  async execute(message) {
    const players = await Player.find().sort({ "stock.price": -1 }).limit(10);

    const list = players.map(p => `• <@${p.discordId}> - 💰 ${p.stock.price} coins`).join("\n");

    message.channel.send({
      embeds: [{
        title: "📊 Player Stock Market",
        description: list,
        color: 0x00ff99,
        timestamp: new Date()
      }]
    });
  }
};
