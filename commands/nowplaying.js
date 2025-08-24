const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const MusicSource = require('../utils/MusicSource');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show information about the currently playing song'),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);

        const currentSong = queue.getCurrentSong();
        
        if (!currentSong) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ There is no music currently playing!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('🎵 Now Playing')
            .setDescription(`**[${currentSong.title}](${currentSong.url})**`)
            .addFields(
                { name: '👤 Requested by', value: `${currentSong.requestedBy}`, inline: true },
                { name: '📺 Channel', value: currentSong.author || 'Unknown', inline: true },
                { name: '⏱️ Duration', value: MusicSource.formatDuration(currentSong.duration), inline: true },
                { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
                { name: '📍 Position in Queue', value: `${queue.currentIndex + 1}/${queue.songs.length}`, inline: true },
                { name: '▶️ Status', value: queue.isPaused ? 'Paused' : 'Playing', inline: true }
            )
            .setTimestamp();

        if (currentSong.thumbnail) {
            embed.setThumbnail(currentSong.thumbnail);
        }

        // Add repeat mode if set
        if (queue.repeat !== 'none') {
            embed.addFields({
                name: '🔁 Repeat Mode',
                value: queue.repeat === 'song' ? 'Current Song' : 'Queue',
                inline: true
            });
        }

        // Add next song info if available
        const nextSong = queue.songs[queue.currentIndex + 1];
        if (nextSong) {
            embed.addFields({
                name: '⏭️ Up Next',
                value: `**[${nextSong.title}](${nextSong.url})**`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};