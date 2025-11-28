import React from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const MediaModal = ({ media, onClose, onNext, onPrev, hasNext, hasPrev }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
        if (e.key === 'ArrowRight' && hasNext) onNext?.();
    };

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [hasNext, hasPrev]);

    const isVideo = media.mime_type?.startsWith('video/');

    return (
        <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
                <FaTimes className="text-3xl" />
            </button>

            {/* Previous button */}
            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
                >
                    <FaChevronLeft className="text-4xl" />
                </button>
            )}

            {/* Next button */}
            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
                >
                    <FaChevronRight className="text-4xl" />
                </button>
            )}

            {/* Media content */}
            <div
                className="max-w-7xl max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {isVideo ? (
                    <video
                        controls
                        autoPlay
                        className="max-w-full max-h-[90vh] rounded-lg"
                    >
                        <source src={media.src} type={media.mime_type} />
                    </video>
                ) : (
                    <img
                        src={media.src}
                        alt={media.original_name}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                )}
            </div>

            {/* Media info */}
            <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                <p className="text-sm">{media.original_name}</p>
            </div>
        </div>
    );
};

export default MediaModal;
