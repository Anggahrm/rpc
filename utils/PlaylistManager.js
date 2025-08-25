const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class PlaylistManager {
    constructor() {
        this.playlistDir = path.join(__dirname, '..', 'playlists');
        if (!fs.existsSync(this.playlistDir)) {
            fs.mkdirSync(this.playlistDir, { recursive: true });
        }
    }

    _getPlaylistPath(guildId, playlistName) {
        return path.join(this.playlistDir, `${guildId}_${playlistName}.json`);
    }

    _validatePlaylistName(name) {
        // Remove invalid filename characters
        return name.replace(/[<>:"/\\|?*]/g, '').trim();
    }

    async savePlaylist(guildId, playlistName, songs, createdBy) {
        try {
            const validName = this._validatePlaylistName(playlistName);
            if (!validName) {
                throw new Error('Invalid playlist name');
            }

            const playlist = {
                name: validName,
                guildId: guildId,
                songs: songs.map(song => ({
                    title: song.title,
                    url: song.url,
                    duration: song.duration,
                    thumbnail: song.thumbnail,
                    author: song.author,
                    source: song.source,
                    // Don't save requestedBy as it will be set when loading
                    spotifyName: song.spotifyName,
                    spotifyArtist: song.spotifyArtist,
                    spotifyUrl: song.spotifyUrl
                })),
                createdBy: createdBy.id,
                createdByTag: createdBy.tag,
                createdAt: new Date().toISOString(),
                totalDuration: songs.reduce((total, song) => total + (song.duration || 0), 0)
            };

            const playlistPath = this._getPlaylistPath(guildId, validName);
            fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
            
            logger.info(`Playlist saved: ${validName} for guild ${guildId}`);
            return playlist;
        } catch (error) {
            logger.error(`Failed to save playlist: ${error.message}`);
            throw error;
        }
    }

    async loadPlaylist(guildId, playlistName) {
        try {
            const validName = this._validatePlaylistName(playlistName);
            const playlistPath = this._getPlaylistPath(guildId, validName);
            
            if (!fs.existsSync(playlistPath)) {
                throw new Error('Playlist not found');
            }

            const playlistData = fs.readFileSync(playlistPath, 'utf8');
            const playlist = JSON.parse(playlistData);
            
            logger.info(`Playlist loaded: ${validName} for guild ${guildId}`);
            return playlist;
        } catch (error) {
            logger.error(`Failed to load playlist: ${error.message}`);
            throw error;
        }
    }

    async deletePlaylist(guildId, playlistName, userId) {
        try {
            const validName = this._validatePlaylistName(playlistName);
            const playlistPath = this._getPlaylistPath(guildId, validName);
            
            if (!fs.existsSync(playlistPath)) {
                throw new Error('Playlist not found');
            }

            // Check if user is the creator
            const playlistData = fs.readFileSync(playlistPath, 'utf8');
            const playlist = JSON.parse(playlistData);
            
            if (playlist.createdBy !== userId) {
                throw new Error('You can only delete playlists you created');
            }

            fs.unlinkSync(playlistPath);
            logger.info(`Playlist deleted: ${validName} for guild ${guildId}`);
            return playlist;
        } catch (error) {
            logger.error(`Failed to delete playlist: ${error.message}`);
            throw error;
        }
    }

    async listPlaylists(guildId) {
        try {
            const files = fs.readdirSync(this.playlistDir);
            const guildPlaylists = files
                .filter(file => file.startsWith(`${guildId}_`) && file.endsWith('.json'))
                .map(file => {
                    try {
                        const playlistPath = path.join(this.playlistDir, file);
                        const playlistData = fs.readFileSync(playlistPath, 'utf8');
                        const playlist = JSON.parse(playlistData);
                        return {
                            name: playlist.name,
                            songCount: playlist.songs.length,
                            createdBy: playlist.createdByTag,
                            createdAt: playlist.createdAt,
                            totalDuration: playlist.totalDuration
                        };
                    } catch (error) {
                        logger.warn(`Failed to read playlist file ${file}: ${error.message}`);
                        return null;
                    }
                })
                .filter(playlist => playlist !== null);

            return guildPlaylists;
        } catch (error) {
            logger.error(`Failed to list playlists: ${error.message}`);
            return [];
        }
    }
}

module.exports = new PlaylistManager();