const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show bot statistics'),
    category: 'General',
    
    async execute(interaction) {
        const client = interaction.client;
        const queueManager = client.queueManager;
        const activeQueues = queueManager.getActiveQueues();
        
        // Calculate uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        // Calculate memory usage
        const memoryUsage = process.memoryUsage();
        const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        
        // Count total songs in all queues
        const totalSongs = activeQueues.reduce((total, queue) => total + queue.songs.length, 0);
        const playingQueues = activeQueues.filter(queue => queue.isPlaying).size;

        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('📊 Bot Statistics')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '🏠 Servers', value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 Users', value: `${client.users.cache.size}`, inline: true },
                { name: '📺 Channels', value: `${client.channels.cache.size}`, inline: true },
                { name: '⏱️ Uptime', value: uptimeString, inline: true },
                { name: '💾 Memory Usage', value: `${memoryMB} MB`, inline: true },
                { name: '🎵 Commands', value: `${client.commandHandler.commands.size}`, inline: true },
                { name: '🎶 Active Queues', value: `${activeQueues.size}`, inline: true },
                { name: '▶️ Playing', value: `${playingQueues}`, inline: true },
                { name: '📋 Total Songs', value: `${totalSongs}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ 
                text: `Node.js ${process.version}`,
                iconURL: client.user.displayAvatarURL()
            });

        await interaction.reply({ embeds: [embed] });
    },
};