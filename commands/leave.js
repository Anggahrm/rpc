const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leave the voice channel'),
    category: 'Music',
    
    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guild.id);
        
        if (!connection) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ I\'m not connected to any voice channel!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            connection.destroy();
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription('👋 Successfully left the voice channel!')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error leaving voice channel:', error);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ Failed to leave the voice channel. Please try again!');
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};