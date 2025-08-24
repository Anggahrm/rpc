const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set or view the current volume')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setMinValue(0)
                .setMaxValue(100)),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);
        const volumeLevel = interaction.options.getInteger('level');

        // If no volume level provided, show current volume
        if (volumeLevel === null) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setDescription(`🔊 Current volume: **${queue.volume}%**`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        }

        // Set new volume
        const oldVolume = queue.volume;
        if (queue.audioPlayer) {
            queue.audioPlayer.setVolume(volumeLevel);
        } else {
            queue.volume = volumeLevel;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`🔊 Volume changed from **${oldVolume}%** to **${volumeLevel}%**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};