import React, { useState } from 'react';
import MediaModal from '../MediaModal';

const ImageMessage = ({ message }) => {
    const [showModal, setShowModal] = useState(false);
    const media = message.media?.[0];

    if (!media) {
        return <div className="text-sm text-red-500">📷 Image missing</div>;
    }

    // Extract media URL from storage_path
    const getMediaUrl = (storagePath) => {
        if (!storagePath) return null;
        const token = localStorage.getItem('token');
        if (!token) return null;
        const normalized = storagePath.replace(/\\/g, '/');
        const parts = normalized.split('/');
        const relevantParts = parts.slice(-4);
        return `/api/media/${relevantParts.join('/')}?token=${token}`;
    };

    const src = getMediaUrl(media.storage_path);

    return (
        <>
            <div className="cursor-pointer" onClick={() => setShowModal(true)}>
                <img
                    src={src}
                    alt={media.original_name}
                    className="max-w-full rounded max-h-96 object-contain"
                    loading="lazy"
                    onError={(e) => {
                        console.error('Image load error:', src);
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                />
            </div>
            {message.body && <div className="text-sm mt-2">{message.body}</div>}
            {showModal && <MediaModal media={{ ...media, src }} onClose={() => setShowModal(false)} />}
        </>
    );
};

export default ImageMessage;
