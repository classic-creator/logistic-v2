import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';

export const Table = ({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  searchFields = [],
  enableSearch = true,
  filterComponent,
  keyField = 'id',
  onRowClick,
  pageSizeOptions = [10, 20, 50],
  initialPageSize = 10,
  serverPagination = false,
  totalRows = 0,
  onFetchData = null // (params: { page, pageSize, search, sortKey, sortDirection }) => void
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term for server-side
  React.useEffect(() => {
    if (serverPagination) {
      const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, serverPagination]);

  const onFetchDataRef = React.useRef(onFetchData);
  React.useEffect(() => {
    onFetchDataRef.current = onFetchData;
  }, [onFetchData]);

  // Trigger onFetchData when dependencies change
  React.useEffect(() => {
    if (serverPagination && onFetchDataRef.current) {
      onFetchDataRef.current({
        page: currentPage,
        pageSize,
        search: debouncedSearch,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction
      });
    }
  }, [serverPagination, currentPage, pageSize, debouncedSearch, sortConfig]);

  // Client-side Search logic
  const searchedData = useMemo(() => {
    if (serverPagination || !searchTerm) return data;
    const term = searchTerm.toLowerCase();
    
    return data.filter((row) => {
      const fieldsToSearch = searchFields.length > 0 
        ? searchFields 
        : Object.keys(row);
        
      return fieldsToSearch.some((key) => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchFields, serverPagination]);

  // Client-side Sort logic
  const sortedData = useMemo(() => {
    if (serverPagination || !sortConfig.key) return searchedData;
    
    const sorted = [...searchedData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [searchedData, sortConfig, serverPagination]);

  // Pagination logic
  const actualTotalRows = serverPagination ? totalRows : sortedData.length;
  const totalPages = Math.ceil(actualTotalRows / pageSize) || 1;
  
  const paginatedData = useMemo(() => {
    if (serverPagination) return data; // Data is already paginated by server
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, serverPagination, data]);

  // Reset page when search changes (only for client side, or if we want it for server side too)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [serverPagination ? debouncedSearch : searchTerm, pageSize, data.length]);

  const handleSort = (key, sortable) => {
    if (sortable === false) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      key = null;
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (column) => {
    if (column.sortable === false) return null;
    if (sortConfig.key !== column.accessor) {
      return <ChevronsUpDown size={14} className="text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-accent-indigo" />
      : <ChevronDown size={14} className="text-accent-indigo" />;
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      {(enableSearch || filterComponent) && (
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {enableSearch ? (
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-slate-900 border border-slate-800 focus:border-accent-indigo focus:ring-2 focus:ring-accent-indigo/20 rounded-lg py-1.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-all outline-none"
              />
            </div>
          ) : <div />}

          {filterComponent && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs flex items-center gap-1 font-semibold">
                <SlidersHorizontal size={14} /> FILTERS:
              </span>
              {filterComponent}
            </div>
          )}
        </div>
      )}

      {/* Main Table Grid */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800">
                {columns.map((col, idx) => (
                  <th
                    key={col.accessor || idx}
                    onClick={() => handleSort(col.accessor, col.sortable)}
                    className={`px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 select-none ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-800/40 group' : ''} ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.header}
                      {getSortIcon(col)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-transparent">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rIdx) => (
                  <tr
                    key={row[keyField] || rIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`hover:bg-slate-800/20 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={col.accessor || cIdx}
                        className={`px-5 py-3.5 text-sm text-slate-300 ${col.className || ''}`}
                      >
                        {col.render ? col.render(row, rIdx) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                      <Search size={40} className="stroke-1 opacity-50" />
                      <p className="text-base font-semibold text-slate-400">No matching entries found</p>
                      <p className="text-xs max-w-xs text-slate-500">
                        Adjust your search parameters or add a new record to populate this table.
                      </p>
                      {searchTerm && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchTerm('')}
                          className="mt-2"
                        >
                          Clear Search Filter
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Controls */}
        {sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-5 py-4 border-t border-slate-800 bg-slate-900/30 gap-4 text-xs">
            {/* Entry Size Selector */}
            <div className="flex items-center gap-2 text-slate-400 font-medium">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-accent-indigo text-slate-200 outline-none cursor-pointer"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>entries</span>
              <span className="text-slate-600 pl-2">|</span>
              <span className="text-slate-500 pl-2">
                Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} to{' '}
                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
              </span>
            </div>

            {/* Pagination Navigation */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // Show first, last, and pages around current page
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - currentPage) <= 1
                ) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      className="w-8 h-8 !p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
                if (
                  pageNum === 2 ||
                  pageNum === totalPages - 1
                ) {
                  return <span key={pageNum} className="text-slate-500 px-1 select-none">...</span>;
                }
                return null;
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;
