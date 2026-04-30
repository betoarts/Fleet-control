
import { supabase } from '../lib/supabase';
import { Reservation, Task } from '../types';

export interface User {
  id: string;
  name: string;
  phone: string;
  role?: 'driver' | 'admin';
}

export const userService = {
  async loginOrRegister(name: string, phone: string): Promise<User | null> {
    // Sanitize phone (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');

    // 1. Try to find user by phone (assuming phone is unique identifier for "login")
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*, role')
      .eq('phone', cleanPhone)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error finding user:', findError);
      throw findError;
    }

    if (existingUser) {
      return existingUser;
    }

    // 2. If not found, create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{ name, phone: cleanPhone, role: 'driver' }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    const userResult = existingUser || newUser;

    // Log the login action
    if (userResult) {
      await this.logUsage(userResult.id, 'LOGIN', {
        method: existingUser ? 'EXISTING_USER' : 'NEW_REGISTER',
        timestamp: new Date().toISOString()
      });
    }

    return userResult;
  },

  async logUsage(userId: string, action: string, details?: any) {
    const { error } = await supabase
      .from('user_logs')
      .insert([
        {
          user_id: userId,
          action,
          details
        }
      ]);

    if (error) {
      console.error('Error logging usage:', error);
      // Don't throw error to avoid blocking the main flow
    }
  },

  async logPermissionDenial(userId: string, userName: string) {
    const { error } = await supabase
      .from('user_logs')
      .insert([
        {
          user_id: userId,
          action: 'LOCATION_PERMISSION_DENIED',
          details: {
            userName,
            timestamp: new Date().toISOString(),
            message: 'O usuário negou a permissão de localização.'
          }
        }
      ]);

    if (error) {
      console.error('Error logging permission denial:', error);
    }
  },

  async getUserReservations(userId: string): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reservations:', error);
        throw error;
      }

      return data.map((r: any) => ({
        id: r.id,
        employeeName: r.employee_name,
        vehicle: r.vehicle,
        startOdometer: r.start_odometer,
        endOdometer: r.end_odometer,
        itinerary: r.itinerary,
        startTime: r.start_time,
        endTime: r.end_time,
        status: r.status
      }));
    } catch (err) {
      console.error('Failed to get reservations:', err);
      return [];
    }
  },

  async validateUserExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) return false;
      return !!data;
    } catch (e) {
      return false;
    }
  },

  async getAllReservations(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all reservations:', error);
      throw error;
    }

    return data.map((r: any) => ({
      id: r.id,
      employeeName: r.employee_name,
      vehicle: r.vehicle,
      startOdometer: r.start_odometer,
      endOdometer: r.end_odometer,
      itinerary: r.itinerary,
      startTime: r.start_time,
      endTime: r.end_time,
      status: r.status
    }));
  },

  async getActiveReservations(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', 'active')
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching active reservations:', error);
      throw error;
    }

    return data.map((r: any) => ({
      id: r.id,
      employeeName: r.employee_name,
      vehicle: r.vehicle,
      startOdometer: r.start_odometer,
      endOdometer: r.end_odometer,
      itinerary: r.itinerary,
      startTime: r.start_time,
      endTime: r.end_time,
      status: r.status
    }));
  },

  async createReservation(reservation: Reservation, userId: string): Promise<void> {
    const { error } = await supabase
      .from('reservations')
      .insert([{
        id: reservation.id,
        user_id: userId,
        employee_name: reservation.employeeName,
        vehicle: reservation.vehicle,
        start_odometer: reservation.startOdometer,
        itinerary: reservation.itinerary,
        start_time: reservation.startTime,
        status: reservation.status
      }]);

    if (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }

    // Log the action
    await this.logUsage(userId, 'CREATE_RESERVATION', {
      reservationId: reservation.id,
      vehicle: reservation.vehicle,
      startTime: reservation.startTime
    });
  },

  async updateReservation(reservation: Reservation, userId: string): Promise<void> {
    const { error } = await supabase
      .from('reservations')
      .update({
        end_odometer: reservation.endOdometer,
        end_time: reservation.endTime,
        status: reservation.status
      })
      .eq('id', reservation.id);

    if (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }

    // Log the action
    await this.logUsage(userId, 'UPDATE_RESERVATION', {
      reservationId: reservation.id,
      endOdometer: reservation.endOdometer,
      endTime: reservation.endTime,
      status: reservation.status
    });
  },

  async getMyTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my tasks:', error);
      throw error;
    }

    return data.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      deadline: t.deadline,
      priority: t.priority,
      status: t.status,
      assignedTo: t.assigned_to,
      createdBy: t.created_by,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      startedAt: t.started_at,
      completedAt: t.completed_at,
      destinationName: t.destination_name,
      destinationAddress: t.destination_address,
      destinationLatitude: t.destination_latitude,
      destinationLongitude: t.destination_longitude
    }));
  },

  async startTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'em_progresso',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error starting task:', error);
      throw error;
    }
  },

  async startTasks(taskIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'em_progresso',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', taskIds);

    if (error) {
      console.error('Error starting tasks:', error);
      throw error;
    }
  },

  async completeTask(taskId: string, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'concluida',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error completing task:', error);
      throw error;
    }

    if (userId) {
      await this.logUsage(userId, 'TASK_COMPLETED', {
        taskId,
        timestamp: new Date().toISOString()
      });
    }
  },

  async getPendingTasksCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .neq('status', 'concluida');

    if (error) {
      console.error('Error counting pending tasks:', error);
      return 0;
    }

    return count || 0;
  }
};

