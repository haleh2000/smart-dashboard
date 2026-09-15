import { useState, type ReactNode } from 'react';
import { downloadCsv } from '@/shared/lib/csv';
import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { Button, SegmentedControl } from '@/shared/ui';
import type { Importance, SubjectRow } from '../../domain/analytics';
import type { DashboardFilters } from '../../domain/filters';
import './SubjectTree.css';

interface TreeNode {
  path: string[];
  label: string;
  count: number;
  share: number;
  /** The most important (lowest) importance among its leaves. */
  importance: Importance;
  children: TreeNode[];
}

type ImportanceFilter = 'all' | '1' | '2';

const buildTree = (rows: readonly SubjectRow[]): TreeNode[] => {
  const root: TreeNode[] = [];
  for (const row of rows) {
    let level = root;
    const path: string[] = [];
    for (const label of [row.subject1, row.subject2, row.subject3]) {
      path.push(label);
      let node = level.find((n) => n.label === label);
      if (!node) {
        node = { path: [...path], label, count: 0, share: 0, importance: 2, children: [] };
        level.push(node);
      }
      node.count += row.count;
      node.share += row.share;
      if (row.importance < node.importance) node.importance = row.importance;
      level = node.children;
    }
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => b.count - a.count);
    nodes.forEach((node) => sort(node.children));
  };
  sort(root);
  return root;
};

const keyOf = (path: readonly string[]) => path.join(' › ');

interface SubjectTreeProps {
  rows: readonly SubjectRow[];
  filters: DashboardFilters;
  onSelect: (path: readonly string[]) => void;
}

/**
 * Power BI's hierarchical Subject table: Subject1 → Subject2 → Subject3 with expand/collapse,
 * Count / Percent / Importance, and an Importance filter. Clicking a row filters the dashboard.
 */
export function SubjectTree({ rows, filters, onSelect }: SubjectTreeProps) {
  const [importance, setImportance] = useState<ImportanceFilter>('all');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const visibleRows =
    importance === 'all' ? rows : rows.filter((row) => String(row.importance) === importance);
  const tree = buildTree(visibleRows);
  const selectedPath = [filters.subject1, filters.subject2, filters.subject3].filter(
    (v): v is string => Boolean(v),
  );

  const isSelected = (path: readonly string[]) =>
    path.length === selectedPath.length && path.every((v, i) => selectedPath[i] === v);
  /** Nodes on the selected path open automatically (Power BI drill-down). */
  const isOpen = (node: TreeNode) =>
    expanded.has(keyOf(node.path)) ||
    (node.path.length < selectedPath.length && node.path.every((v, i) => selectedPath[i] === v));

  const toggle = (node: TreeNode) =>
    setExpanded((current) => {
      const next = new Set(current);
      const key = keyOf(node.path);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const exportRows = () =>
    downloadCsv(
      'subjects',
      ['Subject1', 'Subject2', 'Subject3', 'Count_Subject3', 'Percent_Subject3', 'Importance'],
      visibleRows.map((row) => [
        row.subject1,
        row.subject2,
        row.subject3,
        row.count,
        (row.share * 100).toFixed(2),
        row.importance,
      ]),
    );

  const renderNode = (node: TreeNode): ReactNode[] => {
    const open = isOpen(node);
    const leaf = node.children.length === 0;
    return [
      <tr
        key={keyOf(node.path)}
        className={cn(
          'subject-tree__row',
          `subject-tree__row--level-${node.path.length}`,
          isSelected(node.path) && 'subject-tree__row--selected',
        )}
      >
        <td>
          <span className="subject-tree__cell">
            {leaf ? (
              <span className="subject-tree__spacer" />
            ) : (
              <button
                type="button"
                className="subject-tree__toggle"
                aria-expanded={open}
                aria-label={`${open ? 'بستن' : 'باز کردن'} ${node.label}`}
                onClick={() => toggle(node)}
              >
                {open ? '▾' : '◂'}
              </button>
            )}
            <button
              type="button"
              className="subject-tree__label"
              aria-pressed={isSelected(node.path)}
              onClick={() => onSelect(node.path)}
            >
              {node.label}
            </button>
          </span>
        </td>
        <td className="subject-tree__number">{formatPersianNumber(node.count)}</td>
        <td className="subject-tree__number">{formatPercent(node.share)}</td>
        <td className="subject-tree__number">{formatPersianNumber(node.importance)}</td>
      </tr>,
      ...(open ? node.children.flatMap(renderNode) : []),
    ];
  };

  const total = visibleRows.reduce(
    (sum, row) => ({ count: sum.count + row.count, share: sum.share + row.share }),
    { count: 0, share: 0 },
  );

  return (
    <div className="subject-tree">
      <div className="subject-tree__toolbar">
        <SegmentedControl<ImportanceFilter>
          label="فیلتر IsImportance"
          value={importance}
          onChange={setImportance}
          options={[
            { value: 'all', label: 'همه اولویت‌ها' },
            { value: '1', label: 'اولویت ۱' },
            { value: '2', label: 'اولویت ۲' },
          ]}
        />
        <Button variant="ghost" className="btn--small" onClick={exportRows}>
          خروجی Excel   
        </Button>
      </div>
      <div className="subject-tree__scroll">
        <table className="subject-tree__table">
          <thead>
            <tr>
              <th scope="col">موضوع اصلی / موضوع فرعی / ریزموضوع</th>
              <th scope="col">تعداد</th>
              <th scope="col">درصد</th>
              <th scope="col">فراوانی</th>
            </tr>
          </thead>
          <tbody>{tree.flatMap(renderNode)}</tbody>
          <tfoot>
            <tr>
              <th scope="row">مجموع</th>
              <td className="subject-tree__number">{formatPersianNumber(total.count)}</td>
              <td className="subject-tree__number">{formatPercent(total.share)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
