import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SubjectNode } from '@/shared/domain/insights';
import { SubjectPicker } from './SubjectPicker';

const leaf = (label: string): SubjectNode => ({ label, children: [] });
const tree: SubjectNode[] = [
  {
    label: 'پس از صدور',
    children: [
      { label: 'اعلام خسارت', children: [leaf('ثبت پرونده خسارت'), leaf('پیگیری پرداخت')] },
      { label: 'الحاقیه', children: [leaf('تغییر پلاک')] },
    ],
  },
  { label: 'صدور', children: [{ label: 'خرید', children: [leaf('استعلام قیمت')] }] },
];

const select = (name: string) => screen.getByRole('combobox', { name });

describe('SubjectPicker', () => {
  it('saves only once all three levels are chosen', async () => {
    const onSave = vi.fn();
    render(<SubjectPicker tree={tree} onSave={onSave} />);
    const save = screen.getByRole('button', { name: 'ثبت دسته‌بندی' });

    await userEvent.selectOptions(select('موضوع اصلی'), 'پس از صدور');
    await userEvent.selectOptions(select('موضوع فرعی'), 'اعلام خسارت');
    expect(save).toBeDisabled();

    await userEvent.selectOptions(select('علت'), 'ثبت پرونده خسارت');
    await userEvent.click(save);

    expect(onSave).toHaveBeenCalledWith({
      level1: 'پس از صدور',
      level2: 'اعلام خسارت',
      level3: 'ثبت پرونده خسارت',
    });
  });

  it('clears deeper levels when a parent changes', async () => {
    render(
      <SubjectPicker
        tree={tree}
        initial={{ level1: 'پس از صدور', level2: 'الحاقیه', level3: 'تغییر پلاک' }}
        onSave={vi.fn()}
      />,
    );

    await userEvent.selectOptions(select('موضوع اصلی'), 'صدور');

    expect(select('موضوع فرعی')).toHaveValue('');
    expect(select('علت')).toHaveValue('');
    expect(select('علت')).toBeDisabled();
    expect(screen.getByRole('option', { name: 'خرید' })).toBeInTheDocument();
  });
});
