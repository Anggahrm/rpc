const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../config/config');
const MusicSource = require('../utils/MusicSource');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for music on YouTube')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Search query')
                .setRequired(true)),
    category: 'Music',
    
    async execute(interaction) {
        const query = interaction.options.getString('query');

        await interaction.deferReply();

        try {
            const searchResults = await MusicSource.search(query, 5);
            
            if (searchResults.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setDescription('❌ No results found for your search query!');
                
                return interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.music)
                .setTitle('🔍 Search Results')
                .setDescription(`Found ${searchResults.length} results for: **${query}**`)
                .setTimestamp();

            let description = '';
            searchResults.forEach((song, index) => {
                const duration = MusicSource.formatDuration(song.duration);
                const title = song.title.length > 60 ? song.title.substring(0, 60) + '...' : song.title;
                description += `**${index + 1}.** [${title}](${song.url})\n`;
                description += `└ ${duration} • ${song.author}\n\n`;
            });

            embed.setDescription(description);

            // Create select menu for choosing a song
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('search_select')
                .setPlaceholder('Choose a song to add to queue')
                .addOptions(
                    searchResults.map((song, index) => ({
                        label: song.title.length > 100 ? song.title.substring(0, 97) + '...' : song.title,
                        description: `${MusicSource.formatDuration(song.duration)} • ${song.author}`,
                        value: song.url
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.editReply({ 
                embeds: [embed], 
                components: [row] 
            });

            // Listen for select menu interaction
            const filter = (selectInteraction) => {
                return selectInteraction.customId === 'search_select' && 
                       selectInteraction.user.id === interaction.user.id;
            };

            try {
                const selectInteraction = await interaction.followUp({ 
                    content: 'Waiting for your selection...',
                    ephemeral: true 
                });

                const collector = interaction.channel.createMessageComponentCollector({
                    filter,
                    time: 60000,
                    max: 1
                });

                collector.on('collect', async (selectInteraction) => {
                    const selectedUrl = selectInteraction.values[0];
                    
                    // Execute play command with selected URL
                    const playCommand = interaction.client.commandHandler.commands.get('play');
                    if (playCommand) {
                        // Create a mock interaction for the play command
                        const mockInteraction = {
                            ...selectInteraction,
                            options: {
                                getString: (name) => name === 'query' ? selectedUrl : null
                            }
                        };
                        
                        await playCommand.execute(mockInteraction);
                    } else {
                        await selectInteraction.reply({
                            content: 'Play command not found!',
                            ephemeral: true
                        });
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        // Disable the select menu
                        const disabledRow = new ActionRowBuilder().addComponents(
                            selectMenu.setDisabled(true)
                        );
                        
                        await interaction.editReply({ 
                            components: [disabledRow] 
                        });
                    }
                });

            } catch (error) {
                console.error('Error setting up select menu collector:', error);
            }

        } catch (error) {
            console.error('Search error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('❌ Search Error')
                .setDescription('Failed to search for music. Please try again.');

            await interaction.editReply({ embeds: [embed] });
        }
    },
};