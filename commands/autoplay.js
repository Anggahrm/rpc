const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('Toggle autoplay to automatically add related songs when queue ends')
        .addBooleanOption(option =>
            option.setName('enable')
                .setDescription('Enable or disable autoplay')),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);
        const enableAutoplay = interaction.options.getBoolean('enable');

        // If no option provided, toggle current state
        const newState = enableAutoplay !== null ? enableAutoplay : !queue.autoplay;
        
        const oldState = queue.autoplay;
        queue.autoplay = newState;

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🔄 Autoplay Settings')
            .setDescription(`Autoplay is now **${newState ? 'enabled' : 'disabled'}**`)
            .addFields(
                { name: '📝 Description', value: newState ? 'Related songs will be automatically added when the queue ends' : 'Queue will stop when all songs finish', inline: false }
            )
            .setTimestamp();

        // Show current queue status if there are songs
        if (queue.songs.length > 0) {
            embed.addFields(
                { name: '📋 Current Queue', value: `${queue.songs.length} songs`, inline: true },
                { name: '🎵 Playing', value: queue.isPlaying ? 'Yes' : 'No', inline: true }
            );
        }

        await interaction.reply({ embeds: [embed] });
    },
};