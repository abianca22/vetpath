interface PaginationProps {
    total: number;
    page: number;
    pageSize: number;
    onChange: (page: number) => void;
}

export default function Pagination({ total, page, pageSize, onChange }: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    function pages(): (number | "...")[] {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
        if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, "...", page - 1, page, page + 1, "...", totalPages];
    }

    return (
        <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-xs text-slate-400 select-none">
                {total === 0 ? "0 rezultate" : `${from}–${to} din ${total}`}
            </span>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    ←
                </button>

                {pages().map((p, i) =>
                    p === "..." ? (
                        <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-slate-400">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onChange(p as number)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                                p === page
                                    ? "bg-emerald-600 text-white"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    →
                </button>
            </div>
        </div>
    );
}
