const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);

        if (!queue.isPlaying) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ There is no music currently playing!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (queue.isPaused) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('⏸️ Music is already paused!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const success = queue.audioPlayer?.pause();
        
        const embed = new EmbedBuilder()
            .setColor(success ? config.colors.success : config.colors.error)
            .setDescription(success ? '⏸️ Music paused!' : '❌ Failed to pause music!')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};