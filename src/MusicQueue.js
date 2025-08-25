const { Collection } = require('discord.js');

class MusicQueue {
    constructor(guildId) {
        this.guildId = guildId;
        this.songs = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.volume = 50;
        this.repeat = 'none'; // 'none', 'song', 'queue'
        this.voiceConnection = null;
        this.audioPlayer = null;
        this.currentSeekTime = 0;
        this.playbackSpeed = 1.0; // 1.0 = normal speed
        this.audioFilters = {
            bassboost: false,
            equalizer: 'none' // 'none', 'pop', 'rock', 'jazz', 'classical'
        };
        this.autoplay = false;
    }

    // Add song to queue
    addSong(song) {
        this.songs.push(song);
        return this.songs.length;
    }

    // Remove song by index
    removeSong(index) {
        if (index < 0 || index >= this.songs.length) {
            return null;
        }
        return this.songs.splice(index, 1)[0];
    }

    // Get current song
    getCurrentSong() {
        return this.songs[this.currentIndex] || null;
    }

    // Skip to next song
    skipToNext() {
        if (this.repeat === 'song') {
            return this.getCurrentSong();
        }

        this.currentIndex++;
        
        if (this.currentIndex >= this.songs.length) {
            if (this.repeat === 'queue') {
                this.currentIndex = 0;
            } else {
                return null; // End of queue
            }
        }

        return this.getCurrentSong();
    }

    // Skip to previous song
    skipToPrevious() {
        this.currentIndex--;
        
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1;
        }

        return this.getCurrentSong();
    }

    // Clear queue
    clear() {
        this.songs = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
    }

    // Shuffle queue
    shuffle() {
        const currentSong = this.getCurrentSong();
        
        // Remove current song temporarily
        if (currentSong) {
            this.songs.splice(this.currentIndex, 1);
        }

        // Shuffle remaining songs
        for (let i = this.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
        }

        // Put current song back at the beginning
        if (currentSong) {
            this.songs.unshift(currentSong);
            this.currentIndex = 0;
        }
    }

    // Move song from one position to another
    moveSong(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.songs.length || 
            toIndex < 0 || toIndex >= this.songs.length) {
            return null;
        }

        // Don't allow moving the currently playing song
        if (fromIndex === this.currentIndex) {
            return null;
        }

        const song = this.songs.splice(fromIndex, 1)[0];
        this.songs.splice(toIndex, 0, song);

        // Adjust current index if necessary
        if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
            this.currentIndex--;
        } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
            this.currentIndex++;
        }

        return song;
    }

    // Get queue display info
    getQueueInfo(page = 1, itemsPerPage = 10) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const queueSlice = this.songs.slice(startIndex, endIndex);

        return {
            songs: queueSlice.map((song, index) => ({
                ...song,
                position: startIndex + index,
                isCurrent: startIndex + index === this.currentIndex
            })),
            totalPages: Math.ceil(this.songs.length / itemsPerPage),
            currentPage: page,
            totalSongs: this.songs.length,
            hasNext: endIndex < this.songs.length,
            hasPrevious: startIndex > 0
        };
    }
}

class QueueManager {
    constructor() {
        this.queues = new Collection();
    }

    // Get or create queue for a guild
    getQueue(guildId) {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, new MusicQueue(guildId));
        }
        return this.queues.get(guildId);
    }

    // Delete queue for a guild
    deleteQueue(guildId) {
        return this.queues.delete(guildId);
    }

    // Get all active queues
    getActiveQueues() {
        return this.queues.filter(queue => queue.songs.length > 0);
    }
}

module.exports = { MusicQueue, QueueManager };