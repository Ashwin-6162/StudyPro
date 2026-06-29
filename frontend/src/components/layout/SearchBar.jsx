import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Navigation.css';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      // Navigate to history with search query, or documents
      navigate(`/history?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <div className="search-container">
      <Search className="search-icon" size={16} />
      <input
        type="text"
        className="search-input"
        placeholder="Search documents, chats..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
