const ytdl = require('ytdl-core');
const { play } = require('play-dl');
const logger = require('./logger');

class MusicSource {
    static async getInfo(url) {
        try {
            // Check if it's a YouTube URL
            if (ytdl.validateURL(url)) {
                return await this.getYouTubeInfo(url);
            }
            
            // Try play-dl for other sources
            const info = await play.video_info(url);
            return {
                title: info.video_details.title,
                url: url,
                duration: info.video_details.durationInSec,
                thumbnail: info.video_details.thumbnails[0]?.url,
                author: info.video_details.channel?.name,
                source: 'play-dl'
            };
        } catch (error) {
            logger.error(`Failed to get info for ${url}: ${error.message}`);
            throw new Error(`Unable to get information for this URL`);
        }
    }

    static async getYouTubeInfo(url) {
        try {
            const info = await ytdl.getInfo(url);
            const videoDetails = info.videoDetails;

            return {
                title: videoDetails.title,
                url: url,
                duration: parseInt(videoDetails.lengthSeconds),
                thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url,
                author: videoDetails.author.name,
                description: videoDetails.shortDescription,
                source: 'youtube'
            };
        } catch (error) {
            logger.error(`Failed to get YouTube info for ${url}: ${error.message}`);
            throw error;
        }
    }

    static async search(query, limit = 5) {
        try {
            const results = await play.search(query, { limit, source: { youtube: 'video' } });
            
            return results.map(video => ({
                title: video.title,
                url: video.url,
                duration: video.durationInSec,
                thumbnail: video.thumbnails[0]?.url,
                author: video.channel?.name,
                source: 'youtube'
            }));
        } catch (error) {
            logger.error(`Failed to search for ${query}: ${error.message}`);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    static createAudioStream(url, options = {}) {
        try {
            if (ytdl.validateURL(url)) {
                return ytdl(url, {
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25,
                    ...options
                });
            } else {
                return play.stream(url, {
                    quality: 2,
                    ...options
                });
            }
        } catch (error) {
            logger.error(`Failed to create audio stream for ${url}: ${error.message}`);
            throw error;
        }
    }

    static formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    static async getRelatedVideos(url, limit = 5) {
        try {
            if (!ytdl.validateURL(url)) {
                return [];
            }

            const info = await ytdl.getInfo(url);
            const videoId = info.videoDetails.videoId;
            
            // Use the video title and artist for related search
            const searchQuery = `${info.videoDetails.title} ${info.videoDetails.author.name}`;
            const results = await this.search(searchQuery, limit + 5); // Get more to filter out the current song
            
            // Filter out the current song and return the requested amount
            return results
                .filter(video => !video.url.includes(videoId))
                .slice(0, limit);
                
        } catch (error) {
            logger.error(`Failed to get related videos for ${url}: ${error.message}`);
            return [];
        }
    }
}

module.exports = MusicSource;