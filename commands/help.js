const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands'),
    
    async execute(interaction) {
        const commandHandler = interaction.client.commandHandler;
        const commands = commandHandler.commands;

        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🤖 Music Bot Commands')
            .setDescription('Here are all the available commands:')
            .setTimestamp();

        // Group commands by category
        const categories = {};
        commands.forEach(command => {
            const category = command.category || 'General';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(command);
        });

        // Add fields for each category
        Object.keys(categories).forEach(category => {
            const categoryCommands = categories[category];
            const commandList = categoryCommands
                .map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`)
                .join('\n');
            
            embed.addFields({
                name: `📋 ${category}`,
                value: commandList,
                inline: false
            });
        });

        embed.setFooter({ 
            text: `Total Commands: ${commands.size}`,
            iconURL: interaction.client.user.displayAvatarURL()
        });

        await interaction.reply({ embeds: [embed] });
    },
};