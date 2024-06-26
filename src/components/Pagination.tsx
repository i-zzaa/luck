import { useState } from 'react';

export interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onChange: (page: number) => any;
}

export default function Pagination( { totalPages, currentPage, onChange}: PaginationProps) {
  const [currentPageLocal, setCurrentPageLocal] = useState(currentPage || 1);

  const handleNext = () => {
    setCurrentPageLocal(currentPageLocal + 1)
    onChange(currentPageLocal + 1)
  };
  const handlePrev = () => {
    setCurrentPageLocal(currentPageLocal - 1)
    onChange(currentPageLocal - 1)
  };

  return (
    <div className="flex items-center justify-center p-2 gap-2 mt-1">
      <button onClick={handlePrev}  disabled={currentPageLocal === 1} className="bg-transparent w-12 h-12 cursor-pointer hover:scale-110 duration-700 text-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:text-slate-200">      
        <i  className="pi pi-arrow-circle-left"    />
      </button>
      <span className='text-primary font-inter'>{ currentPageLocal } de { totalPages }</span>
      <button onClick={handleNext} disabled={currentPageLocal === totalPages} className="bg-transparent w-12 h-12 cursor-pointer hover:scale-110 duration-700 text-primary  disabled:opacity-30 disabled:cursor-not-allowed disabled:text-slate-200">      
        <i  className="pi pi-arrow-circle-right"   />
      </button>    
    </div>
  );
}


