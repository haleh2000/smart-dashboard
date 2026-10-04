import { JalaliDatePicker } from './JalaliDatePicker';

interface DateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
}

/**
 * Date + time field used by the custom range filter.
 * A Jalali calendar modal (Day date-picker look) opens on click; the trigger
 * keeps the shared form-field chrome so it lines up with the inputs beside it.
 */
export function DateTimePicker({ label, value, onChange }: DateTimePickerProps) {
  return <JalaliDatePicker label={label} value={value} onChange={onChange} />;
}
