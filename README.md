# Discord RPC Client

An optimized Discord Custom Rich Presence client with performance improvements to reduce CPU usage.

## Performance Optimizations

This version includes several optimizations to address CPU usage fluctuations:

- **Reduced Update Frequency**: Update intervals changed from 1-60 minutes to 5-30 minutes to prevent excessive API calls
- **Asset Caching**: External Discord assets are cached on startup to avoid repeated API requests
- **Memory Leak Prevention**: Proper cleanup of setTimeout and presence objects
- **Error Handling**: Graceful error handling with exponential backoff retry logic
- **Graceful Shutdown**: Proper cleanup on SIGINT/SIGTERM signals

## Setup

1. Clone this repository
2. Install Node.js (version 16 or higher)
3. Install dependencies:
   ```bash
   npm install
   ```

4. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```

5. Edit `.env` file and replace `your_discord_token_here` with your actual Discord token:
   ```
   DISCORD_TOKEN=your_actual_discord_token_here
   ```

## Usage

Run the application:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

**Note**: Make sure you have created the `.env` file with your Discord token before running the application.

## Performance Notes

- CPU usage should now be more stable, typically under 1-2% during normal operation
- Update intervals are optimized to reduce API call frequency while maintaining presence activity
- The application includes proper cleanup mechanisms to prevent memory leaks
- Automatic retry with backoff on connection errors
