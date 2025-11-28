/**
 * Extract media URL path from storage_path
 * storage_path format: c:\Users\mohan\whatsapp viewr\media\{userId}\{chatId}\{type}\{filename}
 * Returns: /api/media/{userId}/{chatId}/{type}/{filename}?token={token}
 */
export const getMediaUrl = (storagePath) => {
    if (!storagePath) return null;

    const token = localStorage.getItem('token');
    if (!token) return null;

    // Normalize path separators to forward slashes
    const normalized = storagePath.replace(/\\/g, '/');

    // Extract the last 4 parts: userId/chatId/type/filename
    const parts = normalized.split('/');
    const relevantParts = parts.slice(-4); // Get last 4 parts

    return `/api/media/${relevantParts.join('/')}?token=${token}`;
};
