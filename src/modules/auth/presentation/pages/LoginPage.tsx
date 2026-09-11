import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { formatPersianNumber } from '@/shared/lib/format';
import { Button, ThemeToggle } from '@/shared/ui';
import { useCurrentUserQuery } from '../sessionQueries';
import { useLoginFlow } from '../useLoginFlow';
import './LoginPage.css';

const onSubmit = (handler: () => void) => (event: FormEvent) => {
  event.preventDefault();
  handler();
};

export function LoginPage() {
  const location = useLocation();
  const { data: user } = useCurrentUserQuery();
  const { step, error, pending, submitMobile, submitPassword, restart } = useLoginFlow();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  return (
    <main className="login">
      <div className="login__theme">
        <ThemeToggle />
      </div>

      <section className="login__card">
        <header className="login__brand">
          <span className="login__lockup">
            <img className="login__didi" src="/brand/didi.png" alt="" aria-hidden="true" />
            <img className="login__logo" src="/brand/daydar-logo.png" alt="دی‌دار — بیمه دی" />
          </span>
          <h1 className="login__title">SMART</h1>
          <p className="login__subtitle">داشبورد پشتیبانی هوشمند — بیمه دی</p>
        </header>

        {/* key re-mounts the phase so the enter animation plays on every step. */}
        <div key={step.kind} className="login__phase">
          {step.kind === 'mobile' ? (
            <form
              className="login__form"
              noValidate
              onSubmit={onSubmit(() => submitMobile(mobile))}
            >
              <p className="login__lead">برای ورود، شماره موبایل خود را وارد کنید.</p>
              <label className="form-field">
                <span className="form-field__label">شماره موبایل</span>
                <input
                  className="form-input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                  maxLength={13}
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  autoFocus
                />
              </label>
              <Button type="submit">ادامه</Button>
            </form>
          ) : (
            <form
              className="login__form"
              noValidate
              onSubmit={onSubmit(() => submitPassword(password))}
            >
              <p className="login__lead">
                رمز عبور حساب{' '}
                <bdi className="login__mobile">{formatPersianNumber(step.mobile)}</bdi> را وارد
                کنید.
              </p>
              <label className="form-field">
                <span className="form-field__label">رمز عبور</span>
                <input
                  className="form-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="رمز عبور"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoFocus
                />
              </label>
              <Button type="submit" disabled={pending}>
                {pending ? 'در حال ورود…' : 'ورود'}
              </Button>
              <button className="login__secondary" type="button" onClick={restart}>
                تغییر شماره موبایل
              </button>
            </form>
          )}
        </div>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
