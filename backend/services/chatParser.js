const fs = require('fs').promises;
const path = require('path');

/**
 * WhatsApp Chat Parser
 * Parses WhatsApp .txt export files into structured message data
 * Supports multiple timestamp formats and locales
 */

class ChatParser {
    constructor() {
        // Common WhatsApp timestamp patterns
        this.timestampPatterns = [
            // M/D/YY, H:MM pm/am - Sender: Message (with Unicode spaces and special chars)
            /^(\d{1,2}\/\d{1,2}\/\d{2}),?\s+(\d{1,2}:\d{2})[\s\u00A0\u202F\u2009]*([AaPp][Mm])\s*-\s*([^:]+?):\s*(.*)$/,
            // [DD/MM/YYYY, HH:MM:SS] Sender: Message
            /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]\s*([^:]+?):\s*(.*)$/,
            // DD/MM/YYYY, HH:MM - Sender: Message
            /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s*-\s*([^:]+?):\s*(.*)$/,
            // MM/DD/YY, HH:MM - Sender: Message (US format)
            /^(\d{1,2}\/\d{1,2}\/\d{2}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s*-\s*([^:]+?):\s*(.*)$/,
            // DD.MM.YY, HH:MM - Sender: Message (European format)
            /^(\d{1,2}\.\d{1,2}\.\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*([^:]+?):\s*(.*)$/,
        ];

        this.systemMessagePatterns = [
            /Messages and calls are end-to-end encrypted/i,
            /created group/i,
            /changed the subject/i,
            /changed this group's icon/i,
            /added you/i,
            /left/i,
            /removed/i,
            /security code changed/i,
            /You're now an admin/i,
        ];

        this.mediaPatterns = {
            image: /(<attached:\s*)?(.+?\.(jpg|jpeg|png|gif|webp))\s*(\(file attached\))?|image omitted|IMG-\d+/i,
            video: /(<attached:\s*)?(.+?\.(mp4|avi|mov|3gp|mkv))\s*(\(file attached\))?|video omitted|VID-\d+/i,
            audio: /(<attached:\s*)?(.+?\.(opus|mp3|m4a|ogg|aac))\s*(\(file attached\))?|audio omitted|PTT-\d+/i,
            document: /(<attached:\s*)?(.+?\.(pdf|doc|docx|xls|xlsx|zip|rar))\s*(\(file attached\))?|document omitted/i,
        };
    }

    /**
     * Parse WhatsApp chat .txt file
     */
    /**
     * Clean text by removing Unicode control characters (like LTR marks)
     */
    cleanText(text) {
        // Remove LTR/RTL marks and other invisible control characters
        // \u200E is LTR mark, \u200F is RTL mark, \u202A-\u202E are embedding marks
        return text.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '').trim();
    }

    /**
     * Parse WhatsApp chat .txt file
     */
    async parse(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        const messages = [];
        let currentMessage = null;
        let orderIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            // Clean the line of invisible characters
            const line = this.cleanText(lines[i]);
            if (!line) continue;

            // Try to match timestamp patterns
            const parsed = this.parseMessageLine(line);

            if (parsed) {
                // Save previous message if exists
                if (currentMessage) {
                    messages.push({ ...currentMessage, orderIndex: orderIndex++ });
                }

                // Start new message
                currentMessage = parsed;
            } else if (currentMessage) {
                // Continuation of previous message (multi-line)
                currentMessage.body += '\n' + line;
            }
        }

        // Add last message
        if (currentMessage) {
            messages.push({ ...currentMessage, orderIndex: orderIndex++ });
        }

