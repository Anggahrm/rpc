const { Events } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const logger = require('../utils/logger');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const client = newState.client;
        
        // Check if bot was disconnected from voice channel
        if (oldState.id === client.user.id && oldState.channel && !newState.channel) {
            const guildId = oldState.guild.id;
            const queueManager = client.queueManager;
            const queue = queueManager.getQueue(guildId);
            
            // Clear queue and cleanup
            if (queue.audioPlayer) {
                queue.audioPlayer.destroy();
            }
            queue.clear();
            queueManager.deleteQueue(guildId);
            
            logger.info(`Bot disconnected from voice channel in guild ${oldState.guild.name}, cleaned up queue`);
            return;
        }

        // Auto-disconnect when alone in voice channel
        if (oldState.channel && oldState.channel.members.has(client.user.id)) {
            const voiceChannel = oldState.channel;
            const botMember = voiceChannel.members.get(client.user.id);
            
            if (botMember) {
                // Count non-bot members
                const humanMembers = voiceChannel.members.filter(member => !member.user.bot);
                
                if (humanMembers.size === 0) {
                    // Bot is alone, disconnect after a delay
                    setTimeout(() => {
                        const connection = getVoiceConnection(voiceChannel.guild.id);
                        if (connection) {
                            const currentHumanMembers = voiceChannel.members.filter(member => !member.user.bot);
                            if (currentHumanMembers.size === 0) {
                                connection.destroy();
                                
                                const queueManager = client.queueManager;
                                const queue = queueManager.getQueue(voiceChannel.guild.id);
                                
                                if (queue.audioPlayer) {
                                    queue.audioPlayer.destroy();
                                }
                                queue.clear();
                                queueManager.deleteQueue(voiceChannel.guild.id);
                                
                                logger.info(`Auto-disconnected from ${voiceChannel.name} in ${voiceChannel.guild.name} (alone in channel)`);
                            }
                        }
                    }, 30000); // 30 seconds delay
                }
            }
        }
    },
};