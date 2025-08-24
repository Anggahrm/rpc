const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join your voice channel'),
    category: 'Music',
    voiceChannel: true,
    
    async execute(interaction) {
        // Check if user is in a voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ You need to be in a voice channel to use this command!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if bot has permissions
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has(['Connect', 'Speak'])) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ I don\'t have permission to join and speak in your voice channel!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            // Check if already connected to this channel
            const existingConnection = getVoiceConnection(interaction.guild.id);
            if (existingConnection && existingConnection.joinConfig.channelId === voiceChannel.id) {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.warning)
                    .setDescription('🔊 I\'m already connected to your voice channel!');
                
                return interaction.reply({ embeds: [embed] });
            }

            // Join the voice channel
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription(`🔊 Successfully joined **${voiceChannel.name}**!`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error joining voice channel:', error);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription('❌ Failed to join the voice channel. Please try again!');
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};