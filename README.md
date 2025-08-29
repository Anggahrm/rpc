# Discord RPC Client

A Discord Rich Presence client for osu! game status.

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file and replace `your_discord_token_here` with your actual Discord bot token:
   ```
   DISCORD_TOKEN=your_actual_discord_bot_token_here
   ```

## Usage

Run the application:
```bash
npm start
```

Or if you prefer using Bun:
```bash
bun rpc.js
```

**Note**: Make sure you have created the `.env` file with your Discord token before running the application.
