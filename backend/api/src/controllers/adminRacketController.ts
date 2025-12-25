import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import logger from '../config/logger';

export class AdminRacketController {
  /**
   * Get all rackets marked as 'conflict'
   */
  static async getConflicts(req: Request, res: Response) {
    try {
      // 1. Fetch conflicts sorted by date
      const { data: conflicts, error: conflictsError } = await supabase
        .from('rackets')
        .select('*')
        .eq('status', 'conflict')
        .order('created_at', { ascending: false });

      if (conflictsError) {
        throw new Error(conflictsError.message);
      }

      if (!conflicts || conflicts.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // 2. Extract related IDs
      const relatedIds = conflicts
        .map((c: any) => c.related_racket_id)
        .filter((id: any) => id !== null);

      if (relatedIds.length === 0) {
         return res.json({ success: true, data: conflicts });
      }

      // 3. Fetch related rackets manually
      const { data: relatedRackets, error: relatedError } = await supabase
        .from('rackets')
        .select('*')
        .in('id', relatedIds);

      if (relatedError) {
        throw new Error(relatedError.message);
      }

      // 4. Map back to conflicts structure expected by frontend
      // We attach the 'related_racket' object manually
      const conflictsWithRelated = conflicts.map((conflict: any) => {
        const related = relatedRackets?.find((r: any) => r.id === conflict.related_racket_id);
        return {
          ...conflict,
          related_racket: related || null
        };
      });

      res.json({
        success: true,
        data: conflictsWithRelated
      });
    } catch (error: any) {
      logger.error('Error fetching racket conflicts:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener conflictos',
        error: error.message
      });
    }
  }

  /**
   * Resolve a conflict
   * Actions:
   * - 'replace': Update the existing racket with the new data, delete the conflict record
   * - 'reject': Delete the conflict record (ignore new data)
   * - 'keep_both': Set conflict record status to 'active' (remove related_racket_id link)
   */
  static async resolveConflict(req: Request, res: Response) {
    const { id } = req.params; // ID of the NEW racket (the conflict one)
    const { action } = req.body; // 'replace' | 'reject' | 'keep_both'

    try {
      // 1. Get the conflict record first
      const { data: conflictRecord, error: fetchError } = await supabase
        .from('rackets')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !conflictRecord) {
        return res.status(404).json({ success: false, message: 'Registro de conflicto no encontrado' });
      }

      const existingId = conflictRecord.related_racket_id;

      let resultMsg = 'Acción completada';

      if (action === 'replace') {
        if (!existingId) {
            return res.status(400).json({ success: false, message: 'No hay pala existente para reemplazar' });
        }

        // Prepare data to update (exclude id, created_at, etc)
        const updateData = { ...conflictRecord };
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.status; 
        delete updateData.related_racket_id;
        updateData.updated_at = new Date().toISOString();

        // Update the EXISTING record
        const { error: updateError } = await supabase
          .from('rackets')
          .update(updateData)
          .eq('id', existingId);
          
        if (updateError) throw updateError;

        // Delete the CONFLICT record
        const { error: deleteError } = await supabase
          .from('rackets')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        
        logger.info(`Resolved conflict ${id}: Replaced existing ${existingId}`);
        resultMsg = 'Pala existente actualizada correctamente';

      } else if (action === 'reject') {
        // Just delete the conflict record
        const { error: deleteError } = await supabase
            .from('rackets')
            .delete()
            .eq('id', id);
            
        if (deleteError) throw deleteError;
        
        logger.info(`Resolved conflict ${id}: Rejected new data`);
        resultMsg = 'Actualización rechazada';

      } else if (action === 'keep_both') {
        // Activate the new record and unlink
        const { error: updateError } = await supabase
            .from('rackets')
            .update({ status: 'active', related_racket_id: null })
            .eq('id', id);
            
        if (updateError) throw updateError;
        
        logger.info(`Resolved conflict ${id}: Kept both`);
        resultMsg = 'Nueva pala creada correctamente';

      } else {
        return res.status(400).json({ success: false, message: 'Acción no válida' });
      }

      return res.json({ success: true, message: resultMsg });

    } catch (error: any) {
      logger.error(`Error resolving conflict ${id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error al resolver conflicto',
        error: error.message
      });
    }
  }
}
