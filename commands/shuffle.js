const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the music queue'),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);

        if (queue.songs.length < 2) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ Need at least 2 songs in the queue to shuffle!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const beforeCount = queue.songs.length;
        queue.shuffle();

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`🔀 Shuffled **${beforeCount}** songs in the queue!`)
            .setTimestamp();

        const currentSong = queue.getCurrentSong();
        if (currentSong) {
            embed.addFields({
                name: '🎵 Now Playing',
                value: `**[${currentSong.title}](${currentSong.url})**`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};