export interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onChange: (page: number) => void;
}


import { useState, useEffect } from 'react';

export default function Pagination({ totalPages, currentPage, onChange }: PaginationProps) {
  const [localPage, setLocalPage] = useState(currentPage);

  useEffect(() => {
    setLocalPage(currentPage);
  }, [currentPage]);

  const updatePage = (page: number) => {
    setLocalPage(page);
    onChange(page);
  };

  const isFirstPage = localPage === 1;
  const isLastPage = localPage === totalPages;

  return (
    <div className="flex items-center justify-center p-2 gap-2 mt-1">
      <button
        onClick={() => updatePage(localPage - 1)}
        disabled={isFirstPage}
        className="bg-transparent w-12 h-12 cursor-pointer hover:scale-110 duration-700 text-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:text-slate-200"
      >
        <i className="pi pi-arrow-circle-left" />
      </button>

      <span className="text-primary font-inter">
        {localPage} de {totalPages}
      </span>

      <button
        onClick={() => updatePage(localPage + 1)}
        disabled={isLastPage}
        className="bg-transparent w-12 h-12 cursor-pointer hover:scale-110 duration-700 text-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:text-slate-200"
      >
        <i className="pi pi-arrow-circle-right" />
      </button>
    </div>
  );
}