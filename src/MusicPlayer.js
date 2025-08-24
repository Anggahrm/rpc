const { 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus,
    joinVoiceChannel
} = require('@discordjs/voice');
const MusicSource = require('../utils/MusicSource');
const logger = require('../utils/logger');

class MusicPlayer {
    constructor(queue) {
        this.queue = queue;
        this.audioPlayer = createAudioPlayer();
        this.currentResource = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
            this.queue.isPlaying = true;
            this.queue.isPaused = false;
            logger.info(`Started playing: ${this.queue.getCurrentSong()?.title}`);
        });

        this.audioPlayer.on(AudioPlayerStatus.Paused, () => {
            this.queue.isPaused = true;
            logger.info(`Paused: ${this.queue.getCurrentSong()?.title}`);
        });

        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            this.queue.isPlaying = false;
            this.queue.isPaused = false;
            
            // Auto play next song
            this.playNext();
        });

        this.audioPlayer.on('error', error => {
            logger.error(`Audio player error: ${error.message}`);
            this.queue.isPlaying = false;
            this.queue.isPaused = false;
            
            // Try to play next song on error
            this.playNext();
        });
    }

    async play(song) {
        try {
            logger.info(`Attempting to play: ${song.title}`);
            
            const stream = MusicSource.createAudioStream(song.url);
            this.currentResource = createAudioResource(stream, {
                inlineVolume: true
            });

            // Set volume
            this.currentResource.volume?.setVolume(this.queue.volume / 100);

            this.audioPlayer.play(this.currentResource);

            // Subscribe the connection to the audio player
            if (this.queue.voiceConnection) {
                this.queue.voiceConnection.subscribe(this.audioPlayer);
            }

            return true;
        } catch (error) {
            logger.error(`Failed to play ${song.title}: ${error.message}`);
            throw error;
        }
    }

    async playNext() {
        const nextSong = this.queue.skipToNext();
        
        if (nextSong) {
            try {
                await this.play(nextSong);
            } catch (error) {
                logger.error(`Failed to play next song, skipping: ${error.message}`);
                // Try the next one
                this.playNext();
            }
        } else {
            // End of queue
            this.queue.isPlaying = false;
            logger.info(`Queue finished for guild ${this.queue.guildId}`);
        }
    }

    pause() {
        if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
            this.audioPlayer.pause();
            return true;
        }
        return false;
    }

    resume() {
        if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            this.audioPlayer.unpause();
            return true;
        }
        return false;
    }

    stop() {
        this.audioPlayer.stop();
        this.queue.isPlaying = false;
        this.queue.isPaused = false;
    }

    setVolume(volume) {
        this.queue.volume = Math.max(0, Math.min(100, volume));
        if (this.currentResource?.volume) {
            this.currentResource.volume.setVolume(this.queue.volume / 100);
        }
    }

    getVolume() {
        return this.queue.volume;
    }

    destroy() {
        this.audioPlayer.stop();
        this.currentResource = null;
    }
}

module.exports = MusicPlayer;