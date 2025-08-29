require('dotenv').config();
const { Client, RichPresence} = require('discord.js-selfbot-v13');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);

  const status = new RichPresence(client)
    .setApplicationId('1380551344515055667')
    .setType('PLAYING')
    .setURL('https://www.youtube.com/watch?v=5icFcPkVzMg') // If you set a URL, it will automatically change to STREAMING type
    .setState('Arcade Game')
    .setName('osu!')
    .setDetails('MariannE - Yooh')
    .setStartTimestamp(Date.now())
    .setAssetsLargeImage('Visual Studio Code') // https://assets.ppy.sh/beatmaps/1550633/covers/list.jpg
    .setAssetsLargeText('Idle')
    .setAssetsSmallImage('1380551344515055667') // https://discord.com/api/v9/oauth2/applications/367827983903490050/assets
    .setAssetsSmallText('click the circles')
    .setPlatform('desktop')
    .addButton('Community', 'https://discord.gg/W9qD2mYXxf');
  
  client.user.setPresence({ activities: [status] });
});

// Check if Discord token is provided
if (!process.env.DISCORD_TOKEN) {
  console.error('Error: DISCORD_TOKEN not found in environment variables.');
  console.error('Please create a .env file and add your Discord token:');
  console.error('DISCORD_TOKEN=your_actual_token_here');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
    
