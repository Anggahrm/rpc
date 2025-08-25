const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('equalizer')
        .setDescription('Apply equalizer presets to the audio')
        .addStringOption(option =>
            option.setName('preset')
                .setDescription('Equalizer preset to apply')
                .addChoices(
                    { name: 'None (Flat)', value: 'none' },
                    { name: 'Pop', value: 'pop' },
                    { name: 'Rock', value: 'rock' },
                    { name: 'Jazz', value: 'jazz' },
                    { name: 'Classical', value: 'classical' }
                )),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);
        const preset = interaction.options.getString('preset');

        // If no preset provided, show current setting
        if (preset === null) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('🎛️ Current Equalizer Setting')
                .setDescription(`Current preset: **${queue.audioFilters.equalizer}**`)
                .addFields(
                    { name: 'Available Presets', value: 'none, pop, rock, jazz, classical', inline: false }
                )
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
            const oldPreset = queue.audioFilters.equalizer;
            await queue.audioPlayer.setEqualizer(preset);

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🎛️ Equalizer Changed')
                .setDescription(`Equalizer preset changed from **${oldPreset}** to **${preset}**`)
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
                .setTitle('❌ Equalizer Change Failed')
                .setDescription(`Failed to change equalizer preset: ${error.message}`);

            await interaction.editReply({ embeds: [embed] });
        }
    },
};