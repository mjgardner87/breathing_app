import {useRef, useCallback} from 'react';
import {StorageService} from '../services/StorageService';
import {SessionData} from '../types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseSessionSaverReturn {
  save: (session: SessionData) => Promise<boolean>;
  waitForSave: () => Promise<void>;
  getStatus: () => SaveStatus;
}

/**
 * Hook for managing session saving with proper mutex pattern.
 * Prevents race conditions and duplicate saves.
 */
export function useSessionSaver(): UseSessionSaverReturn {
  const statusRef = useRef<SaveStatus>('idle');
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const savedSessionIdRef = useRef<string | null>(null);

  const save = useCallback(async (session: SessionData): Promise<boolean> => {
    // Prevent duplicate saves of the same session
    if (savedSessionIdRef.current === session.id) {
      console.log('[SessionSaver] Session already saved:', session.id);
      return true;
    }

    // Prevent concurrent saves - wait for existing save
    if (statusRef.current === 'saving') {
      console.log('[SessionSaver] Save already in progress, waiting...');
      if (savePromiseRef.current) {
        try {
          await savePromiseRef.current;
          // Check if this was the same session
          if (savedSessionIdRef.current === session.id) {
            return true;
          }
        } catch {
          // Previous save failed, continue with new save
        }
      }
    }

    statusRef.current = 'saving';

    const saveOperation = async (): Promise<boolean> => {
      try {
        await StorageService.saveSession(session);
        savedSessionIdRef.current = session.id;
        statusRef.current = 'saved';
        console.log('[SessionSaver] Successfully saved session:', session.id);
        return true;
      } catch (error) {
        console.error('[SessionSaver] Failed to save session:', error);
        statusRef.current = 'error';
        return false;
      }
    };

    const promise = saveOperation();
    savePromiseRef.current = promise.then(() => {});

    const result = await promise;
    savePromiseRef.current = null;
    return result;
  }, []);

  const waitForSave = useCallback(async (): Promise<void> => {
    if (savePromiseRef.current) {
      try {
        await Promise.race([
          savePromiseRef.current,
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('Save timeout')), 5000)
          ),
        ]);
      } catch (error) {
        console.error('[SessionSaver] Error waiting for save:', error);
      }
    }
  }, []);

  const getStatus = useCallback((): SaveStatus => {
    return statusRef.current;
  }, []);

  return {
    save,
    waitForSave,
    getStatus,
  };
}
