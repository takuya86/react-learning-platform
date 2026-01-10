import { supabase, isMockMode } from '@/lib/supabase';
import type { Progress } from '@/domain/types';
import type { UserProgressRow } from '../types';
import { mapRowToProgress, mapProgressToRow } from '../types';

const TABLE_NAME = 'user_progress';

export interface ProgressServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetch user progress from Supabase
 */
export async function fetchProgress(userId: string): Promise<ProgressServiceResult<Progress>> {
  // In mock mode, return null (no remote data)
  if (isMockMode) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return { data: mapRowToProgress(data as UserProgressRow), error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Save (upsert) user progress to Supabase
 */
export async function saveProgress(
  userId: string,
  progress: Progress
): Promise<ProgressServiceResult<Progress>> {
  // In mock mode, return success without actually saving
  if (isMockMode) {
    return { data: progress, error: null };
  }

  try {
    const rowData = mapProgressToRow(userId, progress);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(rowData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: mapRowToProgress(data as UserProgressRow), error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete user progress from Supabase
 */
export async function deleteProgress(userId: string): Promise<ProgressServiceResult<void>> {
  // In mock mode, return success without actually deleting
  if (isMockMode) {
    return { data: undefined, error: null };
  }

  try {
    const { error } = await supabase.from(TABLE_NAME).delete().eq('user_id', userId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: undefined, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}
