import Player from "../models/Player.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

export default {
  name: "resetstats",
  aliases: ["resetall", "resetseason", "newseason"],
  usage: "+resetstats",
  description: "Reset all player stats and stock prices (new season)",
  async execute(message) {
    if (message.author.id !== process.env.OWNER_ID) {
      return message.reply("Only the bot owner can reset stats.");
    }
    
    // Send confirmation message as an embed
    const confirmEmbed = new EmbedBuilder()
      .setColor(0xFF0000) // Red color for warning
      .setTitle('⚠️ WARNING')
      .setDescription('This will reset ALL player stats and stock prices.')
      .setFooter({ text: 'This action cannot be undone' });
    
    // Create confirm and cancel buttons
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Danger);
      
    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
    
    const confirmMessage = await message.reply({ 
      embeds: [confirmEmbed],
      components: [row]
    });
    
    // Create a collector for button interactions
    const collector = confirmMessage.createMessageComponentCollector({ 
      filter: i => i.customId === 'confirm' || i.customId === 'cancel',
      time: 30000 // 30 seconds timeout
    });
    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ 
          content: "You cannot use these buttons.", 
          ephemeral: true 
        });
      }
      
      if (interaction.customId === 'cancel') {
        const cancelEmbed = new EmbedBuilder()
          .setColor(0x808080) // Gray color for cancelled operation
          .setTitle('Operation Cancelled')
          .setDescription('❌ Reset operation has been cancelled.');

        await interaction.update({ 
          content: "", 
          embeds: [cancelEmbed], 
          components: [] 
        });
        collector.stop();
        return;
      }
      
      if (interaction.customId === 'confirm') {
        // User confirmed, proceed with reset
        await interaction.update({ 
          content: "⏳ Resetting all player stats and stock prices. Please wait...", 
          embeds: [], 
          components: [] 
        });
        
        try {
          const players = await Player.find({ guildId: message.guild.id });
          
          for (const player of players) {
            player.stats = {
              runs: 0,
              balls: 0,
              conceded: 0,
              deliveries: 0,
              wickets: 0,
              ducks: 0
            };
            player.stock = {
              price: 50,
              history: []
            };
            await player.save();
          }
          
          await interaction.editReply("🧹 All stats and stock prices have been reset.");
        } catch (error) {
          await interaction.editReply("❌ An error occurred while resetting stats: " + error.message);
        }
        
        collector.stop();
      }
    });
    
    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        await confirmMessage.edit({ 
          content: "❌ Reset operation cancelled due to timeout.",
          components: []
        });
      }
    });
  }
};
