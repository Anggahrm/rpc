const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the music queue without stopping current song'),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);

        if (queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ The queue is already empty!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const currentSong = queue.getCurrentSong();
        const queueLength = queue.songs.length;

        // Keep only the current song
        queue.songs = currentSong ? [currentSong] : [];
        queue.currentIndex = 0;

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`🗑️ Cleared **${queueLength - (currentSong ? 1 : 0)}** songs from the queue!`)
            .setTimestamp();

        if (currentSong) {
            embed.addFields({
                name: '🎵 Currently Playing',
                value: `**[${currentSong.title}](${currentSong.url})**`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};