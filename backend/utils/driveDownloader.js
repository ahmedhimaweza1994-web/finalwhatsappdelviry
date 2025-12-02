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
                console.log('[Drive] HTML response detected, checking for virus scan warning...');

                const pageResponse = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    params: { id: fileId },
                    responseType: 'text'
                });

                // Try to find confirm token in various formats
                // 1. Link with confirm=...
                // 2. Form action with confirm=...
                // 3. Just the confirm token in the text
                const confirmMatch = pageResponse.data.match(/confirm=([a-zA-Z0-9_-]+)/) ||
                    pageResponse.data.match(/name="confirm" value="([a-zA-Z0-9_-]+)"/);

                if (confirmMatch && confirmMatch[1]) {
                    const confirmToken = confirmMatch[1];
                    console.log('[Drive] Virus scan warning detected, confirming download...');

                    response = await axios({
                        method: 'GET',
                        url: downloadUrl,
                        params: {
                            id: fileId,
                            confirm: confirmToken
                        },
                        responseType: 'stream'
                    });

                    // Check again if we got HTML (failed to bypass)
                    if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
                        throw new Error('Failed to bypass Google Drive virus scan warning (got HTML again)');
                    }

                } else {
                    // It's HTML but we couldn't find a confirm token. 
                    // Could be a private file, deleted file, or just a generic error page.
                    throw new Error('Google Drive link returned an HTML page instead of a file. Make sure the link is public (Anyone with the link).');
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
