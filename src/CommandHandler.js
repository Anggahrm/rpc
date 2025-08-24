const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class CommandHandler {
    constructor() {
        this.commands = new Collection();
        this.cooldowns = new Collection();
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, '..', 'commands');
        
        if (!fs.existsSync(commandsPath)) {
            fs.mkdirSync(commandsPath, { recursive: true });
            logger.info('Created commands directory');
            return;
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);
                
                if (command.data && command.execute) {
                    this.commands.set(command.data.name, command);
                    logger.info(`Loaded command: ${command.data.name}`);
                } else {
                    logger.warn(`Command ${file} is missing required properties`);
                }
            } catch (error) {
                logger.error(`Error loading command ${file}: ${error.message}`);
            }
        }

        logger.info(`Loaded ${this.commands.size} commands`);
    }

    async handleCommand(interaction) {
        const command = this.commands.get(interaction.commandName);

        if (!command) {
            logger.warn(`Unknown command: ${interaction.commandName}`);
            return;
        }

        // Check cooldown
        if (!this.cooldowns.has(command.data.name)) {
            this.cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = this.cooldowns.get(command.data.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({
                    content: `Please wait ${timeLeft.toFixed(1)} more seconds before using the \`${command.data.name}\` command again.`,
                    ephemeral: true
                });
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(`Error executing command ${command.data.name}: ${error.message}`);
            
            const reply = {
                content: 'There was an error while executing this command!',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    }

    getCommands() {
        return Array.from(this.commands.values()).map(command => command.data);
    }
}

module.exports = CommandHandler;