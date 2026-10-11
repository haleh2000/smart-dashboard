import { JalaliDatePicker } from './JalaliDatePicker';

interface DateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
}
export function DateTimePicker({ label, value, onChange }: DateTimePickerProps) {
  return <JalaliDatePicker label={label} value={value} onChange={onChange} />;
}
