const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Thumbnail Generator Service
 * Creates optimized thumbnails for images and videos
 */

class ThumbnailGenerator {
    constructor() {
        this.thumbnailWidth = 300;
        this.thumbnailQuality = 80;
    }

    /**
     * Generate thumbnail for image
     */
    async generateImageThumbnail(sourcePath, thumbPath) {
        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(thumbPath), { recursive: true });

            await sharp(sourcePath)
                .resize(this.thumbnailWidth, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .jpeg({ quality: this.thumbnailQuality })
                .toFile(thumbPath);

            return thumbPath;
        } catch (error) {
            console.error(`Failed to generate thumbnail for ${sourcePath}:`, error);
            return null;
        }
    }

    /**
     * Generate video thumbnail (first frame)
     * Note: Requires ffmpeg to be installed
     */
    async generateVideoThumbnail(sourcePath, thumbPath) {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            // Ensure directory exists
            await fs.mkdir(path.dirname(thumbPath), { recursive: true });

            // Extract first frame using ffmpeg
            const command = `ffmpeg -i "${sourcePath}" -vframes 1 -vf scale=${this.thumbnailWidth}:-1 "${thumbPath}" -y`;

            await execAsync(command);

            return thumbPath;
        } catch (error) {
            console.error(`Failed to generate video thumbnail for ${sourcePath}:`, error);
            // Fallback: create a placeholder
            return null;
        }
    }

    /**
     * Generate thumbnail based on file type
     */
    async generateThumbnail(sourcePath, thumbPath, mimeType) {
        if (mimeType.startsWith('image/')) {
            return await this.generateImageThumbnail(sourcePath, thumbPath);
        } else if (mimeType.startsWith('video/')) {
            return await this.generateVideoThumbnail(sourcePath, thumbPath);
        }

        return null;
    }

    /**
     * Batch generate thumbnails
     */
    async generateBatch(files) {
        const results = [];

        for (const { sourcePath, thumbPath, mimeType } of files) {
            const result = await this.generateThumbnail(sourcePath, thumbPath, mimeType);
            results.push({
                sourcePath,
                thumbPath: result,
                success: result !== null
            });
        }

        return results;
    }

    /**
     * Check if ffmpeg is available
     */
    async isFfmpegAvailable() {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            await execAsync('ffmpeg -version');
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new ThumbnailGenerator();
