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

// ─── Notion → Firestore helpers ───────────────────────────────────────────────

function getTitle(prop) { return prop?.title?.[0]?.plain_text ?? null; }
function getPropDate(prop) { return prop?.date?.start ?? null; }
function getPropSelect(prop) { return prop?.select?.name ?? null; }
function getPropNumber(prop) { return prop?.number ?? null; }
function getPropRichText(prop) { return prop?.rich_text?.[0]?.plain_text ?? null; }

/**
 * Maps a Notion workout page back to a Firestore workout document.
 * Sets source='notion' and sync_status='synced' so the write trigger skips it.
 */
export function mapNotionToWorkout(page) {
  const p = page.properties;
  return {
    name: getTitle(p['Title']),
    date: getPropDate(p['Date']),
    exercise: getPropSelect(p['Exercise']),
    category: getPropSelect(p['Category']),
    sets: getPropNumber(p['Sets']),
    reps: getPropNumber(p['Reps']),
    weight_kg: getPropNumber(p['Weight']),
    duration_min: getPropNumber(p['Duration']),
    distance_km: getPropNumber(p['Distance (km)']),
    notes: getPropRichText(p['Notes']),
    notion_page_id: page.id,
    notion_last_edited: page.last_edited_time,
    updated_at: new Date(page.last_edited_time),
    source: 'notion',
    sync_status: 'synced',
  };
}

/**
 * Maps a Notion transaction page back to a Firestore transaction document.
 * Sets source='notion' and sync_status='synced' so the write trigger skips it.
 */
export function mapNotionToTransaction(page) {
  const p = page.properties;
  return {
    type: getPropSelect(p['Kind']) || 'expense',
    description: getTitle(p['Title']),
    date: getPropDate(p['Date']),
    amount: getPropNumber(p['Amount']),
    category: getPropSelect(p['Category']),
    category_group: getPropSelect(p['Type']),
    payment_method: getPropSelect(p['Payment Method']),
    account: getPropSelect(p['Account']),
    notes: getPropRichText(p['Notes']),
    notion_page_id: page.id,
    notion_last_edited: page.last_edited_time,
    updated_at: new Date(page.last_edited_time),
    source: 'notion',
    sync_status: 'synced',
  };
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

  if (data.type) props['Kind'] = select(data.type);
  if (data.amount != null) props['Amount'] = num(data.amount);
  if (data.category) props['Category'] = select(data.category);
  if (data.category_group) props['Type'] = select(data.category_group);
  if (data.description) props['Description'] = richText(data.description);
  if (data.payment_method) props['Payment Method'] = select(data.payment_method);
  if (data.notes) props['Notes'] = richText(data.notes);
  if (data.source) props['Source'] = select(data.source);
  if (data.account) props['Account'] = select(data.account);
  if (data.currency) props['Currency'] = select(data.currency);

  return props;
}
