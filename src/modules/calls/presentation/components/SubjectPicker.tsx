import { useState } from 'react';
import type { SubjectNode, SubjectPath } from '@/shared/domain/insights';
import { Button } from '@/shared/ui';
import { isCompleteSubject } from '../../domain/call';
import './SubjectPicker.css';

interface SubjectPickerProps {
  tree: readonly SubjectNode[];
  initial?: SubjectPath;
  pending?: boolean;
  saveLabel?: string;
  onSave: (subject: SubjectPath) => void;
}

const LEVEL_LABELS = ['موضوع اصلی', 'موضوع فرعی', 'علت'] as const;

/**
 * «دسته‌بندی سه‌سطحی»: three cascading selects. Changing a parent level clears the deeper
 * ones; saving is possible only once all three levels are chosen.
 */
export function SubjectPicker({
  tree,
  initial,
  pending = false,
  saveLabel = 'ثبت دسته‌بندی',
  onSave,
}: SubjectPickerProps) {
  const [path, setPath] = useState<Partial<SubjectPath>>(initial ?? {});

  const level2Options = tree.find((node) => node.label === path.level1)?.children ?? [];
  const level3Options = level2Options.find((node) => node.label === path.level2)?.children ?? [];

  const levels = [
    {
      value: path.level1,
      options: tree,
      set: (level1: string) => setPath({ level1: level1 || undefined }),
    },
    {
      value: path.level2,
      options: level2Options,
      set: (level2: string) => setPath({ level1: path.level1, level2: level2 || undefined }),
    },
    {
      value: path.level3,
      options: level3Options,
      set: (level3: string) => setPath({ ...path, level3: level3 || undefined }),
    },
  ];

  const complete = isCompleteSubject(path);
  const unchanged =
    initial !== undefined &&
    initial.level1 === path.level1 &&
    initial.level2 === path.level2 &&
    initial.level3 === path.level3;

  return (
    <form
      className="subject-picker"
      onSubmit={(event) => {
        event.preventDefault();
        if (isCompleteSubject(path)) onSave(path);
      }}
    >
      {levels.map((level, index) => (
        <label key={LEVEL_LABELS[index]} className="form-field">
          <span className="form-field__label form-field__label--required">
            {LEVEL_LABELS[index]}
          </span>
          <select
            className="form-select"
            value={level.value ?? ''}
            disabled={level.options.length === 0}
            onChange={(event) => level.set(event.target.value)}
          >
            <option value="">انتخاب کنید</option>
            {level.options.map((node) => (
              <option key={node.label} value={node.label}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <Button type="submit" disabled={!complete || unchanged || pending}>
        {pending ? 'در حال ثبت…' : saveLabel}
      </Button>
    </form>
  );
}
