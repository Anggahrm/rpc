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

    async play(song, seekTime = 0) {
        try {
            logger.info(`Attempting to play: ${song.title}${seekTime > 0 ? ` from ${seekTime}s` : ''}`);
            
            const streamOptions = {};
            if (seekTime > 0) {
                streamOptions.seek = seekTime;
            }
            
            // Apply audio filters
            const audioOptions = this._buildAudioOptions();
            
            const stream = MusicSource.createAudioStream(song.url, { ...streamOptions, ...audioOptions });
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

            // Track seek time if provided
            if (seekTime > 0) {
                this.queue.currentSeekTime = seekTime;
            } else {
                this.queue.currentSeekTime = 0;
            }

            return true;
        } catch (error) {
            logger.error(`Failed to play ${song.title}: ${error.message}`);
            throw error;
        }
    }

    async seek(timeInSeconds) {
        const currentSong = this.queue.getCurrentSong();
        if (!currentSong) {
            throw new Error('No song is currently playing');
        }

        if (timeInSeconds < 0 || timeInSeconds >= currentSong.duration) {
            throw new Error(`Seek time must be between 0 and ${currentSong.duration} seconds`);
        }

        // Stop current playback and restart at the specified time
        this.audioPlayer.stop();
        await this.play(currentSong, timeInSeconds);
        
        return timeInSeconds;
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
            // End of queue - check if autoplay is enabled
            if (this.queue.autoplay && this.queue.songs.length > 0) {
                try {
                    await this._addAutoplayTracks();
                    // Try to play the next song again
                    const autoplaySong = this.queue.skipToNext();
                    if (autoplaySong) {
                        await this.play(autoplaySong);
                        return;
                    }
                } catch (error) {
                    logger.error(`Autoplay failed: ${error.message}`);
                }
            }
            
            // End of queue
            this.queue.isPlaying = false;
            logger.info(`Queue finished for guild ${this.queue.guildId}`);
        }
    }

    async _addAutoplayTracks() {
        const MusicSource = require('../utils/MusicSource');
        
        // Get the last played song for related recommendations
        const lastSong = this.queue.songs[this.queue.songs.length - 1];
        if (!lastSong) return;

        try {
            const relatedTracks = await MusicSource.getRelatedVideos(lastSong.url, 3);
            
            for (const track of relatedTracks) {
                track.requestedBy = 'Autoplay';
                track.isAutoplay = true;
                this.queue.addSong(track);
            }
            
            logger.info(`Added ${relatedTracks.length} autoplay tracks to queue`);
        } catch (error) {
            logger.error(`Failed to add autoplay tracks: ${error.message}`);
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

    _buildAudioOptions() {
        const options = {};
        
        // Speed adjustment
        if (this.queue.playbackSpeed !== 1.0) {
            options.filter = [`atempo=${this.queue.playbackSpeed}`];
        }
        
        // Bass boost
        if (this.queue.audioFilters.bassboost) {
            const bassFilter = 'bass=g=10';
            options.filter = options.filter ? [...options.filter, bassFilter] : [bassFilter];
        }
        
        // Equalizer presets
        if (this.queue.audioFilters.equalizer !== 'none') {
            const eqFilter = this._getEqualizerFilter(this.queue.audioFilters.equalizer);
            if (eqFilter) {
                options.filter = options.filter ? [...options.filter, eqFilter] : [eqFilter];
            }
        }
        
        return options;
    }

    _getEqualizerFilter(preset) {
        const presets = {
            pop: 'equalizer=f=1000:width_type=h:width=200:g=2:f=2000:width_type=h:width=200:g=4',
            rock: 'equalizer=f=100:width_type=h:width=200:g=4:f=1000:width_type=h:width=200:g=-2:f=4000:width_type=h:width=200:g=6',
            jazz: 'equalizer=f=500:width_type=h:width=200:g=3:f=1500:width_type=h:width=200:g=1:f=3000:width_type=h:width=200:g=2',
            classical: 'equalizer=f=100:width_type=h:width=200:g=2:f=1000:width_type=h:width=200:g=-1:f=3000:width_type=h:width=200:g=3'
        };
        return presets[preset] || null;
    }

    async seek(timeInSeconds) {
        const currentSong = this.queue.getCurrentSong();
        if (!currentSong) {
            throw new Error('No song is currently playing');
        }

        if (timeInSeconds < 0 || timeInSeconds >= currentSong.duration) {
            throw new Error(`Seek time must be between 0 and ${currentSong.duration} seconds`);
        }

        // Stop current playback and restart at the specified time
        this.audioPlayer.stop();
        await this.play(currentSong, timeInSeconds);
        
        return timeInSeconds;
    }

    async setSpeed(speed) {
        if (speed < 0.25 || speed > 2.0) {
            throw new Error('Speed must be between 0.25x and 2.0x');
        }

        this.queue.playbackSpeed = speed;
        
        // If something is currently playing, restart with new speed
        if (this.queue.isPlaying) {
            const currentSong = this.queue.getCurrentSong();
            if (currentSong) {
                this.audioPlayer.stop();
                await this.play(currentSong, this.queue.currentSeekTime);
            }
        }

        return speed;
    }

    async setBassBoost(enabled) {
        this.queue.audioFilters.bassboost = enabled;
        
        // If something is currently playing, restart with new filter
        if (this.queue.isPlaying) {
            const currentSong = this.queue.getCurrentSong();
            if (currentSong) {
                this.audioPlayer.stop();
                await this.play(currentSong, this.queue.currentSeekTime);
            }
        }

        return enabled;
    }

    async setEqualizer(preset) {
        const validPresets = ['none', 'pop', 'rock', 'jazz', 'classical'];
        if (!validPresets.includes(preset)) {
            throw new Error(`Invalid equalizer preset. Valid options: ${validPresets.join(', ')}`);
        }

        this.queue.audioFilters.equalizer = preset;
        
        // If something is currently playing, restart with new filter
        if (this.queue.isPlaying) {
            const currentSong = this.queue.getCurrentSong();
            if (currentSong) {
                this.audioPlayer.stop();
                await this.play(currentSong, this.queue.currentSeekTime);
            }
        }

        return preset;
    }
}

module.exports = MusicPlayer;