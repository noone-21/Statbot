import Player from "../models/Player.js";

export default {
  name: "market",
  description: "Display stock prices of all players",
  async execute(message) {
    const players = await Player.find().sort({ "stock.price": -1 }).limit(10);
    const formatNumber = num => num.toLocaleString();

    // Fetch usernames for all players
    for (const player of players) {
      try {
        const user = await message.client.users.fetch(player.discordId);
        player.username = user.username;
      } catch (error) {
        player.username = `User-${player.discordId}`;
      }
    }

    // Build description with proper spacing
    let listContent = "";
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const rankNum = i + 1;

      listContent +=
        `#${rankNum} **${player.username}**\n` +
        `💰 Value: ${formatNumber(player.stock.price)} units\n` +
        `📊 Available: ${player.stock.available || 0}/25 stocks\n\n`;
    }

    message.channel.send({
      embeds: [{
        title: "📊 PLAYER STOCK EXCHANGE 📈",
        description: "🔥 **HOT STOCKS RIGHT NOW** 🔥\n\n" + listContent + "*Invest wisely and watch your portfolio grow!*",
        color: 0x00BBFF,
        thumbnail: {
          url: "https://media.discordapp.net/attachments/1391015451659862056/1391742293869854790/2910311.png?ex=686d0084&is=686baf04&hm=061586a7c37f69acf9deb8e9632583b7e78985a3bd930243db613ef7b814d0b0&=&width=640&height=640"
        },
        fields: [
          {
            name: "📈 Market Insights",
            value: "Player values fluctuate based on activity and achievements. The market rewards consistent performers!"
          }
        ],
        footer: { text: "💰 Prices update in real-time | Use commands to invest" },
        timestamp: new Date()
      }]
    });
  }
};