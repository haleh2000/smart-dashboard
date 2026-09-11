import { useState } from 'react';
import { toLatinDigits } from '@/shared/lib/format';
import { InvalidCredentialsError, isValidMobile } from '../domain/credentials';
import { useSignIn } from './sessionQueries';

export type LoginStep = { kind: 'mobile' } | { kind: 'password'; mobile: string };

const messageFor = (error: unknown) =>
  error instanceof InvalidCredentialsError
    ? 'شماره موبایل یا رمز عبور اشتباه است.'
    : 'ورود با خطا مواجه شد. لطفاً دوباره تلاش کنید.';

/** Two-step sign-in: mobile → password. Holds view state only; rules live in the domain. */
export function useLoginFlow() {
  const [step, setStep] = useState<LoginStep>({ kind: 'mobile' });
  const [validationError, setValidationError] = useState<string | null>(null);
  const signIn = useSignIn();

  const submitMobile = (rawMobile: string) => {
    const mobile = toLatinDigits(rawMobile.trim());
    if (!isValidMobile(mobile)) {
      setValidationError('شماره موبایل را به شکل ۰۹۱۲۱۲۳۴۵۶۷ وارد کنید.');
      return;
    }
    setValidationError(null);
    setStep({ kind: 'password', mobile });
  };

  const submitPassword = (password: string) => {
    if (step.kind !== 'password') return;
    setValidationError(password ? null : 'رمز عبور را وارد کنید.');
    if (password) signIn.mutate({ mobile: step.mobile, password });
  };

  const restart = () => {
    signIn.reset();
    setValidationError(null);
    setStep({ kind: 'mobile' });
  };

  const error = validationError ?? (signIn.isError ? messageFor(signIn.error) : null);

  return { step, error, pending: signIn.isPending, submitMobile, submitPassword, restart };
}
