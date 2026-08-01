// Client-side export helpers: CSV, Excel (HTML-table .xls), and print.

const sanitize = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

export const toCSV = (rows) => {
  if (!rows || !rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${sanitize(row[h]).replace(/"/g, '""')}"`).join(',')
    ),
  ];
  return lines.join('\n');
};

export const exportToCSV = (filename, rows) => {
  const blob = new Blob(['\ufeff' + toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Excel-compatible export built from an HTML table (opens directly in Excel).
export const exportToExcel = (filename, rows) => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => sanitize(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const thead = `<tr>${headers.map((h) => `<th>${escape(h)}</th>`).join('')}</tr>`;
  const tbody = rows
    .map(
      (row) =>
        `<tr>${headers.map((h) => `<td>${escape(row[h])}</td>`).join('')}</tr>`
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">${thead}${tbody}</table>
      </body>
    </html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export current report page to PDF via the browser print dialog.
export const printReport = () => {
  window.print();
};
