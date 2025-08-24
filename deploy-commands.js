const { REST, Routes } = require('discord.js');
const config = require('./config/config');
const CommandHandler = require('./src/CommandHandler');
const logger = require('./utils/logger');

async function deployCommands() {
    if (!config.token || !config.clientId) {
        logger.error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables');
        process.exit(1);
    }

    try {
        logger.info('Started refreshing application (/) commands.');

        // Load commands
        const commandHandler = new CommandHandler();
        await commandHandler.loadCommands();
        
        const commands = commandHandler.getCommands();
        
        logger.info(`Deploying ${commands.length} commands...`);

        // Construct and prepare an instance of the REST module
        const rest = new REST({ version: '10' }).setToken(config.token);

        // Deploy commands globally
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        logger.error(`Error deploying commands: ${error.message}`);
    }
}

deployCommands();