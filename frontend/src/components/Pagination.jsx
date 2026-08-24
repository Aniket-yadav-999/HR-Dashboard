import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const anchorRef = useRef(null);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  function changePage(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    startTransition(() => setPage(safePage));
    window.requestAnimationFrame(() => anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return {
    anchorRef,
    changePage,
    isPending,
    page,
    pageItems,
    resetPage: () => setPage(1),
    totalPages
  };
}

function pageNumbers(page, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const values = new Set([1, totalPages, page - 1, page, page + 1]);
  return [...values].filter((value) => value > 0 && value <= totalPages).sort((a, b) => a - b);
}

export function PaginationControls({ page, totalPages, totalItems, pageSize, onPageChange, isPending = false }) {
  if (totalItems <= pageSize) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pages = pageNumbers(page, totalPages);

  return <nav className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
    <p className="text-xs font-bold text-slate-500">Showing {start}–{end} of {totalItems}</p>
    <div className={`flex items-center gap-1 overflow-x-auto pb-1 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <button type="button" disabled={page === 1 || isPending} onClick={() => onPageChange(page - 1)} className="pagination-button" aria-label="Previous page"><ChevronLeft size={16} /></button>
      {pages.map((value, index) => <span key={value} className="contents">{index > 0 && value - pages[index - 1] > 1 ? <span className="px-1 text-slate-400">…</span> : null}<button type="button" onClick={() => onPageChange(value)} className={`pagination-button ${page === value ? "pagination-button-active" : ""}`} aria-current={page === value ? "page" : undefined}>{value}</button></span>)}
      <button type="button" disabled={page === totalPages || isPending} onClick={() => onPageChange(page + 1)} className="pagination-button" aria-label="Next page"><ChevronRight size={16} /></button>
    </div>
  </nav>;
}
