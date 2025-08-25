const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const config = require('../config/config');
const SpotifyParser = require('../utils/SpotifyParser');
const MusicPlayer = require('../src/MusicPlayer');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spotify')
        .setDescription('Add Spotify playlist or track to queue (plays via YouTube)')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Spotify playlist or track URL')
                .setRequired(true)),
    category: 'Music',
    voiceChannel: true,
    
    async execute(interaction) {
        const url = interaction.options.getString('url');
        
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

        if (!SpotifyParser.isSpotifyUrl(url)) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ Please provide a valid Spotify playlist or track URL!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Get or create queue
            const queueManager = interaction.client.queueManager;
            const queue = queueManager.getQueue(interaction.guild.id);

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

            // Create music player if it doesn't exist
            if (!queue.audioPlayer) {
                queue.audioPlayer = new MusicPlayer(queue);
            }

            const result = await SpotifyParser.parsePlaylist(url);
            
            if (result.success.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setDescription('❌ No tracks could be converted from the Spotify playlist!');
                
                return interaction.editReply({ embeds: [embed] });
            }

            // Add all successful tracks to queue
            let firstAddedIndex = null;
            for (const track of result.success) {
                track.requestedBy = interaction.user;
                const position = queue.addSong(track);
                if (firstAddedIndex === null) {
                    firstAddedIndex = position;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🎵 Spotify Playlist Added')
                .setDescription('Successfully imported tracks from Spotify playlist!')
                .addFields(
                    { name: '✅ Successfully Added', value: `${result.success.length} tracks`, inline: true },
                    { name: '❌ Failed to Convert', value: `${result.failed.length} tracks`, inline: true },
                    { name: '📍 Queue Position', value: `Starting at #${firstAddedIndex}`, inline: true }
                )
                .setTimestamp();

            if (result.failed.length > 0 && result.failed.length <= 5) {
                embed.addFields({
                    name: '⚠️ Failed Tracks',
                    value: result.failed.slice(0, 5).join('\n'),
                    inline: false
                });
            }

            // If nothing was playing and we added songs, start playing
            if (!queue.isPlaying && result.success.length > 0) {
                try {
                    const firstSong = queue.getCurrentSong();
                    if (firstSong) {
                        await queue.audioPlayer.play(firstSong);
                        embed.setDescription('Successfully imported and started playing Spotify playlist!');
                    }
                } catch (error) {
                    logger.error(`Failed to start playing: ${error.message}`);
                }
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.error(`Error in spotify command: ${error.message}`);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ Spotify Import Failed')
                .setDescription('Failed to import from Spotify. Please check the URL and try again.');

            await interaction.editReply({ embeds: [embed] });
        }
    },
};