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
 * Only includes properties that have values to avoid Notion validation errors
 * for properties that don't exist in the target database.
 */
export function mapWorkoutToNotion(firestoreId, data) {
  const name = data.name || `${data.exercise || 'Workout'} - ${toISODate(data.date)}`;
  const props = {
    'Title': { title: [{ type: 'text', text: { content: name } }] },
    'Date': { date: { start: toISODate(data.date) } },
  };

  // Only add optional properties if they have values
  if (data.exercise) props['Exercise'] = select(data.exercise);
  if (data.category) props['Category'] = select(data.category);
  if (data.sets != null) props['Sets'] = num(data.sets);
  if (data.reps != null) props['Reps'] = num(data.reps);
  if (data.weight_kg != null) props['Weight'] = num(data.weight_kg);
  if (data.duration_min != null) props['Duration'] = num(data.duration_min);
  if (data.distance_km != null) props['Distance (km)'] = num(data.distance_km);
  if (data.notes) props['Notes'] = richText(data.notes);
  if (data.source) props['Source'] = select(data.source);

  return props;
}

/**
 * Maps a Firestore transaction document to Notion page properties.
 * Only includes properties that have values.
 */
export function mapTransactionToNotion(firestoreId, data) {
  const props = {
    'Title': { title: [{ type: 'text', text: { content: data.description || '' } }] },
    'Date': { date: { start: toISODate(data.date) } },
  };

  if (data.amount != null) props['Amount'] = num(data.amount);
  if (data.category) props['Category'] = select(data.category);
  if (data.category_group) props['Type'] = select(data.category_group);
  if (data.description) props['Description'] = richText(data.description);
  if (data.payment_method) props['Payment Method'] = select(data.payment_method);
  if (data.notes) props['Notes'] = richText(data.notes);
  if (data.source) props['Source'] = select(data.source);

  return props;
}
