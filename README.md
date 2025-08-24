# Discord Music Streaming Bot

Bot Discord untuk streaming musik dengan fitur lengkap.

## 📋 Status Pengembangan

✅ **Phase 1: Setup & Environment** - COMPLETED
- ✅ Project initialization with npm
- ✅ Folder structure setup
- ✅ Dependencies installed
- ✅ Configuration system
- ✅ Environment variables setup

✅ **Phase 2: Core Bot Functionality** - COMPLETED
- ✅ Main bot file (index.js)
- ✅ Bot login with token
- ✅ Event listeners (ready, interactionCreate)
- ✅ Command handler system
- ✅ Error handling and logging
- ✅ Slash commands registration
- ✅ Base command structure
- ✅ Basic commands (ping, help, join, leave)

✅ **Phase 3: Music Streaming Core Features** - COMPLETED
- ✅ Voice connection functionality (join/leave)
- ✅ Music queue system with advanced management
- ✅ Basic music commands (play, stop, pause, resume, skip, queue, nowplaying)

🚧 **Phase 4: Advanced Music Features** - IN PROGRESS
- ✅ YouTube streaming implementation
- ✅ Search functionality
- ✅ Volume control
- 🚧 Advanced queue management
- 🚧 Playlist support

## 🎯 Current Features

- 🤖 **Slash Commands**: Modern Discord slash command support
- 🎵 **Music Streaming**: Play music from YouTube with URL or search
- 🔍 **Interactive Search**: Search YouTube with interactive song selection
- 📋 **Queue Management**: Add, view, and manage music queue with pagination
- ⏯️ **Playback Controls**: Play, pause, resume, skip, stop
- 🔊 **Volume Control**: Adjust playback volume (0-100%)
- 📺 **Rich Embeds**: Beautiful embeds with song information and thumbnails
- 🏓 **Ping Command**: Test bot responsiveness
- ❓ **Help Command**: Categorized command listing
- 🔊 **Voice Connection**: Join and leave voice channels
- 📝 **Logging System**: Comprehensive logging with file output
- 🛡️ **Error Handling**: Robust error handling and graceful degradation
- ⏱️ **Cooldown System**: Command cooldown protection

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18.0.0 or higher
- A Discord application and bot token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rpc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Discord bot token:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_bot_client_id_here
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

### Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token and add it to your `.env` file
5. Copy the Application ID and add it as CLIENT_ID in your `.env` file
6. Go to "OAuth2" > "URL Generator"
7. Select "bot" and "applications.commands" scopes
8. Select necessary bot permissions (Send Messages, Connect, Speak, Use Slash Commands)
9. Use the generated URL to invite the bot to your server

## 🎵 Available Commands

### General Commands
- `/ping` - Check bot latency and responsiveness
- `/help` - Show all available commands

### Music Commands
- `/play <query>` - Play music from YouTube URL or search query
- `/search <query>` - Search for music on YouTube (interactive selection)
- `/pause` - Pause the current song
- `/resume` - Resume the paused song
- `/skip` - Skip to the next song
- `/stop` - Stop music and clear the queue
- `/queue [page]` - Show the current music queue
- `/nowplaying` - Show information about the currently playing song
- `/volume [level]` - Set or view the current volume (0-100)

### Voice Commands
- `/join` - Join your voice channel
- `/leave` - Leave the current voice channel

## 📚 Documentation

- [TODO List](./TODO.md) - Complete development roadmap
- [Configuration](./config/config.js) - Bot configuration options

## 🗂️ Project Structure

```
rpc/
├── commands/          # Slash command files
├── config/           # Configuration files
├── events/           # Discord event handlers (future)
├── src/              # Core bot classes
├── utils/            # Utility functions
├── logs/             # Log files (auto-generated)
├── index.js          # Main bot file
├── deploy-commands.js # Command deployment script
└── package.json      # Project dependencies
```

## 🤝 Contributing

1. Check the [TODO.md](./TODO.md) for available tasks
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## 📝 License

ISC License