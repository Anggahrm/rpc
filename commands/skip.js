const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next song'),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);

        if (!queue.isPlaying && queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ There is no music playing!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const currentSong = queue.getCurrentSong();
        
        if (queue.songs.length <= 1) {
            // Only one song, stop playing
            if (queue.audioPlayer) {
                queue.audioPlayer.stop();
            }
            queue.clear();

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setDescription('⏭️ Skipped the last song in queue. Queue is now empty!')
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // Skip to next song
        if (queue.audioPlayer) {
            queue.audioPlayer.stop(); // This will trigger the next song to play
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`⏭️ Skipped **${currentSong?.title || 'current song'}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};