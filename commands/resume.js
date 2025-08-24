const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused song'),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);

        if (!queue.isPaused) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ Music is not paused!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const success = queue.audioPlayer?.resume();
        
        const embed = new EmbedBuilder()
            .setColor(success ? config.colors.success : config.colors.error)
            .setDescription(success ? '▶️ Music resumed!' : '❌ Failed to resume music!')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};