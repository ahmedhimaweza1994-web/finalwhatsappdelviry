const axios = require('axios');
const fs = require('fs');
const path = require('path');

class DriveDownloader {
    static getFileId(url) {
        const patterns = [
            /file\/d\/([a-zA-Z0-9_-]+)/,
            /id=([a-zA-Z0-9_-]+)/,
            /open\?id=([a-zA-Z0-9_-]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    static async download(url, destPath, onProgress) {
        const fileId = this.getFileId(url);
        if (!fileId) {
            throw new Error('Invalid Google Drive URL');
        }

        const downloadUrl = 'https://drive.google.com/uc?export=download';

        try {
            // First attempt - try direct download
            let response = await axios({
                method: 'GET',
                url: downloadUrl,
                params: { id: fileId },
                responseType: 'stream',
                validateStatus: status => status < 400 // Accept 3xx redirects
            });

            // Check if we got a virus scan warning (HTML response instead of file)
            // Note: axios stream response doesn't let us easily check content-type before consuming
            // But usually the virus scan warning comes with a cookie or a confirmation link

            // For large files, Google Drive returns a page asking to confirm
            // We need to extract the confirmation token

            // A better approach for large files without API key is tricky.
            // Let's try to handle the standard "confirm" parameter if we can find it.

            // If the response is HTML (likely the warning page), we need to get the confirm token
            if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
                // We need to read the stream to find the token, but that consumes it.
                // Let's try a different approach: HEAD request first? No, Drive doesn't support HEAD well for this.

                // Let's try to get the confirmation token from the initial request if possible.
                // Actually, the most reliable way without API key for large files is to check for the cookie/confirm param.

                // Let's try to fetch the page as text first to find the token
                const pageResponse = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    params: { id: fileId },
                    responseType: 'text'
                });

                if (pageResponse.data.includes('download_warning')) {
                    const match = pageResponse.data.match(/confirm=([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                        const confirmToken = match[1];
                        // Retry with confirm token
                        response = await axios({
                            method: 'GET',
                            url: downloadUrl,
                            params: {
                                id: fileId,
                                confirm: confirmToken
                            },
                            responseType: 'stream'
                        });
                    }
                }
            }

            // Pipe to file
            const writer = fs.createWriteStream(destPath);
            const totalLength = response.headers['content-length'];

            let downloaded = 0;
            response.data.on('data', (chunk) => {
                downloaded += chunk.length;
                if (onProgress && totalLength) {
                    onProgress(downloaded, parseInt(totalLength));
                }
            });

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
                response.data.on('error', reject);
            });

        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }
}

module.exports = DriveDownloader;
