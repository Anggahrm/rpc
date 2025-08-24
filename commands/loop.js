const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggle loop mode for current song or queue')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Loop mode')
                .setRequired(false)
                .addChoices(
                    { name: 'Off', value: 'none' },
                    { name: 'Current Song', value: 'song' },
                    { name: 'Queue', value: 'queue' }
                )),
    category: 'Music',
    
    async execute(interaction) {
        const queueManager = interaction.client.queueManager;
        const queue = queueManager.getQueue(interaction.guild.id);
        const mode = interaction.options.getString('mode');

        if (queue.songs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription('❌ There are no songs in the queue!');
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // If no mode specified, cycle through modes
        if (!mode) {
            switch (queue.repeat) {
                case 'none':
                    queue.repeat = 'song';
                    break;
                case 'song':
                    queue.repeat = 'queue';
                    break;
                case 'queue':
                    queue.repeat = 'none';
                    break;
            }
        } else {
            queue.repeat = mode;
        }

        const modeEmoji = {
            'none': '🚫',
            'song': '🔂',
            'queue': '🔁'
        };

        const modeText = {
            'none': 'Off',
            'song': 'Current Song',
            'queue': 'Queue'
        };

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`${modeEmoji[queue.repeat]} Loop mode set to: **${modeText[queue.repeat]}**`)
            .setTimestamp();

        const currentSong = queue.getCurrentSong();
        if (currentSong && queue.repeat === 'song') {
            embed.addFields({
                name: '🔂 Looping Song',
                value: `**[${currentSong.title}](${currentSong.url})**`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};