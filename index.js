const { Client, GatewayIntentBits, Events, ActivityType } = require('discord.js');
const config = require('./config/config');
const logger = require('./utils/logger');
const CommandHandler = require('./src/CommandHandler');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize command handler
client.commandHandler = new CommandHandler();

// When the client is ready, run this code once
client.once(Events.ClientReady, async (readyClient) => {
    logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
    
    // Set bot activity
    client.user.setActivity('music 🎵', { type: ActivityType.Listening });
    
    // Load commands
    await client.commandHandler.loadCommands();
    
    logger.info(`Bot is online and serving ${client.guilds.cache.size} guilds`);
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    logger.info(`Command ${interaction.commandName} used by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);
    
    await client.commandHandler.handleCommand(interaction);
});

// Handle errors
client.on(Events.Error, error => {
    logger.error(`Discord.js error: ${error.message}`);
});

client.on(Events.Warn, warning => {
    logger.warn(`Discord.js warning: ${warning}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});

// Login to Discord
if (!config.token) {
    logger.error('No Discord token provided. Please set DISCORD_TOKEN in your environment variables.');
    process.exit(1);
}

client.login(config.token).catch(error => {
    logger.error(`Failed to login: ${error.message}`);
    process.exit(1);
});