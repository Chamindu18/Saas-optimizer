import React from 'react';

export function ManagementTable({ label, columns, rows, rowKey }) {
  return <div className="sw-management__table-scroll" role="region" aria-label={`${label} table`} tabIndex={0}>
    <table className="sw-management__table">
      <caption className="sw-sr-only">{label}</caption>
      <thead><tr>{columns.map(column => <th key={column.key} scope="col" className={column.className}>{column.label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={rowKey(row)}>{columns.map((column, index) => {
        const Cell = index === 0 ? 'th' : 'td';
        return <Cell key={column.key} {...(index === 0 ? { scope: 'row' } : {})} className={column.className}>
          {column.render ? column.render(row) : row[column.key]}
        </Cell>;
      })}</tr>)}</tbody>
    </table>
  </div>;
}
