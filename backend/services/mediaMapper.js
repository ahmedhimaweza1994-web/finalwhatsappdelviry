const path = require('path');
const fs = require('fs').promises;
const mime = require('mime-types');

/**
 * Media Mapper Service
 * Maps media filenames mentioned in chat to actual extracted files
 */

class MediaMapper {
    /**
     * Map media files to messages
     * @param {Array} messages - Parsed messages with mediaFilename
     * @param {Array} mediaFiles - List of extracted media file paths
     */
    async mapMedia(messages, mediaFiles) {
        // Create a lookup map of media files by filename
        const mediaLookup = new Map();

        for (const filePath of mediaFiles) {
            const filename = path.basename(filePath);
            const normalizedName = filename.toLowerCase();

            // Store both exact and normalized versions
            if (!mediaLookup.has(normalizedName)) {
                mediaLookup.set(normalizedName, []);
            }
            mediaLookup.get(normalizedName).push(filePath);
        }

        const mappedMessages = [];

        for (const message of messages) {
            const mappedMessage = { ...message };

            if (message.mediaFilename) {
                // Try to find matching media file
                const matchedFile = this.findMatchingFile(
                    message.mediaFilename,
                    mediaLookup,
                    mediaFiles
                );

                if (matchedFile) {
                    mappedMessage.mediaPath = matchedFile;
                    mappedMessage.mimeType = mime.lookup(matchedFile) || 'application/octet-stream';

                    // Get file size
                    try {
                        const stats = await fs.stat(matchedFile);
                        mappedMessage.mediaSize = stats.size;
                    } catch (error) {
                        console.error(`Failed to get file size for ${matchedFile}:`, error);
                    }
                } else {
                    // Media file not found
                    mappedMessage.mediaMissing = true;
                    console.warn(`Media file not found: ${message.mediaFilename}`);
                }
            }

            mappedMessages.push(mappedMessage);
        }

        return mappedMessages;
    }

    /**
     * Find matching media file using fuzzy matching
     */
    findMatchingFile(mediaFilename, mediaLookup, allMediaFiles) {
        const normalizedSearch = mediaFilename.toLowerCase();

        // Exact match
        if (mediaLookup.has(normalizedSearch)) {
            return mediaLookup.get(normalizedSearch)[0];
        }

        // Try without extension
        const nameWithoutExt = path.parse(mediaFilename).name.toLowerCase();

        // Fuzzy search - look for files containing the name
        for (const filePath of allMediaFiles) {
            const filename = path.basename(filePath).toLowerCase();
            const filenameWithoutExt = path.parse(filename).name.toLowerCase();

            // Check if filenames match (with or without extension)
            if (filename === normalizedSearch ||
                filenameWithoutExt === nameWithoutExt ||
                filename.includes(normalizedSearch) ||
                normalizedSearch.includes(filenameWithoutExt)) {
                return filePath;
            }
        }

        // WhatsApp generic patterns (IMG-YYYYMMDD-WAXXXX.jpg)
        // Try to match by pattern
        const whatsappPattern = /^(IMG|VID|AUD|PTT|DOC)-(\d+)-WA(\d+)/i;
        const searchMatch = mediaFilename.match(whatsappPattern);

        if (searchMatch) {
            for (const filePath of allMediaFiles) {
                const filename = path.basename(filePath);
                const fileMatch = filename.match(whatsappPattern);

                if (fileMatch &&
                    fileMatch[1] === searchMatch[1] &&
                    fileMatch[2] === searchMatch[2]) {
                    return filePath;
                }
            }
        }

        return null;
    }

    /**
     * Organize media files by type
     */
    categorizeMedia(mediaFiles) {
        const categories = {
            images: [],
            videos: [],
            audio: [],
            documents: []
        };

        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const videoExts = ['mp4', 'avi', 'mov', '3gp', 'mkv'];
        const audioExts = ['opus', 'mp3', 'm4a', 'ogg', 'aac'];

        for (const file of mediaFiles) {
            const ext = path.extname(file).toLowerCase().substring(1);

            if (imageExts.includes(ext)) {
                categories.images.push(file);
            } else if (videoExts.includes(ext)) {
                categories.videos.push(file);
            } else if (audioExts.includes(ext)) {
                categories.audio.push(file);
            } else {
                categories.documents.push(file);
            }
        }

        return categories;
    }

    /**
     * Generate unique storage path for media file
     */
    generateStoragePath(userId, chatId, originalFilename) {
        const { v4: uuidv4 } = require('uuid');
        const ext = path.extname(originalFilename);
        const uniqueName = `${uuidv4()}${ext}`;

        return path.join(
            process.env.MEDIA_DIR || '/var/www/chatvault/media',
            userId.toString(),
            chatId.toString(),
            'original',
            uniqueName
        );
    }

    /**
     * Generate thumbnail storage path
     */
    generateThumbPath(storagePath) {
        const parsed = path.parse(storagePath);
        return path.join(
            parsed.dir.replace('/original', '/thumbs'),
            `thumb_${parsed.base}`
        );
    }
}

module.exports = new MediaMapper();
