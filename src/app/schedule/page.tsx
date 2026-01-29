﻿// app/schedule/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

type Event = {
  id: string;
  title: string;
  description: string | null;
  host_name: string | null;
  start_time: string;
  duration: number;
  max_attendees: number | null;
  image_url: string | null; // ← relative path: "event-images/xyz.jpg"
};

type Reservation = {
  event_id: string;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, description, host_name, start_time, duration, max_attendees, image_url')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        setEvents([]);
      } else {
        setEvents(eventsData || []);
      }

      const { data: countData } = await supabase
        .from('reservations')
        .select('event_id')
        .in('event_id', (eventsData || []).map(e => e.id));

      if (countData) {
        const counts: Record<string, number> = {};
        countData.forEach((r: { event_id: string }) => {
          counts[r.event_id] = (counts[r.event_id] || 0) + 1;
        });
        setAttendeeCounts(counts);
      }

      if (user) {
        const { data: myRes } = await supabase
          .from('reservations')
          .select('event_id')
          .eq('user_id', user.id);
        setReservations(myRes || []);
      }

      setLoading(false);
    };

    init();
  }, [supabase]);

  const isReserved = (eventId: string) => {
    return reservations.some(r => r.event_id === eventId);
  };

  const handleReserve = async (eventId: string) => {
    if (!user) {
      alert('Please sign in to reserve a spot.');
      return;
    }

    const { error } = await supabase
      .from('reservations')
      .insert({ event_id: eventId, user_id: user.id });

    if (error) {
      alert('Failed to reserve. You may have already reserved or the event is full.');
    } else {
      setReservations(prev => [...prev, { event_id: eventId }]);
      setAttendeeCounts(prev => ({
        ...prev,
        [eventId]: (prev[eventId] || 0) + 1,
      }));
    }
  };

  const handleUnreserve = async (eventId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      alert('Failed to cancel reservation.');
    } else {
      setReservations(prev => prev.filter(r => r.event_id !== eventId));
      setAttendeeCounts(prev => ({
        ...prev,
        [eventId]: Math.max(0, (prev[eventId] || 1) - 1),
      }));
    }
  };

  const handleJoin = (eventId: string) => {
    router.push(`/events/${eventId}/live`);
  };

  const handleCreateEvent = () => {
    router.push('/schedule/create');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        Loading events...
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerContainer}>
        <h1 style={styles.heading}>Upcoming Events</h1>
        <button 
          onClick={handleCreateEvent}
          style={styles.createEventButton}
        >
          Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <div style={styles.noEventsContainer}>
          <p style={styles.noEventsText}>No upcoming events.</p>
          <button 
            onClick={handleCreateEvent}
            style={styles.createEventButtonLarge}
          >
            Create Your First Event
          </button>
        </div>
      ) : (
        <div style={styles.eventsContainer}>
          {events.map((event) => {
            const startTime = new Date(event.start_time);
            const formattedDate = startTime.toLocaleDateString();
            const formattedTime = startTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const currentAttendees = attendeeCounts[event.id] || 0;
            const isFull = !!(event.max_attendees && currentAttendees >= event.max_attendees);
            const reserved = isReserved(event.id);

            return (
              <div key={event.id} style={styles.eventCard}>
                {event.image_url && (
                  <div style={styles.imageContainer}>
                    <Image
                      src={`/api/media/${event.image_url}`}
                      alt={event.title}
                      fill
                      style={styles.image}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <h2 style={styles.eventTitle}>{event.title}</h2>
                <p style={styles.eventDescription}>{event.description}</p>
                <p style={styles.eventDetail}>
                  🕒 {formattedDate} at {formattedTime}
                </p>
                {event.host_name && (
                  <p style={styles.eventDetail}>🎤 Host: {event.host_name}</p>
                )}
                <p style={styles.attendeeCount}>
                  👥 {currentAttendees} / {event.max_attendees ?? '∞'} attending
                </p>

                <div style={styles.buttonsContainer}>
                  {reserved ? (
                    <button
                      onClick={() => handleUnreserve(event.id)}
                      style={styles.cancelButton}
                    >
                      Cancel Reservation
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReserve(event.id)}
                      disabled={!user || isFull}
                      style={{
                        ...styles.baseButton,
                        ...(!user
                          ? styles.disabledButton
                          : isFull
                            ? styles.fullButton
                            : styles.reserveButton)
                      }}
                    >
                      {isFull ? 'Event Full' : user ? 'Reserve Spot' : 'Sign In to Reserve'}
                    </button>
                  )}

                  <button
                    onClick={() => handleJoin(event.id)}
                    style={styles.joinButton}
                  >
                    Join Event
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    padding: '80px 1.5rem 1.5rem',
    maxWidth: '1024px',
    margin: '0 auto',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    margin: 0,
  },
  loadingContainer: {
    padding: '80px 1.5rem',
    textAlign: 'center' as const,
    fontSize: '1.125rem',
  },
  noEventsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    textAlign: 'center' as const,
    gap: '1.5rem',
  },
  noEventsText: {
    color: '#4a5568',
    fontSize: '1.125rem',
    margin: 0,
  },
  eventsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  eventCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    padding: '1.25rem',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  imageContainer: {
    position: 'relative' as const,
    width: '100%',
    height: '10rem',
    marginBottom: '1rem',
    borderRadius: '0.375rem',
    overflow: 'hidden',
  },
  image: {
    objectFit: 'cover' as const,
  },
  eventTitle: {
    fontSize: '1.25rem',
    fontWeight: '600' as const,
    marginBottom: '0.25rem',
  },
  eventDescription: {
    color: '#4a5568',
    marginTop: '0.25rem',
    marginBottom: '0.5rem',
    lineHeight: '1.5',
  },
  eventDetail: {
    color: '#718096',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  },
  attendeeCount: {
    color: '#718096',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
    fontWeight: '500' as const,
  },
  buttonsContainer: {
    marginTop: '1rem',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  baseButton: {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  reserveButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
  },
  fullButton: {
    backgroundColor: '#f6e05e',
    color: '#4a5568',
    cursor: 'not-allowed' as const,
  },
  disabledButton: {
    backgroundColor: '#cbd5e0',
    color: '#a0aec0',
    cursor: 'not-allowed' as const,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  joinButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  createEventButton: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  createEventButtonLarge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    fontWeight: '500' as const,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
} as const;