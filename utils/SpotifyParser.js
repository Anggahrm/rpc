const SpotifyWebApi = require('spotify-web-api-node');
const MusicSource = require('./MusicSource');
const logger = require('./logger');

class SpotifyParser {
    constructor() {
        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });
        this.tokenExpiry = null;
    }

    async ensureToken() {
        if (!this.tokenExpiry || Date.now() >= this.tokenExpiry) {
            try {
                const data = await this.spotifyApi.clientCredentialsGrant();
                this.spotifyApi.setAccessToken(data.body.access_token);
                this.tokenExpiry = Date.now() + (data.body.expires_in * 1000) - 60000; // Refresh 1 min early
                logger.info('Spotify access token refreshed');
            } catch (error) {
                logger.error(`Failed to get Spotify access token: ${error.message}`);
                throw new Error('Spotify service unavailable');
            }
        }
    }

    extractPlaylistId(url) {
        const regex = /spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    extractTrackId(url) {
        const regex = /spotify\.com\/track\/([a-zA-Z0-9]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    async getPlaylistTracks(playlistId, limit = 50) {
        await this.ensureToken();
        
        try {
            const data = await this.spotifyApi.getPlaylistTracks(playlistId, {
                limit: limit,
                fields: 'items(track(name,artists,duration_ms,external_urls))'
            });

            const tracks = data.body.items.map(item => ({
                name: item.track.name,
                artist: item.track.artists[0]?.name || 'Unknown Artist',
                duration: Math.floor(item.track.duration_ms / 1000),
                spotifyUrl: item.track.external_urls?.spotify,
                searchQuery: `${item.track.artists[0]?.name || ''} ${item.track.name}`.trim()
            }));

            return tracks;
        } catch (error) {
            logger.error(`Failed to get Spotify playlist tracks: ${error.message}`);
            throw new Error('Failed to fetch Spotify playlist');
        }
    }

    async getTrackInfo(trackId) {
        await this.ensureToken();
        
        try {
            const data = await this.spotifyApi.getTrack(trackId);
            const track = data.body;

            return {
                name: track.name,
                artist: track.artists[0]?.name || 'Unknown Artist',
                duration: Math.floor(track.duration_ms / 1000),
                spotifyUrl: track.external_urls?.spotify,
                searchQuery: `${track.artists[0]?.name || ''} ${track.name}`.trim()
            };
        } catch (error) {
            logger.error(`Failed to get Spotify track info: ${error.message}`);
            throw new Error('Failed to fetch Spotify track');
        }
    }

    async convertToYouTube(spotifyTrack) {
        try {
            const searchResults = await MusicSource.search(spotifyTrack.searchQuery, 1);
            if (searchResults.length === 0) {
                throw new Error('No YouTube equivalent found');
            }

            const youtubeTrack = searchResults[0];
            // Add Spotify metadata
            youtubeTrack.spotifyName = spotifyTrack.name;
            youtubeTrack.spotifyArtist = spotifyTrack.artist;
            youtubeTrack.spotifyUrl = spotifyTrack.spotifyUrl;
            
            return youtubeTrack;
        } catch (error) {
            logger.error(`Failed to convert Spotify track to YouTube: ${error.message}`);
            throw error;
        }
    }

    async parsePlaylist(url) {
        const playlistId = this.extractPlaylistId(url);
        if (!playlistId) {
            throw new Error('Invalid Spotify playlist URL');
        }

        const tracks = await this.getPlaylistTracks(playlistId);
        const youtubeTracks = [];
        const failed = [];

        for (const track of tracks) {
            try {
                const youtubeTrack = await this.convertToYouTube(track);
                youtubeTracks.push(youtubeTrack);
            } catch (error) {
                failed.push(track.name);
                logger.warn(`Failed to convert track: ${track.name} - ${error.message}`);
            }
        }

        return {
            success: youtubeTracks,
            failed: failed,
            total: tracks.length
        };
    }

    isSpotifyUrl(url) {
        return url.includes('spotify.com/playlist/') || url.includes('spotify.com/track/');
    }
}

module.exports = new SpotifyParser();