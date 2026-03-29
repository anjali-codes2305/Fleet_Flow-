import { ReactNode } from "react";
import { motion } from "framer-motion";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
}

function DataTable<T>({ columns, data, keyField, onRowClick }: DataTableProps<T>) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card overflow-hidden"
    >
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-3"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">No records found</p>
                    <p className="text-xs text-muted-foreground/60">Data will appear here when available</p>
                  </motion.div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <motion.tr
                  key={String(row[keyField])}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-border/30 last:border-0 transition-all duration-250 ${
                    onRowClick ? "cursor-pointer" : ""
                  } hover:bg-secondary/50 table-row-hover`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3 text-sm ${col.className || ""}`}>
                      {typeof col.accessor === "function"
                        ? col.accessor(row)
                        : String(row[col.accessor] ?? "")}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default DataTable;