        return messages;
    }

    /**
     * Parse a single message line
     */
    parseMessageLine(line) {
        for (const pattern of this.timestampPatterns) {
            const match = line.match(pattern);
            if (match) {
                let date, time, sender, body, ampm;

                // Handle the new 5-group format (date, time, am/pm, sender, body)
                if (match.length === 6) {
                    [, date, time, ampm, sender, body] = match;
                    time = time + ' ' + ampm;  // Combine time and am/pm
                } else {
                    // Handle traditional 4-group format
                    [, date, time, sender, body] = match;
                }

                // Parse timestamp
                const timestamp = this.parseTimestamp(date, time);
                if (!timestamp) continue;

                // Clean sender and body
                const cleanSender = this.cleanText(sender);
                const cleanBodyText = this.cleanText(body);

                // Detect message type and extract media info
                const { messageType, mediaFilename, cleanBody } = this.detectMessageType(cleanBodyText);

                // Check if system message
                const isSystemMessage = this.isSystemMessage(cleanBody);

                return {
                    timestamp,
                    senderName: cleanSender,
                    senderIsMe: false, // Will be updated later
                    body: cleanBody,
                    messageType: isSystemMessage ? 'system' : messageType,
                    mediaFilename,
                    metadata: {
                        originalLine: line,
                        isSystemMessage
                    }
                };
            }
        }

        return null;
    }

    /**
     * Post-process messages to identify "me" sender
     */
    identifySender(messages, chatName) {
        if (messages.length === 0) return messages;

        // Get all unique senders (excluding system messages)
        const senders = new Set();
        messages.forEach(msg => {
            if (msg.messageType !== 'system') {
                senders.add(msg.senderName);
            }
        });

        const senderList = Array.from(senders);
        let meSender = null;

        console.log(`[Parser] ========== SENDER IDENTIFICATION ==========`);
        console.log(`[Parser] Chat Name: "${chatName}"`);
        console.log(`[Parser] Unique Senders (${senderList.length}):`, senderList);

        // Strategy 1: Check for "You" or "Me"
        meSender = senderList.find(s => {
            const lower = s.toLowerCase();
            return lower === 'you' || lower === 'me' || lower === 'أنت' || lower === 'انا';
        });

        if (meSender) {
            console.log(`[Parser] ✓ Strategy 1: Found explicit 'me' identifier: "${meSender}"`);
        }

        // Strategy 2: If exactly 2 participants, one matches chat name -> other is me
        if (!meSender && senderList.length === 2 && chatName) {
            const normalizedChatName = this.cleanText(chatName).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '').toLowerCase();

            console.log(`[Parser] Strategy 2: Checking 2-person chat...`);
            console.log(`[Parser]   Normalized chat name: "${normalizedChatName}"`);

            for (const sender of senderList) {
                const normalizedSender = sender.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '').toLowerCase();
                console.log(`[Parser]   Checking "${sender}" -> normalized: "${normalizedSender}"`);

                // Check if chat name contains sender name or vice versa
                if (normalizedChatName.includes(normalizedSender) || normalizedSender.includes(normalizedChatName)) {
                    const otherSender = senderList.find(s => s !== sender);
                    meSender = otherSender;
                    console.log(`[Parser] ✓ Strategy 2: "${sender}" matches chat name, so "${meSender}" is me`);
                    break;
                }
            }
        }

        // Strategy 3: Heuristic - phone number vs name
        if (!meSender && senderList.length === 2) {
            const isPhone = (s) => /^[\d\s\+\-()]+$/.test(s.trim());
            const s1 = senderList[0];
            const s2 = senderList[1];

            console.log(`[Parser] Strategy 3: Phone number detection...`);
            console.log(`[Parser]   "${s1}" is phone? ${isPhone(s1)}`);
            console.log(`[Parser]   "${s2}" is phone? ${isPhone(s2)}`);

            if (isPhone(s1) && !isPhone(s2)) {
                meSender = s2;
                console.log(`[Parser] ✓ Strategy 3: "${s2}" is name (not phone), so it's me`);
            } else if (!isPhone(s1) && isPhone(s2)) {
                meSender = s1;
                console.log(`[Parser] ✓ Strategy 3: "${s1}" is name (not phone), so it's me`);
            }
        }

        // Strategy 4: If still not found and 2 senders, count messages and assume sender with fewer is "me"
        // (Most people receive more than they send in customer service chats)
        if (!meSender && senderList.length === 2) {
            const messageCounts = {};
            messages.forEach(msg => {
                if (msg.messageType !== 'system') {
                    messageCounts[msg.senderName] = (messageCounts[msg.senderName] || 0) + 1;
                }
            });

            console.log(`[Parser] Strategy 4: Message count heuristic...`);
            console.log(`[Parser]   Message counts:`, messageCounts);

            const sorted = Object.entries(messageCounts).sort((a, b) => a[1] - b[1]);
            // If one sender has significantly fewer messages (< 40% of total), they might be "me"
            const total = sorted[0][1] + sorted[1][1];
            if (sorted[0][1] / total < 0.4) {
                meSender = sorted[0][0];
                console.log(`[Parser] ✓ Strategy 4: "${meSender}" has fewer messages (${sorted[0][1]}/${total}), likely me`);
            }
        }

        if (!meSender && senderList.length === 2) {
            // Default: first sender alphabetically is "me" as last resort
            meSender = senderList.sort()[0];
            console.log(`[Parser] ⚠ No strategy worked, defaulting to: "${meSender}"`);
        }

        console.log(`[Parser] ========== FINAL RESULT: "${meSender}" ==========`);

        // Update messages
        const result = messages.map(msg => ({
            ...msg,
            senderIsMe: meSender ? msg.senderName === meSender : false
        }));

        // Log summary
        const meCount = result.filter(m => m.senderIsMe).length;
        const otherCount = result.filter(m => !m.senderIsMe && m.messageType !== 'system').length;
        console.log(`[Parser] Final counts: ${meCount} from me, ${otherCount} from others`);

        return result;
    }

    /**
     * Parse timestamp from various formats
     */
    parseTimestamp(dateStr, timeStr) {
        try {
            // Try different date formats
            let dateParts;

            if (dateStr.includes('/')) {
                dateParts = dateStr.split('/');
            } else if (dateStr.includes('.')) {
                dateParts = dateStr.split('.');
            } else {
                return null;
            }

            // Parse time
            let hours, minutes, seconds = 0;
            const isPM = /PM/i.test(timeStr);
            const isAM = /AM/i.test(timeStr);

            const cleanTime = timeStr.replace(/\s?(AM|PM)/i, '');
            const timeParts = cleanTime.split(':');

            hours = parseInt(timeParts[0]);
            minutes = parseInt(timeParts[1]);
            if (timeParts[2]) seconds = parseInt(timeParts[2]);

            // Convert 12-hour to 24-hour
            if (isPM && hours !== 12) hours += 12;
            if (isAM && hours === 12) hours = 0;

            // Determine date format based on value ranges
            let day, month, year;

            // If third part is 2 digits, it's YY format
            if (dateParts[2] && dateParts[2].length === 2) {
                year = 2000 + parseInt(dateParts[2]);
            } else if (dateParts[2]) {
                year = parseInt(dateParts[2]);
            }

            // Common formats: DD/MM/YYYY or MM/DD/YYYY
            // Heuristic: if first number > 12, it's DD/MM, otherwise check both
            const first = parseInt(dateParts[0]);
            const second = parseInt(dateParts[1]);

            if (first > 12) {
                // Must be DD/MM
                day = first;
                month = second;
            } else if (second > 12) {
                // Must be MM/DD
                month = first;
                day = second;
            } else {
                // Ambiguous - default to DD/MM (European format more common in WhatsApp)
                day = first;
                month = second;
            }

            const date = new Date(year, month - 1, day, hours, minutes, seconds);

            // Validate date
            if (isNaN(date.getTime())) {
                return null;
            }

            return date;
        } catch (error) {
            return null;
        }
    }

    /**
     * Detect if sender is the user ("You", "you", phone number, etc.)
     */
    isSenderMe(sender) {
        const normalized = sender.toLowerCase().trim();
        return normalized === 'you' || normalized === 'me';
    }

    /**
     * Detect message type and extract media filename
     */
    detectMessageType(body) {
        const cleanBody = body.trim();

        // Handle quote/reply messages (WhatsApp uses > for quotes)
        // These should be treated as text, not media
        if (cleanBody.startsWith('>') && !cleanBody.includes('<attached:')) {
            return {
                messageType: 'text',
                mediaFilename: null,
                cleanBody: cleanBody
            };
        }

        // Improved media patterns with better matching
        const improvedMediaPatterns = {
            // Match <attached: filename> format (most reliable)
            image: /<attached:\s*([^>]+\.(?:jpg|jpeg|png|gif|webp|bmp))[>\s]*/i,
            video: /<attached:\s*([^>]+\.(?:mp4|avi|mov|3gp|mkv|webm))[>\s]*/i,
            audio: /<attached:\s*([^>]+\.(?:opus|mp3|m4a|ogg|aac|amr))[>\s]*/i,
            document: /<attached:\s*([^>]+\.(?:pdf|doc|docx|xls|xlsx|zip|rar|txt))[>\s]*/i,
        };

        // Try improved patterns first
        for (const [type, pattern] of Object.entries(improvedMediaPatterns)) {
            const match = cleanBody.match(pattern);
            if (match && match[1]) {
                const mediaFilename = this.cleanText(match[1].trim());
                console.log(`[Parser] Detected ${type} media: ${mediaFilename}`);
                return {
                    messageType: type,
                    mediaFilename,
                    cleanBody: cleanBody.replace(pattern, '').trim()
                };
            }
        }

        // Fallback to original patterns
        for (const [type, pattern] of Object.entries(this.mediaPatterns)) {
            const match = cleanBody.match(pattern);
            if (match) {
                let mediaFilename = null;
                if (match[2] && !cleanBody.includes('omitted')) {
                    mediaFilename = this.cleanText(match[2].trim());
                }

                return {
                    messageType: type,
                    mediaFilename,
                    cleanBody: mediaFilename ? cleanBody.replace(pattern, '').trim() : cleanBody
                };
            }
        }

        // Check for links
        if (this.containsLink(cleanBody)) {
            return {
                messageType: 'link',
                mediaFilename: null,
                cleanBody
            };
        }

        return {
            messageType: 'text',
            mediaFilename: null,
            cleanBody
        };
    }

    /**
     * Check if message is a system message
     */
    isSystemMessage(body) {
        return this.systemMessagePatterns.some(pattern => pattern.test(body));
    }

    /**
     * Check if text contains URL
     */
    containsLink(text) {
        const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;
        return urlPattern.test(text);
    }

    /**
     * Extract file extension from filename
     */
    getFileExtension(filename) {
        const ext = path.extname(filename).toLowerCase();
        return ext.substring(1); // Remove the dot
    }
}

module.exports = new ChatParser();
