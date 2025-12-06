const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * ZIP Parser Service
 * Extracts WhatsApp export ZIP files and identifies chat content
 */

class ZipParser {
    /**
     * Extract ZIP file to destination using native unzip command
     * This is more reliable for large files than Node.js libraries
     */
    async extract(zipPath, extractPath) {
        try {
            await fs.mkdir(extractPath, { recursive: true });

            // Use native unzip command for better large file handling
            // -o: overwrite files without prompting
            // -q: quiet mode
            await execAsync(`unzip -o -q "${zipPath}" -d "${extractPath}"`, {
                maxBuffer: 50 * 1024 * 1024 // 50MB buffer for stdout/stderr
            });
        } catch (error) {
            throw new Error(`ZIP extraction failed: ${error.message}`);
        }
    }

    /**
     * Find .txt chat file in extracted contents
     */
    async findChatFile(extractPath) {
        const files = await this.getAllFiles(extractPath);

        // Look for .txt files
        const txtFiles = files.filter(f => f.endsWith('.txt'));

        if (txtFiles.length === 0) {
            throw new Error('No .txt chat file found in ZIP');
        }

        // If multiple, choose the largest one (usually the main chat)
        let largestFile = txtFiles[0];
        let largestSize = 0;

        for (const file of txtFiles) {
            const stats = await fs.stat(file);
            if (stats.size > largestSize) {
                largestSize = stats.size;
                largestFile = file;
            }
        }

        return largestFile;
    }

    /**
     * Find all media files in extracted contents
     */
    async findMediaFiles(extractPath) {
        const allFiles = await this.getAllFiles(extractPath);

        const mediaExtensions = [
            'jpg', 'jpeg', 'png', 'gif', 'webp', // Images
            'mp4', 'avi', 'mov', '3gp', 'mkv',   // Videos
            'opus', 'mp3', 'm4a', 'ogg', 'aac',  // Audio
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar' // Documents
        ];

        const mediaFiles = allFiles.filter(file => {
            const ext = path.extname(file).toLowerCase().substring(1);
            return mediaExtensions.includes(ext);
        });

        return mediaFiles;
    }

    /**
     * Get chat name from .txt filename
     */
    getChatName(txtFilePath) {
        const basename = path.basename(txtFilePath, '.txt');
        // Remove "WhatsApp Chat with " prefix if present
        return basename.replace(/^WhatsApp Chat with\s+/i, '').trim();
    }

    /**
     * Recursively get all files in directory
     */
    async getAllFiles(dir, fileList = []) {
        const files = await fs.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
                await this.getAllFiles(filePath, fileList);
            } else {
                fileList.push(filePath);
            }
        }

        return fileList;
    }

    /**
     * Calculate total size of directory
     */
    async getDirectorySize(dir) {
        const files = await this.getAllFiles(dir);
        let totalSize = 0;

        for (const file of files) {
            const stats = await fs.stat(file);
            totalSize += stats.size;
        }

        return totalSize;
    }

    /**
     * Clean up extracted files
     */
    async cleanup(extractPath) {
        try {
            await fs.rm(extractPath, { recursive: true, force: true });
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = new ZipParser();
