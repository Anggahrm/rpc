require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    prefix: process.env.PREFIX || '!',
    defaultVolume: parseInt(process.env.DEFAULT_VOLUME) || 50,
    
    // Bot settings
    maxQueueSize: 100,
    maxPlaylistSize: 50,
    
    // Colors for embeds
    colors: {
        success: 0x00ff00,
        error: 0xff0000,
        warning: 0xffff00,
        info: 0x0099ff,
        music: 0x9932cc
    }
};