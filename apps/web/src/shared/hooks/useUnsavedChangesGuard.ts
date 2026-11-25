import { useCallback, useState } from 'react';

const defaultMessage = '当前表单有未保存的修改，确定要放弃这些修改吗？';

export function useUnsavedChangesGuard(message = defaultMessage) {
  const [dirtyKeys, setDirtyKeys] = useState<Record<string, boolean>>({});

  const markDirty = useCallback((key = 'default') => {
    setDirtyKeys((current) => current[key] ? current : { ...current, [key]: true });
  }, []);

  const resetDirty = useCallback((key = 'default') => {
    setDirtyKeys((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const isDirty = useCallback((key = 'default') => Boolean(dirtyKeys[key]), [dirtyKeys]);

  const confirmDiscard = useCallback((key = 'default') => {
    if (!dirtyKeys[key]) return true;
    if (typeof window === 'undefined') return true;
    return window.confirm(message);
  }, [dirtyKeys, message]);

  const guard = useCallback((key: string, action: () => void) => {
    if (!confirmDiscard(key)) return false;
    resetDirty(key);
    action();
    return true;
  }, [confirmDiscard, resetDirty]);

  return { markDirty, resetDirty, isDirty, confirmDiscard, guard };
}
