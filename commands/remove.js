const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const MusicSource = require('../utils/MusicSource');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a song from the queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position of the song to remove (1-based)')
                .setRequired(true)
                .setMinValue(1)),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);
        const position = interaction.options.getInteger('position') - 1; // Convert to 0-based

        if (queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ The queue is empty!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (position < 0 || position >= queue.songs.length) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(`❌ Invalid position! Please choose a number between 1 and ${queue.songs.length}.`);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Can't remove currently playing song
        if (position === queue.currentIndex && queue.isPlaying) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ Cannot remove the currently playing song! Use `/skip` instead.');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const removedSong = queue.removeSong(position);

        // Adjust current index if necessary
        if (position < queue.currentIndex) {
            queue.currentIndex--;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🗑️ Song Removed')
            .setDescription(`**[${removedSong.title}](${removedSong.url})**`)
            .addFields(
                { name: '👤 Requested by', value: `${removedSong.requestedBy}`, inline: true },
                { name: '⏱️ Duration', value: MusicSource.formatDuration(removedSong.duration), inline: true },
                { name: '📍 Was at Position', value: `#${position + 1}`, inline: true }
            )
            .setTimestamp();

        if (removedSong.thumbnail) {
            embed.setThumbnail(removedSong.thumbnail);
        }

        await interaction.reply({ embeds: [embed] });
    },
};