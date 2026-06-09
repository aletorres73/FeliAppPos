import {searchContainer, searchInputStyle} from '../styles/StockScreenStyles';

interface SearchContainerProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export function SearchContainer({ searchTerm, setSearchTerm }: SearchContainerProps) {
    return (
        <div style={searchContainer}>
            <input
                type="text"
                placeholder="Buscar por artículo, marca o código..."
                style={searchInputStyle}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    )
};