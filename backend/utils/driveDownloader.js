const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');

/**
 * Extract Google Drive file ID from various link formats
 */
function extractDriveFileId(url) {
    // Format 1: https://drive.google.com/file/d/FILE_ID/view
    let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    // Format 2: https://drive.google.com/open?id=FILE_ID
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    return null;
}

/**
 * Download file from Google Drive
 * @param {string} driveUrl - Google Drive share link
 * @param {string} destPath - Destination file path
 * @param {function} onProgress - Progress callback (bytesDownloaded, totalBytes)
 */
async function downloadFromDrive(driveUrl, destPath, onProgress) {
    const fileId = extractDriveFileId(driveUrl);

    if (!fileId) {
        throw new Error('Invalid Google Drive link. Please use a valid share link.');
    }

    // Google Drive direct download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    try {
        // First request to get the file (might get confirmation page for large files)
        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            maxRedirects: 5,
            timeout: 30000, // 30 second timeout for initial connection
        });

        // Check if we got a confirmation page (large files)
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
            // Need to confirm download for large files
            const confirmUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;
            const confirmedResponse = await axios({
                method: 'GET',
                url: confirmUrl,
                responseType: 'stream',
                maxRedirects: 5,
                timeout: 30000,
            });

            return await downloadStream(confirmedResponse, destPath, onProgress);
        }

        return await downloadStream(response, destPath, onProgress);

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            throw new Error('Download timeout. Please try again or use a different upload method.');
        }
        throw new Error(`Failed to download from Google Drive: ${error.message}`);
    }
}

/**
 * Download from response stream
 */
async function downloadStream(response, destPath, onProgress) {
    const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
    let downloadedBytes = 0;

    // Ensure destination directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    const writer = createWriteStream(destPath);

    // Track progress
    response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (onProgress && totalBytes > 0) {
            onProgress(downloadedBytes, totalBytes);
        }
    });

    // Download file
    await pipeline(response.data, writer);

    return {
        path: destPath,
        size: downloadedBytes
    };
}

module.exports = {
    extractDriveFileId,
    downloadFromDrive
};
