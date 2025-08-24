const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop music and clear the queue'),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);

        if (!queue.isPlaying && queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ There is no music playing!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Stop the player and clear queue
        if (queue.audioPlayer) {
            queue.audioPlayer.stop();
        }
        queue.clear();

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription('⏹️ Music stopped and queue cleared!')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};