const { spawn } = require('child_process');
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

        // Use gdown which is installed in the Docker container
        // gdown https://drive.google.com/uc?id=FILEID -O /path/to/dest
        const driveUrl = `https://drive.google.com/uc?id=${fileId}`;

        console.log(`[Drive] Starting download for ${fileId} using gdown...`);

        return new Promise((resolve, reject) => {
            // --fuzzy helps with extracting file ID from various URL formats
            // --continue allows resuming if supported
            const gdown = spawn('gdown', [driveUrl, '-O', destPath, '--fuzzy']);

            let errorOutput = '';

            gdown.stdout.on('data', (data) => {
                console.log(`[gdown] ${data}`);
            });

            gdown.stderr.on('data', (data) => {
                const output = data.toString();
                // gdown writes progress to stderr
                // Example: 45%|████▌     | 1.23G/2.72G [00:15<00:20, 75.1MB/s]
                errorOutput += output;

                if (onProgress) {
                    const match = output.match(/(\d+)%/);
                    if (match) {
                        const percent = parseInt(match[1]);
                        onProgress(percent, 100);
                    }
                }
            });

            gdown.on('close', (code) => {
                if (code === 0) {
                    // Verify file exists and is not empty
                    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
                        resolve();
                    } else {
                        reject(new Error('Download completed but file is empty or missing'));
                    }
                } else {
                    console.error(`[gdown] Exited with code ${code}`);
                    console.error(`[gdown] Error output: ${errorOutput}`);

                    if (errorOutput.includes('Permission denied')) {
                        reject(new Error('Permission denied: Make sure the file is Public (Anyone with the link)'));
                    } else if (errorOutput.includes('Too many users')) {
                        reject(new Error('Google Drive quota exceeded: Too many users have viewed or downloaded this file recently'));
                    } else {
                        reject(new Error(`gdown failed with code ${code}: ${errorOutput.slice(-200)}`));
                    }
                }
            });

            gdown.on('error', (err) => {
                reject(new Error(`Failed to start gdown: ${err.message}`));
            });
        });
    }
}

module.exports = DriveDownloader;
