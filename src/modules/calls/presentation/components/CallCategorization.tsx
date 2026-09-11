import type { SubjectPath } from '@/shared/domain/insights';
import { ErrorState, SkeletonTable } from '@/shared/ui';
import { useCategorizeCall, useSubjectTree } from '../hooks/callQueries';
import { SubjectPicker } from './SubjectPicker';
import './CallCategorization.css';

interface CallCategorizationProps {
  callId: string;
  current?: SubjectPath;
  saveLabel?: string;
  onSaved?: () => void;
}

/** Loads the subject tree and saves the agent's 3-level categorization of one call. */
export function CallCategorization({
  callId,
  current,
  saveLabel,
  onSaved,
}: CallCategorizationProps) {
  const tree = useSubjectTree();
  const categorize = useCategorizeCall();

  if (tree.isPending) return <SkeletonTable rows={3} />;
  if (tree.isError)
    return (
      <ErrorState message="دریافت دسته‌بندی‌ها با خطا مواجه شد." onRetry={() => tree.refetch()} />
    );

  return (
    <>
      <SubjectPicker
        // Re-mount after a save so the picker starts from the stored path.
        key={current ? `${current.level1}/${current.level2}/${current.level3}` : 'none'}
        tree={tree.data}
        initial={current}
        pending={categorize.isPending}
        saveLabel={saveLabel}
        onSave={(subject) =>
          categorize.mutate({ id: callId, subject }, { onSuccess: () => onSaved?.() })
        }
      />
      {categorize.isError && (
        <p className="call-categorization__error" role="alert">
          ثبت دسته‌بندی با خطا مواجه شد. دوباره تلاش کنید.
        </p>
      )}
      {categorize.isSuccess && (
        <p className="call-categorization__saved" role="status">
          دسته‌بندی ثبت شد.
        </p>
      )}
    </>
  );
}
