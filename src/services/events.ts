import { supabase } from './supabase';
import type {
  EventCreate,
  EventFilters,
  EventRSVP,
  EventWithClub,
  ServiceResult,
} from '../shared/types';

/**
 * Fetch events with optional filters.
 * By default returns upcoming events ordered by start time.
 */
export async function getEvents(
  filters?: EventFilters,
): Promise<ServiceResult<EventWithClub[]>> {
  let query = supabase
    .from('events')
    .select('*, club:clubs(id, name, logo_url)')
    .order('starts_at', { ascending: true });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.clubId) {
    query = query.eq('club_id', filters.clubId);
  }

  if (filters?.dateRange) {
    query = query
      .gte('starts_at', filters.dateRange.start)
      .lte('starts_at', filters.dateRange.end);
  } else {
    // Default: only future events
    query = query.gte('starts_at', new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as EventWithClub[], error: null };
}

/**
 * Fetch a single event by ID with club info.
 */
export async function getEventById(id: string): Promise<ServiceResult<EventWithClub>> {
  const { data, error } = await supabase
    .from('events')
    .select('*, club:clubs(id, name, logo_url)')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as EventWithClub, error: null };
}

/**
 * Create a new event.
 */
export async function createEvent(
  event: EventCreate,
): Promise<ServiceResult<EventWithClub>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('events')
    .insert({ ...event, created_by: session.user.id })
    .select('*, club:clubs(id, name, logo_url)')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as EventWithClub, error: null };
}

/**
 * RSVP to an event.
 * Uses upsert so a user can call this idempotently.
 */
export async function rsvpToEvent(eventId: string): Promise<ServiceResult<EventRSVP>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('event_rsvps')
    .upsert(
      {
        event_id: eventId,
        user_id: session.user.id,
      },
      { onConflict: 'event_id,user_id' },
    )
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as EventRSVP, error: null };
}

/**
 * Cancel an existing RSVP.
 */
export async function cancelRsvp(eventId: string): Promise<ServiceResult<null>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { data: null, error: sessionError?.message ?? 'Not authenticated.' };
  }

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', session.user.id);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

/**
 * Get all events a user has RSVP'd to, with event and club details.
 */
export async function getMyRsvps(
  userId: string,
): Promise<ServiceResult<(EventRSVP & { event: EventWithClub })[]>> {
  const { data, error } = await supabase
    .from('event_rsvps')
    .select('*, event:events(*, club:clubs(id, name, logo_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: (data ?? []) as (EventRSVP & { event: EventWithClub })[],
    error: null,
  };
}
