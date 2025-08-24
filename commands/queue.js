const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const MusicSource = require('../utils/MusicSource');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number to display')
                .setMinValue(1)),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);

        if (queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('📋 The queue is empty! Use `/play` to add some music.');
            
            return interaction.reply({ embeds: [embed] });
        }

        const page = interaction.options.getInteger('page') || 1;
        const queueInfo = queue.getQueueInfo(page, 10);

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('📋 Music Queue')
            .setTimestamp();

        let description = '';
        
        queueInfo.songs.forEach((song, index) => {
            const position = queueInfo.currentPage === 1 && index === 0 ? '🎵' : `${song.position + 1}.`;
            const duration = MusicSource.formatDuration(song.duration);
            const title = song.title.length > 50 ? song.title.substring(0, 50) + '...' : song.title;
            
            description += `${position} **[${title}](${song.url})**\n`;
            description += `   └ ${duration} • ${song.requestedBy}\n\n`;
        });

        embed.setDescription(description);

        // Add footer with pagination info
        let footerText = `Page ${queueInfo.currentPage}/${queueInfo.totalPages} • ${queueInfo.totalSongs} total songs`;
        
        if (queue.isPlaying) {
            footerText += ` • ${queue.isPaused ? 'Paused' : 'Playing'}`;
        }

        embed.setFooter({ text: footerText });

        // Calculate total duration
        const totalDuration = queue.songs.reduce((total, song) => total + (song.duration || 0), 0);
        if (totalDuration > 0) {
            embed.addFields({
                name: '⏱️ Total Duration',
                value: MusicSource.formatDuration(totalDuration),
                inline: true
            });
        }

        // Add repeat mode if set
        if (queue.repeat !== 'none') {
            embed.addFields({
                name: '🔁 Repeat Mode',
                value: queue.repeat === 'song' ? 'Current Song' : 'Queue',
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};