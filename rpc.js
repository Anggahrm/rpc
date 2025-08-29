require('dotenv').config();
const os = require('node:os');
const Discord = require('discord.js-selfbot-v13');
const client = new Discord.Client({
  readyStatus: false,
  checkUpdate: false,
});

const fileNames = [
  'main.js',
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

let startTimestamp;
let extendURL;
let presenceTimer;

function getRandomFile() {
  return fileNames[Math.floor(Math.random() * fileNames.length)];
}

function getRandomInterval() {
  return (Math.floor(Math.random() * 60) + 1) * 60 * 1000;
}

async function updatePresence() {
  const currentFile = getRandomFile();
  console.log(`Now editing: ${currentFile}`);
  
  const presence = new Discord.RichPresence()
    .setApplicationId('1380551344515055667')
    .setType('PLAYING')
    .setState('Workspace: ZumyNext')
    .setName('Visual Studio Code')
    .setDetails(`Editing ${currentFile}`)
    .setStartTimestamp(startTimestamp)
    .setAssetsLargeImage(extendURL[0].external_asset_path)
    .setAssetsLargeText('JavaScript')
    .setAssetsSmallImage('https://cdn.discordapp.com/emojis/1410862047998246942.webp')
    .setAssetsSmallText('Visual Studio Code')
    .setPlatform('desktop')
    .addButton('Community', 'https://discord.gg/W9qD2mYXxf');
  
  client.user.setPresence({ activities: [presence], status: "idle", });
  
  const nextInterval = getRandomInterval();
  console.log(`Next update in ${nextInterval / 60000} minutes`);
  
  if (presenceTimer) {
    clearTimeout(presenceTimer);
  }
  presenceTimer = setTimeout(updatePresence, nextInterval);
}

client.on('ready', async () => {
  console.log(`🔗 Logged in as: ${client.user.username}`);
  
  startTimestamp = Date.now() - (os.uptime() * 1000);
  extendURL = await Discord.RichPresence.getExternal(
    client,
    '1380551344515055667',
    'https://files.catbox.moe/nawqku.png',
  );

  updatePresence();
});

if (!process.env.DISCORD_TOKEN) {
  console.error('Error: DISCORD_TOKEN not found in environment variables.');
  process.exit(1);
}

process.on('exit', () => {
  if (presenceTimer) {
    clearTimeout(presenceTimer);
  }
});

client.login(process.env.DISCORD_TOKEN);
    
