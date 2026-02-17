/**
 * Converts a Firestore Timestamp (or {seconds, nanoseconds} object) to an ISO date string.
 */
function toISODate(ts) {
  if (!ts) return new Date().toISOString().slice(0, 10);
  // Firestore Timestamp has a toDate() method; plain objects from JSON have _seconds/seconds
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString().slice(0, 10);
  const seconds = ts._seconds ?? ts.seconds;
  if (seconds) return new Date(seconds * 1000).toISOString().slice(0, 10);
  return new Date(ts).toISOString().slice(0, 10);
}

/**
 * Helper: Notion number property (skips null/undefined).
 */
function num(value) {
  return value != null ? { number: Number(value) } : { number: null };
}

/**
 * Helper: Notion select property.
 */
function select(value) {
  return value ? { select: { name: String(value) } } : { select: null };
}

/**
 * Helper: Notion rich_text property.
 */
function richText(value) {
  return {
    rich_text: value
      ? [{ type: 'text', text: { content: String(value) } }]
      : []
  };
}

/**
 * Maps a Firestore workout document to Notion page properties.
 */
export function mapWorkoutToNotion(firestoreId, data) {
  const name = data.name || `${data.exercise || 'Workout'} - ${toISODate(data.date)}`;
  return {
    'Name':           { title: [{ type: 'text', text: { content: name } }] },
    'Date':           { date: { start: toISODate(data.date) } },
    'Exercise':       select(data.exercise),
    'Category':       select(data.category),
    'Sets':           num(data.sets),
    'Reps':           num(data.reps),
    'Weight (kg)':    num(data.weight_kg),
    'Duration (min)': num(data.duration_min),
    'Distance (km)':  num(data.distance_km),
    'RPE':            num(data.rpe),
    'Notes':          richText(data.notes),
    'Source':         select(data.source || 'app'),
    'Firestore ID':   richText(firestoreId),
  };
}

/**
 * Maps a Firestore transaction document to Notion page properties.
 */
export function mapTransactionToNotion(firestoreId, data) {
  return {
    'Description':    { title: [{ type: 'text', text: { content: data.description || '' } }] },
    'Amount':         num(data.amount),
    'Category':       select(data.category),
    'Category Group': select(data.category_group),
    'Date':           { date: { start: toISODate(data.date) } },
    'Payment Method': select(data.payment_method),
    'Notes':          richText(data.notes),
    'Source':         select(data.source || 'app'),
    'Firestore ID':   richText(firestoreId),
  };
}
