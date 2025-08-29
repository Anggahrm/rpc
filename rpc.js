require('dotenv').config();
const { Client, RichPresence} = require('discord.js-selfbot-v13');
const client = new Client();

const fileNames = [
  'server.js',
  'index.js', 
  'config.js',
  'test.js',
  'lib/baileys.js',
  'lib/converter.js',
  'lib/functions.js',
  'lib/print.js',
  'lib/simple.js'
];

function getRandomFile() {
  return fileNames[Math.floor(Math.random() * fileNames.length)];
}

function getRandomInterval() {
  return (Math.floor(Math.random() * 60) + 1) * 60 * 1000;
}

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  const getExtendURL = await RichPresence.getExternal(
    client,
    '1380551344515055667',
    'https://files.catbox.moe/nawqku.png',
  );

  async function updatePresence() {
    const currentFile = getRandomFile();
    console.log(`Now editing: ${currentFile}`);
    
    const status = new RichPresence(client)
      .setApplicationId('1380551344515055667')
      .setType('PLAYING')
      .setState('Workspace: ZumyNext')
      .setName('Visual Studio Code')
      .setDetails(`Editing ${currentFile}`)
      .setStartTimestamp(Date.now())
      .setAssetsLargeImage(getExtendURL[0].external_asset_path)
      .setAssetsLargeText('JavaScript')
      .setAssetsSmallImage('https://cdn.discordapp.com/emojis/1410862047998246942.webp')
      .setAssetsSmallText('Visual Studio Code')
      .setPlatform('desktop')
      .addButton('Community', 'https://discord.gg/W9qD2mYXxf');
    
    client.user.setPresence({ activities: [status] });
    
    const nextInterval = getRandomInterval();
    console.log(`Next update in ${nextInterval / 60000} minutes`);
    setTimeout(updatePresence, nextInterval);
  }

  updatePresence();
});

if (!process.env.DISCORD_TOKEN) {
  console.error('Error: DISCORD_TOKEN not found in environment variables.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
    
