const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const config = require('../config/config');
const PlaylistManager = require('../utils/PlaylistManager');
const MusicSource = require('../utils/MusicSource');
const MusicPlayer = require('../src/MusicPlayer');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Manage saved playlists')
        .addSubcommand(subcommand =>
            subcommand
                .setName('save')
                .setDescription('Save the current queue as a playlist')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name for the playlist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('load')
                .setDescription('Load a saved playlist')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the playlist to load')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all saved playlists'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a saved playlist')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the playlist to delete')
                        .setRequired(true))),
    category: 'Music',
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);

        switch (subcommand) {
            case 'save':
                await this.handleSave(interaction, queue);
                break;
            case 'load':
                await this.handleLoad(interaction, queue);
                break;
            case 'list':
                await this.handleList(interaction);
                break;
            case 'delete':
                await this.handleDelete(interaction);
                break;
        }
    },

    async handleSave(interaction, queue) {
        const playlistName = interaction.options.getString('name');

        if (queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ The queue is empty! Add some songs first.');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const playlist = await PlaylistManager.savePlaylist(
                interaction.guild.id,
                playlistName,
                queue.songs,
                interaction.user
            );

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('💾 Playlist Saved')
                .setDescription(`Successfully saved playlist **${playlist.name}**`)
                .addFields(
                    { name: '🎵 Total Songs', value: `${playlist.songs.length}`, inline: true },
                    { name: '⏱️ Total Duration', value: MusicSource.formatDuration(playlist.totalDuration), inline: true },
                    { name: '👤 Created by', value: `${interaction.user}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ Save Failed')
                .setDescription(`Failed to save playlist: ${error.message}`);

            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleLoad(interaction, queue) {
        const playlistName = interaction.options.getString('name');
        
        // Check if user is in a voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ You need to be in a voice channel to load a playlist!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const playlist = await PlaylistManager.loadPlaylist(interaction.guild.id, playlistName);

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

            // Add all songs to queue
            let startedPlaying = false;
            for (const song of playlist.songs) {
                song.requestedBy = interaction.user;
                song.loadedFromPlaylist = playlist.name;
                queue.addSong(song);
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('📂 Playlist Loaded')
                .setDescription(`Successfully loaded playlist **${playlist.name}**`)
                .addFields(
                    { name: '🎵 Songs Added', value: `${playlist.songs.length}`, inline: true },
                    { name: '⏱️ Total Duration', value: MusicSource.formatDuration(playlist.totalDuration), inline: true },
                    { name: '👤 Created by', value: playlist.createdByTag, inline: true }
                )
                .setTimestamp();

            // If nothing was playing, start playing the first song
            if (!queue.isPlaying && playlist.songs.length > 0) {
                try {
                    const firstSong = queue.getCurrentSong();
                    if (firstSong) {
                        await queue.audioPlayer.play(firstSong);
                        embed.setDescription(`Successfully loaded and started playing playlist **${playlist.name}**!`);
                    }
                } catch (error) {
                    logger.error(`Failed to start playing: ${error.message}`);
                }
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ Load Failed')
                .setDescription(`Failed to load playlist: ${error.message}`);

            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleList(interaction) {
        await interaction.deferReply();

        try {
            const playlists = await PlaylistManager.listPlaylists(interaction.guild.id);

            if (playlists.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.info)
                    .setDescription('📂 No saved playlists found for this server.');
                
                return interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('📂 Saved Playlists')
                .setTimestamp();

            let description = '';
            playlists.forEach((playlist, index) => {
                const createdDate = new Date(playlist.createdAt).toLocaleDateString();
                description += `**${index + 1}. ${playlist.name}**\n`;
                description += `   └ ${playlist.songCount} songs • ${MusicSource.formatDuration(playlist.totalDuration)}\n`;
                description += `   └ Created by ${playlist.createdBy} on ${createdDate}\n\n`;
            });

            embed.setDescription(description);
            embed.setFooter({ text: `Total: ${playlists.length} playlists` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ List Failed')
                .setDescription('Failed to list playlists. Please try again.');

            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleDelete(interaction) {
        const playlistName = interaction.options.getString('name');

        await interaction.deferReply();

        try {
            const deletedPlaylist = await PlaylistManager.deletePlaylist(
                interaction.guild.id,
                playlistName,
                interaction.user.id
            );

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🗑️ Playlist Deleted')
                .setDescription(`Successfully deleted playlist **${deletedPlaylist.name}**`)
                .addFields(
                    { name: '🎵 Songs', value: `${deletedPlaylist.songs.length}`, inline: true },
                    { name: '⏱️ Duration', value: MusicSource.formatDuration(deletedPlaylist.totalDuration), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ Delete Failed')
                .setDescription(`Failed to delete playlist: ${error.message}`);

            await interaction.editReply({ embeds: [embed] });
        }
    },
};