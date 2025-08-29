require('dotenv').config();
const { Client, RichPresence} = require('discord.js-selfbot-v13');
const client = new Client();

// Configuration constants for performance optimization
const CONFIG = {
  MIN_INTERVAL_MINUTES: 5,  // Reduced from 1 to prevent excessive updates
  MAX_INTERVAL_MINUTES: 30, // Reduced from 60 to maintain activity appearance
  UPDATE_TOLERANCE_MS: 1000, // Prevent update clustering
};

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

// Performance optimization: Cache random selections to reduce CPU cycles
let lastFileIndex = -1;
let lastUpdateTime = 0;
let updateTimeoutId = null;

function getRandomFile() {
  // Ensure we don't repeat the same file consecutively
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * fileNames.length);
  } while (newIndex === lastFileIndex && fileNames.length > 1);
  
  lastFileIndex = newIndex;
  return fileNames[newIndex];
}

function getRandomInterval() {
  // Optimized interval calculation with better distribution
  const minMs = CONFIG.MIN_INTERVAL_MINUTES * 60 * 1000;
  const maxMs = CONFIG.MAX_INTERVAL_MINUTES * 60 * 1000;
  const interval = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  
  // Prevent clustering by ensuring minimum time between updates
  const timeSinceLastUpdate = Date.now() - lastUpdateTime;
  if (timeSinceLastUpdate < CONFIG.UPDATE_TOLERANCE_MS) {
    return interval + CONFIG.UPDATE_TOLERANCE_MS;
  }
  
  return interval;
}

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  
  // Performance optimization: Cache external URL to avoid repeated API calls
  let cachedExternalAsset = null;
  try {
    const getExtendURL = await RichPresence.getExternal(
      client,
      '1380551344515055667',
      'https://files.catbox.moe/nawqku.png',
    );
    cachedExternalAsset = getExtendURL[0].external_asset_path;
    console.log('External asset cached successfully');
  } catch (error) {
    console.warn('Failed to cache external asset, will use fallback:', error.message);
    cachedExternalAsset = 'https://files.catbox.moe/nawqku.png'; // Fallback
  }

  // Base presence template for reuse (performance optimization)
  const basePresenceConfig = {
    applicationId: '1380551344515055667',
    type: 'PLAYING',
    state: 'Workspace: ZumyNext',
    name: 'Visual Studio Code',
    assetsLargeText: 'JavaScript',
    assetsSmallImage: 'https://cdn.discordapp.com/emojis/1410862047998246942.webp',
    assetsSmallText: 'Visual Studio Code',
    platform: 'desktop',
    button: { label: 'Community', url: 'https://discord.gg/W9qD2mYXxf' }
  };

  async function updatePresence() {
    try {
      // Clear any existing timeout to prevent memory leaks
      if (updateTimeoutId) {
        clearTimeout(updateTimeoutId);
        updateTimeoutId = null;
      }
      
      const currentFile = getRandomFile();
      const currentTime = Date.now();
      lastUpdateTime = currentTime;
      
      console.log(`[${new Date(currentTime).toISOString()}] Now editing: ${currentFile}`);
      
      // Reuse base configuration to reduce object creation overhead
      const status = new RichPresence(client)
        .setApplicationId(basePresenceConfig.applicationId)
        .setType(basePresenceConfig.type)
        .setState(basePresenceConfig.state)
        .setName(basePresenceConfig.name)
        .setDetails(`Editing ${currentFile}`)
        .setStartTimestamp(currentTime)
        .setAssetsLargeImage(cachedExternalAsset)
        .setAssetsLargeText(basePresenceConfig.assetsLargeText)
        .setAssetsSmallImage(basePresenceConfig.assetsSmallImage)
        .setAssetsSmallText(basePresenceConfig.assetsSmallText)
        .setPlatform(basePresenceConfig.platform)
        .addButton(basePresenceConfig.button.label, basePresenceConfig.button.url);
      
      await client.user.setPresence({ activities: [status] });
      
      const nextInterval = getRandomInterval();
      console.log(`Next update in ${(nextInterval / 60000).toFixed(1)} minutes`);
      
      // Store timeout ID for proper cleanup
      updateTimeoutId = setTimeout(updatePresence, nextInterval);
      
    } catch (error) {
      console.error('Error updating presence:', error.message);
      // Retry with exponential backoff on error
      const retryInterval = Math.min(30000, 5000 * Math.pow(2, Math.floor(Math.random() * 3)));
      console.log(`Retrying in ${retryInterval / 1000} seconds...`);
      updateTimeoutId = setTimeout(updatePresence, retryInterval);
    }
  }

  // Graceful shutdown handling
  const cleanup = () => {
    console.log('\nShutting down gracefully...');
    if (updateTimeoutId) {
      clearTimeout(updateTimeoutId);
      console.log('Cleared pending update timeout');
    }
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Initial presence update
  updatePresence();
});

if (!process.env.DISCORD_TOKEN) {
  console.error('Error: DISCORD_TOKEN not found in environment variables.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
    
