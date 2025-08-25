const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('speed')
        .setDescription('Adjust the playback speed of the current song')
        .addNumberOption(option =>
            option.setName('rate')
                .setDescription('Playback speed (0.25x to 2.0x, 1.0 = normal)')
                .setRequired(false)
                .setMinValue(0.25)
                .setMaxValue(2.0)),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);
        const speedRate = interaction.options.getNumber('rate');

        // If no speed provided, show current speed
        if (speedRate === null) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setDescription(`⚡ Current playback speed: **${queue.playbackSpeed}x**`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        }

        if (!queue.audioPlayer) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ No song is currently playing!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const oldSpeed = queue.playbackSpeed;
            await queue.audioPlayer.setSpeed(speedRate);

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('⚡ Playback Speed Changed')
                .setDescription(`Speed changed from **${oldSpeed}x** to **${speedRate}x**`)
                .setTimestamp();

            // Add current song info if playing
            const currentSong = queue.getCurrentSong();
            if (currentSong) {
                embed.addFields(
                    { name: '🎵 Current Song', value: `**[${currentSong.title}](${currentSong.url})**`, inline: false }
                );

                if (currentSong.thumbnail) {
                    embed.setThumbnail(currentSong.thumbnail);
                }
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ Speed Change Failed')
                .setDescription(`Failed to change playback speed: ${error.message}`);

            await interaction.editReply({ embeds: [embed] });
        }
    },
};