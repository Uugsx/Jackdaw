export type ReportSortDirection = "asc" | "desc";

export interface ReportSortState<Column extends string> {
  column: Column;
  direction: ReportSortDirection;
}

export type ReportSortValue = Date | number | string | null | undefined;

/** Переключает сортировку колонки: по возрастанию → по убыванию → без сортировки. */
export function toggleReportSort<Column extends string>(
  current: ReportSortState<Column> | null,
  column: Column,
): ReportSortState<Column> | null {
  if (!current || current.column !== column) {
    return { column, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { column, direction: "desc" };
  }
  return null;
}

/** Сортирует строки стабильно, не изменяя исходный массив. Пустые значения остаются внизу. */
export function sortReportRows<T, Column extends string>(
  rows: readonly T[],
  state: ReportSortState<Column> | null,
  getValue: (row: T, column: Column) => ReportSortValue,
): T[] {
  if (!state) {
    return rows.slice();
  }

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftValue = getValue(left.row, state.column);
      const rightValue = getValue(right.row, state.column);
      const leftEmpty = isEmptySortValue(leftValue);
      const rightEmpty = isEmptySortValue(rightValue);

      if (leftEmpty || rightEmpty) {
        if (leftEmpty && rightEmpty) {
          return left.index - right.index;
        }
        return leftEmpty ? 1 : -1;
      }

      const comparison = compareReportSortValues(leftValue, rightValue);
      return state.direction === "asc"
        ? comparison || left.index - right.index
        : -comparison || left.index - right.index;
    })
    .map(({ row }) => row);
}

function isEmptySortValue(value: ReportSortValue): boolean {
  if (value == null) {
    return true;
  }
  return typeof value === "number" && !Number.isFinite(value);
}

function compareReportSortValues(
  left: ReportSortValue,
  right: ReportSortValue,
): number {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
