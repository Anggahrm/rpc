const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const MusicSource = require('../utils/MusicSource');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move a song to a different position in the queue')
        .addIntegerOption(option =>
            option.setName('from')
                .setDescription('Current position of the song (1-based)')
                .setRequired(true)
                .setMinValue(1))
        .addIntegerOption(option =>
            option.setName('to')
                .setDescription('New position for the song (1-based)')
                .setRequired(true)
                .setMinValue(1)),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);
        
        const fromPosition = interaction.options.getInteger('from') - 1; // Convert to 0-based
        const toPosition = interaction.options.getInteger('to') - 1; // Convert to 0-based

        if (queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ The queue is empty!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (fromPosition < 0 || fromPosition >= queue.songs.length) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(`❌ Invalid source position! Please choose a number between 1 and ${queue.songs.length}.`);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (toPosition < 0 || toPosition >= queue.songs.length) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(`❌ Invalid destination position! Please choose a number between 1 and ${queue.songs.length}.`);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (fromPosition === toPosition) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ Source and destination positions are the same!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Can't move the currently playing song
        if (fromPosition === queue.currentIndex) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ Cannot move the currently playing song!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const movedSong = queue.moveSong(fromPosition, toPosition);

        if (!movedSong) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ Failed to move the song. Please try again.');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('📋 Song Moved')
            .setDescription(`**[${movedSong.title}](${movedSong.url})**`)
            .addFields(
                { name: '📍 From Position', value: `#${fromPosition + 1}`, inline: true },
                { name: '📍 To Position', value: `#${toPosition + 1}`, inline: true },
                { name: '👤 Requested by', value: `${movedSong.requestedBy}`, inline: true }
            )
            .setTimestamp();

        if (movedSong.thumbnail) {
            embed.setThumbnail(movedSong.thumbnail);
        }

        await interaction.reply({ embeds: [embed] });
    },
};