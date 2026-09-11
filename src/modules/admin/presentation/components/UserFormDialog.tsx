import { useId, useState, type FormEvent, type HTMLAttributes } from 'react';
import { ROLES, roleLabels, type Role } from '@/modules/auth';
import { toLatinDigits } from '@/shared/lib/format';
import { Button, Dialog } from '@/shared/ui';
import {
  DuplicateMobileError,
  hasErrors,
  validateStaffUser,
  type StaffUser,
  type StaffUserErrors,
  type StaffUserInput,
} from '../../domain/staffUser';
import { duplicateMobileMessage, userErrorMessages } from '../adminLabels';
import { useSaveUser } from '../hooks/adminQueries';
import './AdminForms.css';

interface UserFormDialogProps {
  open: boolean;
  /** Edits this user; creates a new one when absent. */
  user?: StaffUser;
  onClose: () => void;
}

const emptyInput: StaffUserInput = { fullName: '', mobile: '', email: '', role: 'agent', team: '' };

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  /** Latin-script values (mobile, email) read left-to-right. */
  ltr?: boolean;
  type?: 'text' | 'email';
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  placeholder?: string;
}

/** Label + input + inline error, wired with ids so the error never becomes part of the label. */
function TextField({
  label,
  value,
  onChange,
  error,
  required,
  ltr,
  type = 'text',
  inputMode,
  placeholder,
}: TextFieldProps) {
  const id = useId();
  return (
    <div className="form-field">
      <label
        htmlFor={id}
        className={required ? 'form-field__label form-field__label--required' : 'form-field__label'}
      >
        {label}
      </label>
      <input
        id={id}
        className="form-input"
        type={type}
        dir={ltr ? 'ltr' : undefined}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span id={`${id}-error`} className="admin-form__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Create / edit form. Mount with a `key` per user so the draft resets between users. */
export function UserFormDialog({ open, user, onClose }: UserFormDialogProps) {
  const [draft, setDraft] = useState<StaffUserInput>(
    user
      ? {
          fullName: user.fullName,
          mobile: user.mobile,
          email: user.email ?? '',
          role: user.role,
          team: user.team,
        }
      : emptyInput,
  );
  const [errors, setErrors] = useState<StaffUserErrors>({});
  const save = useSaveUser();

  const set = <K extends keyof StaffUserInput>(field: K, value: StaffUserInput[K]) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input: StaffUserInput = {
      fullName: draft.fullName.trim(),
      mobile: toLatinDigits(draft.mobile.trim()),
      email: draft.email?.trim() || undefined,
      role: draft.role,
      team: draft.team.trim(),
    };
    const found = validateStaffUser(input);
    setErrors(found);
    if (hasErrors(found)) return;
    save.mutate({ id: user?.id, input }, { onSuccess: onClose });
  };

  const formError = save.isError
    ? save.error instanceof DuplicateMobileError
      ? duplicateMobileMessage
      : 'ذخیره کاربر با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
    : null;

  const errorOf = (field: keyof StaffUserInput) =>
    errors[field] && userErrorMessages[errors[field]];

  return (
    <Dialog
      open={open}
      title={user ? 'ویرایش کاربر' : 'کاربر جدید'}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" form="user-form" disabled={save.isPending}>
            {save.isPending ? 'در حال ذخیره…' : 'ذخیره'}
          </Button>
        </>
      }
    >
      <form id="user-form" className="admin-form" onSubmit={submit} noValidate>
        <TextField
          label="نام و نام خانوادگی"
          required
          value={draft.fullName}
          error={errorOf('fullName')}
          onChange={(value) => set('fullName', value)}
        />
        <TextField
          label="موبایل"
          required
          ltr
          inputMode="numeric"
          placeholder="۰۹۱۲۱۲۳۴۵۶۷"
          value={draft.mobile}
          error={errorOf('mobile')}
          onChange={(value) => set('mobile', value)}
        />
        <TextField
          label="ایمیل"
          ltr
          type="email"
          value={draft.email ?? ''}
          error={errorOf('email')}
          onChange={(value) => set('email', value)}
        />
        <div className="admin-form__row">
          <label className="form-field">
            <span className="form-field__label form-field__label--required">نقش</span>
            <select
              className="form-select"
              value={draft.role}
              onChange={(e) => set('role', e.target.value as Role)}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="تیم / صف"
            required
            value={draft.team}
            error={errorOf('team')}
            onChange={(value) => set('team', value)}
          />
        </div>
        {formError && (
          <p className="admin-form__banner" role="alert">
            {formError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
