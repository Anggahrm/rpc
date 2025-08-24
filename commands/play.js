const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const config = require('../config/config');
const MusicSource = require('../utils/MusicSource');
const MusicPlayer = require('../src/MusicPlayer');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play music from URL or search query')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('YouTube URL or search query')
                .setRequired(true)),
    category: 'Music',
    voiceChannel: true,
    
    async execute(interaction) {
        const query = interaction.options.getString('query');
        
        // Check if user is in a voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ You need to be in a voice channel to play music!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check permissions
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has(['Connect', 'Speak'])) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ I don\'t have permission to join and speak in your voice channel!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Get or create queue
            const queueManager = interaction.client.queueManager;
            const queue = queueManager.getQueue(interaction.guild.id);

            let songInfo;

            // Check if query is a URL
            if (query.includes('youtube.com') || query.includes('youtu.be') || query.includes('http')) {
                songInfo = await MusicSource.getInfo(query);
            } else {
                // Search for the query
                const searchResults = await MusicSource.search(query, 1);
                if (searchResults.length === 0) {
                    const embed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setDescription('❌ No results found for your search query!');
                    
                    return interaction.editReply({ embeds: [embed] });
                }
                songInfo = searchResults[0];
            }

            // Add requested user info
            songInfo.requestedBy = interaction.user;

            // Connect to voice channel if not connected
            let connection = getVoiceConnection(interaction.guild.id);
            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
                queue.voiceConnection = connection;
            }

            // Add song to queue
            const position = queue.addSong(songInfo);

            // Create music player if it doesn't exist
            if (!queue.audioPlayer) {
                queue.audioPlayer = new MusicPlayer(queue);
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.music)
                .setTimestamp();

            // If it's the first song in queue and nothing is playing, start playing
            if (position === 1 && !queue.isPlaying) {
                embed.setTitle('🎵 Now Playing')
                    .setDescription(`**[${songInfo.title}](${songInfo.url})**`)
                    .addFields(
                        { name: '👤 Requested by', value: `${songInfo.requestedBy}`, inline: true },
                        { name: '⏱️ Duration', value: MusicSource.formatDuration(songInfo.duration), inline: true },
                        { name: '📺 Channel', value: songInfo.author || 'Unknown', inline: true }
                    );

                if (songInfo.thumbnail) {
                    embed.setThumbnail(songInfo.thumbnail);
                }

                // Start playing
                try {
                    await queue.audioPlayer.play(songInfo);
                } catch (error) {
                    logger.error(`Failed to start playing: ${error.message}`);
                    embed.setColor(config.colors.error)
                        .setTitle('❌ Playback Error')
                        .setDescription('Failed to start playing this song. Please try again.');
                }
            } else {
                // Song added to queue
                embed.setTitle('📋 Added to Queue')
                    .setDescription(`**[${songInfo.title}](${songInfo.url})**`)
                    .addFields(
                        { name: '📍 Position in Queue', value: `#${position}`, inline: true },
                        { name: '👤 Requested by', value: `${songInfo.requestedBy}`, inline: true },
                        { name: '⏱️ Duration', value: MusicSource.formatDuration(songInfo.duration), inline: true }
                    );

                if (songInfo.thumbnail) {
                    embed.setThumbnail(songInfo.thumbnail);
                }
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.error(`Error in play command: ${error.message}`);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ Error')
                .setDescription('Failed to process your request. Please check the URL or try a different search term.');

            await interaction.editReply({ embeds: [embed] });
        }
    },
};