import { useState, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import '../styles/SearchBar.css';

const SearchBar = ({ onSearch, onClear, placeholder = "Search messages..." }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Debounce search
    useEffect(() => {
        if (query.trim().length === 0) {
            onClear?.();
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeoutId = setTimeout(() => {
            onSearch(query.trim());
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query, onSearch]);

    const handleClear = () => {
        setQuery('');
        onClear?.();
    };

    return (
        <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
                type="text"
                className="search-input"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
                <button
                    className="clear-button"
                    onClick={handleClear}
                    aria-label="Clear search"
                >
                    <FaTimes />
                </button>
            )}
            {isSearching && <div className="search-spinner"></div>}
        </div>
    );
};

export default SearchBar;
