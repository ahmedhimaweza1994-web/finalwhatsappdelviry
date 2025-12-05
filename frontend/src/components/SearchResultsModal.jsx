import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import '../styles/SearchResultsModal.css';

const SearchResultsModal = ({ isOpen, onClose, results, searchQuery, onResultClick }) => {
    if (!isOpen) return null;

    const highlightText = (text, query) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ?
                <mark key={i} className="bg-yellow-300">{part}</mark> : part
        );
    };

    const formatTimestamp = (timestamp) => {
        return format(new Date(timestamp), 'MMM d, yyyy HH:mm');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="text-lg font-semibold">Search Results</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {results.totalOccurrences} occurrence{results.totalOccurrences !== 1 ? 's' : ''} in {results.totalMessages} message{results.totalMessages !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="close-button">
                        <FaTimes />
                    </button>
                </div>

                <div className="modal-body">
                    {results.results.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No results found
                        </div>
                    ) : (
                        <div className="results-list">
                            {results.results.map((result) => (
                                <div
                                    key={result.id}
                                    className="result-item"
                                    onClick={() => onResultClick(result.id)}
                                >
                                    <div className="result-header">
                                        <span className="sender-name">{result.sender_name}</span>
                                        <span className="timestamp">{formatTimestamp(result.timestamp)}</span>
                                    </div>
                                    <div className="result-preview">
                                        {highlightText(result.preview || result.body, searchQuery)}
                                        {result.preview && result.body && result.body.length > 150 && '...'}
                                    </div>
                                    {result.occurrences > 1 && (
                                        <div className="occurrences-badge">
                                            {result.occurrences} occurrence{result.occurrences !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchResultsModal;
