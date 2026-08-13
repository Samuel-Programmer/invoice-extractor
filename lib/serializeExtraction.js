export function serializeExtraction(record) {
  return {
    ...record,
    total: record.total === null || record.total === undefined ? null : Number(record.total),
    invoiceDate: record.invoiceDate ? record.invoiceDate.toISOString().slice(0, 10) : null,
    createdAt: record.createdAt.toISOString(),
  };
}
