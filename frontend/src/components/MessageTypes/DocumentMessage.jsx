import React from 'react';
import { FaFile, FaDownload, FaFilePdf, FaFileWord, FaFileExcel, FaFileArchive } from 'react-icons/fa';

const DocumentMessage = ({ message }) => {
    const media = message.media?.[0];

    if (!media) {
        return <div className="text-sm text-red-500">📄 Document missing</div>;
    }

    const getFileIcon = (filename) => {
        const ext = filename?.toLowerCase().split('.').pop();
        switch (ext) {
            case 'pdf':
                return <FaFilePdf className="text-3xl text-red-600" />;
            case 'doc':
            case 'docx':
                return <FaFileWord className="text-3xl text-blue-600" />;
            case 'xls':
            case 'xlsx':
                return <FaFileExcel className="text-3xl text-green-600" />;
            case 'zip':
            case 'rar':
                return <FaFileArchive className="text-3xl text-yellow-600" />;
            default:
                return <FaFile className="text-3xl text-gray-600" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 KB';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    return (
        <>
            <div className="flex items-center gap-3 p-3 bg-white/10 dark:bg-black/10 rounded-lg min-w-[250px]">
                {getFileIcon(media.original_name)}
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{media.original_name || 'Document'}</div>
                    <div className="text-xs text-wa-text-secondary dark:text-wa-text-secondary-dark">
                        {formatFileSize(media.size_bytes)}
                    </div>
                </div>
                <a
                    href={`/api/media/download/${media.id}`}
                    download
                    className="text-wa-icon dark:text-wa-icon-dark hover:text-wa-green transition-colors"
                    title="Download"
                >
                    <FaDownload className="text-xl" />
                </a>
            </div>
            {message.body && <div className="text-sm mt-2">{message.body}</div>}
        </>
    );
};

export default DocumentMessage;
