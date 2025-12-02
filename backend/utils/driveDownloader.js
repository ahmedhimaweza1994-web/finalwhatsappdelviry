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

        // Browser-like headers to avoid detection
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        };

        try {
            // First attempt - try direct download
            let response = await axios({
                method: 'GET',
                url: downloadUrl,
                params: { id: fileId },
                headers,
                responseType: 'stream',
                validateStatus: status => status < 400,
                maxRedirects: 5
            });

            // Check if we got a virus scan warning (HTML response instead of file)
            if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
                console.log('[Drive] HTML response detected, checking for virus scan warning...');

                // We need to get the page content to find the token
                const pageResponse = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    params: { id: fileId },
                    headers,
                    responseType: 'text',
                    validateStatus: status => status < 400
                });

                // Try to find confirm token in various formats
                const confirmMatch = pageResponse.data.match(/confirm=([a-zA-Z0-9_-]+)/) ||
                    pageResponse.data.match(/name="confirm" value="([a-zA-Z0-9_-]+)"/);

                if (confirmMatch && confirmMatch[1]) {
                    const confirmToken = confirmMatch[1];
                    console.log('[Drive] Virus scan warning detected, confirming download...');

                    // CRITICAL: Extract cookies from the first response to pass to the second request
                    // Google requires the session cookies to accept the confirmation
                    const cookies = pageResponse.headers['set-cookie'];
                    const cookieHeader = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';

                    response = await axios({
                        method: 'GET',
                        url: downloadUrl,
                        params: {
                            id: fileId,
                            confirm: confirmToken
                        },
                        headers: {
                            ...headers,
                            'Cookie': cookieHeader
                        },
                        responseType: 'stream',
                        validateStatus: status => status < 400
                    });

                    // Check again if we got HTML (failed to bypass)
                    if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
                        throw new Error('Failed to bypass Google Drive virus scan warning (got HTML again). The file might be private or too large for this method.');
                    }

                } else {
                    // It's HTML but we couldn't find a confirm token. 
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
