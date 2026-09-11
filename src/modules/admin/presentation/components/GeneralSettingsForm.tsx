import { useState, type FormEvent } from 'react';
import { formatPersianNumber, toLatinDigits } from '@/shared/lib/format';
import { Button, InfoCard } from '@/shared/ui';
import {
  settingsRange,
  validateSettings,
  type SettingsErrors,
  type SettingsField,
  type SystemSettings,
} from '../../domain/settings';
import { settingsLabels } from '../adminLabels';
import { useUpdateSettings } from '../hooks/adminQueries';
import './AdminForms.css';

type NumberField =
  | 'slaDays'
  | 'defaultPageSize'
  | 'negativeSentimentAlert'
  | 'repeatCallThreshold'
  | 'voiceRetentionDays';
type ToggleField = 'incomingCallPopup' | 'autoTagging' | 'transcription';

const NUMBER_FIELDS: readonly NumberField[] = [
  'slaDays',
  'defaultPageSize',
  'negativeSentimentAlert',
  'repeatCallThreshold',
  'voiceRetentionDays',
];
const TOGGLE_FIELDS: readonly ToggleField[] = ['incomingCallPopup', 'autoTagging', 'transcription'];

/** The ratio is edited as a percentage. */
const isPercent = (field: SettingsField) => field === 'negativeSentimentAlert';
const toDisplay = (field: NumberField, value: number) =>
  formatPersianNumber(isPercent(field) ? Math.round(value * 100) : value);
const fromDisplay = (field: NumberField, text: string) => {
  const value = Number(toLatinDigits(text.trim()));
  return text.trim() === '' ? Number.NaN : isPercent(field) ? value / 100 : value;
};

const rangeText = (field: NumberField) => {
  const range = settingsRange(field);
  if (!range) return undefined;
  const [min, max] = isPercent(field) ? range.map((v) => Math.round(v * 100)) : range;
  return `بین ${formatPersianNumber(min!)} و ${formatPersianNumber(max!)}`;
};

type Drafts = Record<NumberField, string>;

const draftsOf = (settings: SystemSettings) =>
  Object.fromEntries(NUMBER_FIELDS.map((f) => [f, toDisplay(f, settings[f])])) as Drafts;

/** «تنظیمات عمومی». Mount with the loaded settings; reset returns to them. */
export function GeneralSettingsForm({ initial }: { initial: SystemSettings }) {
  const [numbers, setNumbers] = useState<Drafts>(() => draftsOf(initial));
  const [toggles, setToggles] = useState<Pick<SystemSettings, ToggleField>>(initial);
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [saved, setSaved] = useState(false);
  const update = useUpdateSettings();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    const settings: SystemSettings = {
      ...initial,
      ...toggles,
      ...(Object.fromEntries(NUMBER_FIELDS.map((f) => [f, fromDisplay(f, numbers[f])])) as Pick<
        SystemSettings,
        NumberField
      >),
    };
    const found = validateSettings(settings);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    update.mutate(settings, {
      onSuccess: (result) => {
        setNumbers(draftsOf(result));
        setSaved(true);
      },
    });
  };

  const reset = () => {
    setNumbers(draftsOf(initial));
    setToggles(initial);
    setErrors({});
    setSaved(false);
  };

  return (
    <InfoCard title="تنظیمات عمومی">
      <form className="admin-form" onSubmit={submit} noValidate>
        <div className="admin-form__row">
          {NUMBER_FIELDS.map((field) => (
            <label key={field} className="form-field">
              <span className="form-field__label">{settingsLabels[field].label}</span>
              <input
                className="form-input"
                inputMode="numeric"
                value={numbers[field]}
                onChange={(e) => setNumbers((current) => ({ ...current, [field]: e.target.value }))}
                aria-invalid={Boolean(errors[field])}
              />
              {errors[field] ? (
                <span className="admin-form__error" role="alert">
                  مقدار باید {rangeText(field)} باشد.
                </span>
              ) : (
                <span className="form-field__hint">
                  {settingsLabels[field].hint ?? rangeText(field)}
                </span>
              )}
            </label>
          ))}
        </div>

        {TOGGLE_FIELDS.map((field) => (
          <label key={field} className="form-checkbox">
            <input
              type="checkbox"
              checked={toggles[field]}
              onChange={(e) => setToggles((current) => ({ ...current, [field]: e.target.checked }))}
            />
            {settingsLabels[field].label}
          </label>
        ))}

        {saved && (
          <p className="admin-form__success" role="status">
            تنظیمات ذخیره شد.
          </p>
        )}
        {update.isError && (
          <p className="admin-form__banner" role="alert">
            ذخیره تنظیمات با خطا مواجه شد.
          </p>
        )}

        <div className="admin-form__actions">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}
          </Button>
          <Button variant="ghost" onClick={reset}>
            بازنشانی
          </Button>
        </div>
      </form>
    </InfoCard>
  );
}
