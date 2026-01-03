import {useRef, useCallback} from 'react';
import {StorageService} from '../services/StorageService';
import {SessionData} from '../types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseSessionSaverReturn {
  save: (session: SessionData) => Promise<boolean>;
  retry: (session: SessionData) => Promise<boolean>;
  waitForSave: () => Promise<boolean>;
  getStatus: () => SaveStatus;
  reset: () => void;
}

/**
 * Hook for managing session saving with proper mutex pattern.
 * Rev 2: Fixed promise reference bug, added retry capability.
 */
export function useSessionSaver(): UseSessionSaverReturn {
  const statusRef = useRef<SaveStatus>('idle');
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const savedSessionIdRef = useRef<string | null>(null);
  const lastFailedSessionRef = useRef<SessionData | null>(null);

  const save = useCallback(async (session: SessionData): Promise<boolean> => {
    // Prevent duplicate saves of the same session
    if (savedSessionIdRef.current === session.id) {
      console.log('[SessionSaver] Session already saved:', session.id);
      return true;
    }

    // Prevent concurrent saves - wait for existing save
    if (statusRef.current === 'saving' && savePromiseRef.current) {
      console.log('[SessionSaver] Save already in progress, waiting...');
      try {
        const existingResult = await savePromiseRef.current;
        // Check if this was the same session
        if (savedSessionIdRef.current === session.id) {
          return existingResult;
        }
      } catch {
        // Previous save failed, continue with new save
      }
    }

    statusRef.current = 'saving';
    lastFailedSessionRef.current = null;

    const saveOperation = async (): Promise<boolean> => {
      try {
        // StorageService.saveSession now returns boolean
        const success = await StorageService.saveSession(session);

        if (success) {
          savedSessionIdRef.current = session.id;
          statusRef.current = 'saved';
          console.log('[SessionSaver] Successfully saved session:', session.id);
          return true;
        } else {
          console.error(
            '[SessionSaver] Save returned false for session:',
            session.id,
          );
          statusRef.current = 'error';
          lastFailedSessionRef.current = session;
          return false;
        }
      } catch (error) {
        console.error('[SessionSaver] Exception during save:', error);
        statusRef.current = 'error';
        lastFailedSessionRef.current = session;
        return false;
      }
    };

    // Store the actual promise - fixed from original bug
    // Original: savePromiseRef.current = promise.then(() => {});
    // This caused waitForSave to wait on void instead of the result
    const promise = saveOperation();
    savePromiseRef.current = promise;

    const result = await promise;
    savePromiseRef.current = null;
    return result;
  }, []);

  /**
   * Retry saving a previously failed session.
   */
  const retry = useCallback(
    async (session: SessionData): Promise<boolean> => {
      console.log('[SessionSaver] Retrying save for session:', session.id);

      // Reset state for retry
      statusRef.current = 'idle';
      savedSessionIdRef.current = null;
      lastFailedSessionRef.current = null;

      return save(session);
    },
    [save],
  );

  /**
   * Wait for any in-progress save to complete.
   * Returns the result of the save operation.
   */
  const waitForSave = useCallback(async (): Promise<boolean> => {
    if (!savePromiseRef.current) {
      // No save in progress, return current status
      return statusRef.current === 'saved';
    }

    try {
      const result = await Promise.race([
        savePromiseRef.current,
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Save timeout')), 5000),
        ),
      ]);
      return result;
    } catch (error) {
      console.error('[SessionSaver] Error waiting for save:', error);
      return false;
    }
  }, []);

  const getStatus = useCallback((): SaveStatus => {
    return statusRef.current;
  }, []);

  /**
   * Reset the saver state for a new session.
   */
  const reset = useCallback((): void => {
    statusRef.current = 'idle';
    savedSessionIdRef.current = null;
    savePromiseRef.current = null;
    lastFailedSessionRef.current = null;
  }, []);

  return {
    save,
    retry,
    waitForSave,
    getStatus,
    reset,
  };
}
