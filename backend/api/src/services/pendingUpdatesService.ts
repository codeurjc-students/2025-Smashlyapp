import { supabase } from '../config/supabase';

export interface PendingUpdate {
  id: number;
  racket_id: number | null;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  proposed_data: any;
  current_data: any;
  changes_summary: any;
  source_scraper: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MergeSuggestion {
  id: number;
  racket_id_1: number;
  racket_id_2: number;
  similarity_score: number;
  similarity_method: string;
  suggested_primary: number;
  conflict_fields: any;
  status: 'pending' | 'merged' | 'keep_separate' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export interface ScraperExecution {
  id: number;
  execution_id: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed' | 'partial';
  scrapers_run: any;
  total_new_rackets: number;
  total_updates: number;
  total_merge_suggestions: number;
  total_errors: number;
  execution_log: string | null;
  error_log: string | null;
  admin_notified: boolean;
  notification_sent_at: string | null;
  created_at: string;
}

/**
 * Get pending updates with optional filters
 */
export const getPendingUpdates = async (filters?: {
  status?: string;
  action_type?: string;
  limit?: number;
  offset?: number;
}): Promise<PendingUpdate[]> => {
  let query = supabase
    .from('pending_racket_updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.action_type) {
    query = query.eq('action_type', filters.action_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Get count of pending updates by status
 */
export const getPendingUpdatesCounts = async (): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> => {
  const { data, error } = await supabase.from('pending_racket_updates').select('status');

  if (error) throw error;

  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: data?.length || 0,
  };

  data?.forEach(item => {
    if (item.status === 'pending') counts.pending++;
    else if (item.status === 'approved') counts.approved++;
    else if (item.status === 'rejected') counts.rejected++;
  });

  return counts;
};

/**
 * Update pending update's proposed data
 */
export const updatePendingUpdateData = async (
  updateId: number,
  proposedData: any
): Promise<PendingUpdate> => {
  // 1. Get pending update
  const { data: update, error: fetchError } = await supabase
    .from('pending_racket_updates')
    .select('*')
    .eq('id', updateId)
    .single();

  if (fetchError) throw fetchError;
  if (!update) throw new Error('Update not found');
  if (update.status !== 'pending') {
    throw new Error('Only pending updates can be modified');
  }

  // 2. Recalculate changes_summary
  const newChangesSummary: any = {};

  if (update.action_type === 'UPDATE' && update.current_data) {
    // Compare proposed_data with current_data to find changes
    Object.keys(proposedData).forEach(key => {
      if (proposedData[key] !== update.current_data[key]) {
        newChangesSummary[key] = {
          old: update.current_data[key],
          new: proposedData[key],
        };
      }
    });
  }

  // 3. Update the pending update
  const { data: updatedUpdate, error: updateError } = await supabase
    .from('pending_racket_updates')
    .update({
      proposed_data: proposedData,
      changes_summary:
        Object.keys(newChangesSummary).length > 0 ? newChangesSummary : update.changes_summary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', updateId)
    .select()
    .single();

  if (updateError) throw updateError;
  return updatedUpdate;
};

/**
 * Approve a pending update and apply changes to production
 */
export const approvePendingUpdate = async (
  updateId: number,
  adminId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  // 1. Get pending update
  const { data: update, error: fetchError } = await supabase
    .from('pending_racket_updates')
    .select('*')
    .eq('id', updateId)
    .single();

  if (fetchError) throw fetchError;
  if (!update) throw new Error('Update not found');
  if (update.status !== 'pending') {
    throw new Error('Update has already been reviewed');
  }

  try {
    // 2. Apply changes based on action_type
    if (update.action_type === 'CREATE') {
      // Insert new racket
      const { error: insertError } = await supabase.from('rackets').insert(update.proposed_data);

      if (insertError) throw insertError;
    } else if (update.action_type === 'UPDATE') {
      // Update existing racket
      if (!update.racket_id) {
        throw new Error('Racket ID is required for UPDATE action');
      }

      const { error: updateError } = await supabase
        .from('rackets')
        .update(update.proposed_data)
        .eq('id', update.racket_id);

      if (updateError) throw updateError;
    } else if (update.action_type === 'DELETE') {
      // Mark racket as unavailable (soft delete)
      if (!update.racket_id) {
        throw new Error('Racket ID is required for DELETE action');
      }

      const { error: deleteError } = await supabase
        .from('rackets')
        .update({
          on_offer: false,
          padelnuestro_actual_price: null,
          padelnuestro_original_price: null,
          padelnuestro_discount_percentage: null,
          padelmarket_actual_price: null,
          padelmarket_original_price: null,
          padelmarket_discount_percentage: null,
          // Keep the racket data but mark all prices as null
        })
        .eq('id', update.racket_id);

      if (deleteError) throw deleteError;
    }

    // 3. Mark as approved
    const { error: approveError } = await supabase
      .from('pending_racket_updates')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('id', updateId);

    if (approveError) throw approveError;

    return {
      success: true,
      message: `Successfully approved ${update.action_type} for racket`,
    };
  } catch (error: any) {
    // Rollback: mark as pending again if something failed
    await supabase.from('pending_racket_updates').update({ status: 'pending' }).eq('id', updateId);

    throw new Error(`Failed to approve update: ${error.message}`);
  }
};

/**
 * Reject a pending update
 */
export const rejectPendingUpdate = async (
  updateId: number,
  adminId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  const { error } = await supabase
    .from('pending_racket_updates')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null,
    })
    .eq('id', updateId);

  if (error) throw error;

  return {
    success: true,
    message: 'Update rejected successfully',
  };
};

/**
 * Get merge suggestions
 */
export const getMergeSuggestions = async (filters?: {
  status?: string;
  limit?: number;
}): Promise<MergeSuggestion[]> => {
  let query = supabase
    .from('racket_merge_suggestions')
    .select('*')
    .order('similarity_score', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Approve merge suggestion and merge rackets
 */
export const approveMergeSuggestion = async (
  suggestionId: number,
  adminId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  // Get merge suggestion
  const { data: suggestion, error: fetchError } = await supabase
    .from('racket_merge_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single();

  if (fetchError) throw fetchError;
  if (!suggestion) throw new Error('Merge suggestion not found');

  // Get both rackets
  const { data: rackets, error: racketsError } = await supabase
    .from('rackets')
    .select('*')
    .in('id', [suggestion.racket_id_1, suggestion.racket_id_2]);

  if (racketsError) throw racketsError;
  if (!rackets || rackets.length !== 2) {
    throw new Error('Could not find both rackets');
  }

  const primaryRacket = rackets.find(r => r.id === suggestion.suggested_primary);
  const secondaryRacket = rackets.find(r => r.id !== suggestion.suggested_primary);

  if (!primaryRacket || !secondaryRacket) {
    throw new Error('Invalid merge configuration');
  }

  // Merge data: combine store links and prices
  const mergedData = {
    ...primaryRacket,
    // Combine store data from both rackets
    padelnuestro_actual_price:
      primaryRacket.padelnuestro_actual_price || secondaryRacket.padelnuestro_actual_price,
    padelnuestro_original_price:
      primaryRacket.padelnuestro_original_price || secondaryRacket.padelnuestro_original_price,
    padelnuestro_discount_percentage:
      primaryRacket.padelnuestro_discount_percentage ||
      secondaryRacket.padelnuestro_discount_percentage,
    padelnuestro_link: primaryRacket.padelnuestro_link || secondaryRacket.padelnuestro_link,
    padelmarket_actual_price:
      primaryRacket.padelmarket_actual_price || secondaryRacket.padelmarket_actual_price,
    padelmarket_original_price:
      primaryRacket.padelmarket_original_price || secondaryRacket.padelmarket_original_price,
    padelmarket_discount_percentage:
      primaryRacket.padelmarket_discount_percentage ||
      secondaryRacket.padelmarket_discount_percentage,
    padelmarket_link: primaryRacket.padelmarket_link || secondaryRacket.padelmarket_link,
  };

  // Update primary racket with merged data
  const { error: updateError } = await supabase
    .from('rackets')
    .update(mergedData)
    .eq('id', suggestion.suggested_primary);

  if (updateError) throw updateError;

  // Delete secondary racket
  const { error: deleteError } = await supabase
    .from('rackets')
    .delete()
    .eq('id', secondaryRacket.id);

  if (deleteError) throw deleteError;

  // Mark suggestion as merged
  const { error: markError } = await supabase
    .from('racket_merge_suggestions')
    .update({
      status: 'merged',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null,
    })
    .eq('id', suggestionId);

  if (markError) throw markError;

  return {
    success: true,
    message: `Successfully merged rackets ${suggestion.racket_id_1} and ${suggestion.racket_id_2}`,
  };
};

/**
 * Reject merge suggestion (keep rackets separate)
 */
export const rejectMergeSuggestion = async (
  suggestionId: number,
  adminId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  const { error } = await supabase
    .from('racket_merge_suggestions')
    .update({
      status: 'keep_separate',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null,
    })
    .eq('id', suggestionId);

  if (error) throw error;

  return {
    success: true,
    message: 'Rackets will be kept separate',
  };
};

/**
 * Get scraper execution logs
 */
export const getScraperExecutions = async (limit = 10): Promise<ScraperExecution[]> => {
  const { data, error } = await supabase
    .from('scraper_executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Get latest scraper execution
 */
export const getLatestScraperExecution = async (): Promise<ScraperExecution | null> => {
  const { data, error } = await supabase
    .from('scraper_executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
};
