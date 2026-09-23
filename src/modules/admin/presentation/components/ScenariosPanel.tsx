import { useState, type FormEvent } from 'react';
import { formatPersianNumber } from '@/shared/lib/format';
import {
  Button,
  DataTable,
  Dialog,
  EmptyState,
  ErrorState,
  SkeletonTable,
  TagList,
  type DataColumn,
} from '@/shared/ui';
import { parseKeywords, type Scenario } from '../../domain/settings';
import { useCreateScenario, useScenarios, useSetScenarioActive } from '../hooks/adminQueries';
import './AdminForms.css';
import './SettingsPanels.css';

function ScenarioFormDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerSubject, setTriggerSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [nameError, setNameError] = useState(false);
  const create = useCreateScenario();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    create.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        triggerSubject: triggerSubject.trim() || undefined,
        keywords: parseKeywords(keywords),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open
      title="سناریوی جدید"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" form="scenario-form" disabled={create.isPending}>
            {create.isPending ? 'در حال ذخیره…' : 'ذخیره'}
          </Button>
        </>
      }
    >
      <form id="scenario-form" className="admin-form" onSubmit={submit} noValidate>
        <label className="form-field">
          <span className="form-field__label form-field__label--required">نام سناریو</span>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={nameError}
          />
          {nameError && (
            <span className="admin-form__error" role="alert">
              نام سناریو را وارد کنید.
            </span>
          )}
        </label>
        <label className="form-field">
          <span className="form-field__label">شرح اقدام</span>
          <textarea
            className="form-input form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
       <label className="form-field">
  <span className="form-field__label">تگ‌های AI</span> {/* تغییر از 'کلیدواژه‌ها' */}
  <textarea
    className="form-input form-textarea"
    value={keywords}
    placeholder="با ویرگول جدا کنید: خسارت، تاخیر، پرداخت"
    onChange={(e) => setKeywords(e.target.value)}
  />
  <span className="form-field__hint">
    هنگامی که این تگ‌ها در متن مکالمه دیده شوند، AI سناریو را پیشنهاد می‌دهد.
  </span>
        </label>

        <label className="form-field">
          <span className="form-field__label">کلیدواژه‌ها</span>
          <textarea
            className="form-input form-textarea"
            value={keywords}
            placeholder="با ویرگول جدا کنید: خسارت، تاخیر، پرداخت"
            onChange={(e) => setKeywords(e.target.value)}
          />
          <span className="form-field__hint">
            هنگامی که این کلیدواژه‌ها در متن مکالمه دیده شوند، AI سناریو را پیشنهاد می‌دهد.
          </span>
        </label>
        {create.isError && (
          <p className="admin-form__banner" role="alert">
            ذخیره سناریو با خطا مواجه شد.
          </p>
        )}
      </form>
    </Dialog>
  );
}

/** «سناریوها و قوانین»: playbooks the AI suggests as «Suggested Scenario». */
export function ScenariosPanel() {
  const { data, isPending, isError, refetch } = useScenarios();
  const setActive = useSetScenarioActive();
  const [creating, setCreating] = useState(false);

  const columns: DataColumn<Scenario>[] = [
    {
      header: 'سناریو',
      cell: (s) => (
        <span className="scenarios__name">
          <strong>{s.name}</strong>
          {s.description && <span className="scenarios__description">{s.description}</span>}
        </span>
      ),
    },
    {
      header: 'موضوع فعال‌کننده',
      cell: (s) => s.triggerSubject ?? <span className="queue-table__muted">همه موضوع‌ها</span>,
    },
    { header: 'کلیدواژه‌ها', cell: (s) => <TagList tags={s.keywords} /> },
    { header: 'پیشنهاد در ۳۰ روز', cell: (s) => formatPersianNumber(s.suggestionCount) },
    {
      header: 'فعال',
      interactive: true,
      cell: (s) => (
        <label className="form-checkbox">
          <input
            type="checkbox"
            checked={s.active}
            aria-label={`فعال بودن ${s.name}`}
            disabled={setActive.isPending}
            onChange={(e) => setActive.mutate({ id: s.id, active: e.target.checked })}
          />
        </label>
      ),
    },
  ];

  return (
    <div className="scenarios">
      <div className="scenarios__toolbar">
     <p className="scenarios__hint">
      سناریوها بر اساس موضوع و تگ‌های AI مکالمه، به‌عنوان «Suggested Scenario» به اپراتور
      پیشنهاد می‌شوند.
    </p>

        <Button onClick={() => setCreating(true)}>سناریوی جدید</Button>
      </div>
      {isPending ? (
        <SkeletonTable rows={5} />
      ) : isError ? (
        <ErrorState message="دریافت سناریوها با خطا مواجه شد." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState message="هنوز سناریویی تعریف نشده است." />
      ) : (
        <DataTable rows={data} columns={columns} rowKey={(s) => s.id} />
      )}
      {creating && <ScenarioFormDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
