const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const MusicSource = require('../utils/MusicSource');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Jump to a specific time in the current song')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time to seek to (e.g., 1:30, 90, 2:15)')
                .setRequired(true)),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);
        const timeString = interaction.options.getString('time');

        if (!queue.isPlaying || queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ No song is currently playing!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Parse time string (supports formats like "1:30", "90", "2:15")
        let seekTimeInSeconds;
        try {
            if (timeString.includes(':')) {
                const parts = timeString.split(':');
                if (parts.length === 2) {
                    // MM:SS format
                    const minutes = parseInt(parts[0]);
                    const seconds = parseInt(parts[1]);
                    seekTimeInSeconds = minutes * 60 + seconds;
                } else if (parts.length === 3) {
                    // HH:MM:SS format
                    const hours = parseInt(parts[0]);
                    const minutes = parseInt(parts[1]);
                    const seconds = parseInt(parts[2]);
                    seekTimeInSeconds = hours * 3600 + minutes * 60 + seconds;
                } else {
                    throw new Error('Invalid time format');
                }
            } else {
                // Assume seconds only
                seekTimeInSeconds = parseInt(timeString);
            }

            if (isNaN(seekTimeInSeconds) || seekTimeInSeconds < 0) {
                throw new Error('Invalid time value');
            }
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ Invalid time format! Use formats like `1:30`, `90`, or `2:15`.');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const currentSong = queue.getCurrentSong();
        if (seekTimeInSeconds >= currentSong.duration) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(`❌ Seek time cannot be greater than song duration (${MusicSource.formatDuration(currentSong.duration)})!`);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            await queue.audioPlayer.seek(seekTimeInSeconds);

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('⏩ Seeked to Position')
                .setDescription(`**[${currentSong.title}](${currentSong.url})**`)
                .addFields(
                    { name: '⏱️ Seeked to', value: MusicSource.formatDuration(seekTimeInSeconds), inline: true },
                    { name: '⏱️ Song Duration', value: MusicSource.formatDuration(currentSong.duration), inline: true },
                    { name: '👤 Requested by', value: `${currentSong.requestedBy}`, inline: true }
                )
                .setTimestamp();

            if (currentSong.thumbnail) {
                embed.setThumbnail(currentSong.thumbnail);
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ Seek Failed')
                .setDescription('Failed to seek to the specified time. Please try again.');

            await interaction.editReply({ embeds: [embed] });
        }
    },
};