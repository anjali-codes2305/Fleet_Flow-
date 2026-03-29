export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(","))
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(title: string, data: Record<string, any>[]) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  
  const html = `
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
      h1 { font-size: 24px; margin-bottom: 8px; }
      p.meta { color: #666; font-size: 12px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #f5f5f5; text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
      td { padding: 8px 12px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) { background: #fafafa; }
    </style></head><body>
    <h1>${title}</h1>
    <p class="meta">Generated on ${new Date().toLocaleDateString()} | FleetFlow Report</p>
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${data.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    </body></html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}
