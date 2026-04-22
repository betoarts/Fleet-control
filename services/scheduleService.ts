
import { supabase } from '../lib/supabase';

export interface Schedule {
  id: string;
  reserverName: string; // Display name
  userId?: string;     // Optional link to registered user
  vehicle: string;
  scheduledAt: string; // ISO String
  createdAt: string;
}

export const scheduleService = {
  async getSchedules(): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .gte('scheduled_at', new Date().toISOString()) // Only future or today
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }

    return data.map((s: any) => ({
      id: s.id,
      reserverName: s.reserver_name,
      userId: s.user_id,
      vehicle: s.vehicle,
      scheduledAt: s.scheduled_at,
      createdAt: s.created_at
    }));
  },

  async createSchedule(reserverName: string, vehicle: string, scheduledAt: string, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .insert([{
        reserver_name: reserverName,
        vehicle,
        scheduled_at: scheduledAt,
        user_id: userId
      }]);

    if (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }
};
