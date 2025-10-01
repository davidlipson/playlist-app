import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchInputField = styled.input`
  width: 100%;
  padding: 12px 20px 12px 45px;
  border: none;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search playlists...",
  onSearch,
  debounceMs = 300,
}) => {
  const [query, setQuery] = useState("");

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      const timeoutId = setTimeout(() => {
        onSearch(searchQuery);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    },
    [onSearch, debounceMs]
  );

  useEffect(() => {
    const cleanup = debouncedSearch(query);
    return cleanup;
  }, [query, debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <SearchContainer>
      <SearchIcon>🔍</SearchIcon>
      <SearchInputField
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
      />
      {query && (
        <ClearButton onClick={handleClear} title="Clear search">
          ✕
        </ClearButton>
      )}
    </SearchContainer>
  );
};

export default SearchInput;
