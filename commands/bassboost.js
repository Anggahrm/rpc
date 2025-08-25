const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bassboost')
        .setDescription('Toggle bass boost audio filter')
        .addBooleanOption(option =>
            option.setName('enable')
                .setDescription('Enable or disable bass boost')),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);
        const enableBass = interaction.options.getBoolean('enable');

        if (!queue.audioPlayer) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ No song is currently playing!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // If no option provided, toggle current state
        const newState = enableBass !== null ? enableBass : !queue.audioFilters.bassboost;

        await interaction.deferReply();

        try {
            await queue.audioPlayer.setBassBoost(newState);

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🎛️ Bass Boost')
                .setDescription(`Bass boost is now **${newState ? 'enabled' : 'disabled'}**`)
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
                .setTitle('❌ Bass Boost Failed')
                .setDescription(`Failed to toggle bass boost: ${error.message}`);

            await interaction.editReply({ embeds: [embed] });
        }
    },
};