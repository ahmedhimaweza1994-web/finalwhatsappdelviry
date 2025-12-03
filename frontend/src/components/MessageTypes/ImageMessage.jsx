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
            <div className="cursor-pointer relative group" onClick={() => setShowModal(true)}>
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
                <a
                    href={`/api/media/download/${media.id}?token=${localStorage.getItem('token')}`}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download Image"
                >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"></path><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"></path></svg>
                </a>
            </div>
            {message.body && <div className="text-sm mt-2">{message.body}</div>}
            {showModal && <MediaModal media={{ ...media, src }} onClose={() => setShowModal(false)} />}
        </>
    );
};

export default ImageMessage;
