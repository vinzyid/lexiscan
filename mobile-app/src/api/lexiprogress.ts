import { postJson } from './ai';

/**
 * Klien LexiProgress — endpoint backend yang menuntut token (`auth:sanctum`).
 *
 * Seluruh data di sini milik satu pembaca. Karena itu setiap fungsi mengembalikan
 * `null`/melempar galat yang jelas kalau dipanggil tanpa sesi, bukan diam-diam
 * mengirim permintaan anonim yang pasti dijawab 401.
 */

export type ProgressCondition = 'baseline' | 'assisted';

export type ProgressDocument = {
  id: number;
  title: string;
  source_type: 'text' | 'scan' | 'sample';
  content_hash: string;
  word_count: number;
  created_at: string | null;
};

export type ProgressSession = {
  id: number;
  condition: ProgressCondition;
  session_group_id: string | null;
  order_index: number | null;
  document: ProgressDocument | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  words_total: number | null;
  words_correct: number | null;
  wpm: number | null;
  cwpm: number | null;
  accuracy_percent: number | null;
  comprehension_correct: number | null;
  comprehension_total: number | null;
  comprehension_percent: number | null;
  difficulty_rating: number | null;
  assessment_method: string | null;
  notes: string | null;
  features: string[];
};

export type GoalMetricKey =
  | 'session_count'
  | 'comprehension_percent'
  | 'difficulty_rating'
  | 'wpm'
  | 'cwpm'
  | 'duration_seconds'
  | 'accuracy_percent';

export type ProgressGoal = {
  id: number;
  title: string;
  description: string | null;
  metric_key: GoalMetricKey;
  baseline_value: number | null;
  target_value: number;
  unit: string;
  starts_at: string | null;
  target_date: string | null;
  status: 'not_started' | 'active' | 'achieved' | 'stopped';
  notes: string | null;
  is_lower_better: boolean;
  actual: number | null;
  percent: number | null;
  achieved: boolean;
};

export type ProgressOverview = {
  sessions_completed: number;
  latest_session: ProgressSession | null;
  goals: ProgressGoal[];
  sessions: ProgressSession[];
};

export type MetricChange = {
  baseline: number | null;
  assisted: number | null;
  /** Selisih dalam poin persentase — hanya untuk metrik berbentuk persen. */
  percentage_points: number | null;
  /** Perubahan relatif terhadap baseline; null kalau baseline 0/tidak ada. */
  relative_percent: number | null;
};

export type ProgressComparison = {
  baseline: ProgressSession | null;
  assisted: ProgressSession | null;
  changes: Record<string, MetricChange>;
};

export type NewGoalInput = {
  title: string;
  description?: string | null;
  metricKey: GoalMetricKey;
  baselineValue?: number | null;
  targetValue: number;
  unit: string;
  startsAt: string;
  targetDate?: string | null;
};

/** GET /api/lexiprogress/overview */
export async function fetchOverview(): Promise<ProgressOverview> {
  return getJson('/api/lexiprogress/overview');
}

/** GET /api/lexiprogress/sessions */
export async function fetchSessions(): Promise<{ data: ProgressSession[] }> {
  return getJson('/api/lexiprogress/sessions');
}

/** POST /api/lexiprogress/sessions */
export async function createSession(input: {
  documentId: number;
  condition: ProgressCondition;
  sessionGroupId?: string;
  features?: string[];
}): Promise<{ session: ProgressSession }> {
  return postJson('/api/lexiprogress/sessions', {
    document_id: input.documentId,
    condition: input.condition,
    session_group_id: input.sessionGroupId,
    features: input.features ?? [],
  });
}

/** POST /api/lexiprogress/sessions/{id}/complete */
export async function completeSession(
  id: number,
  input: {
    durationSeconds: number;
    wordsTotal?: number | null;
    wordsCorrect?: number | null;
    comprehensionCorrect?: number | null;
    comprehensionTotal?: number | null;
    difficultyRating?: number | null;
    notes?: string | null;
  },
): Promise<{ session: ProgressSession }> {
  return postJson(`/api/lexiprogress/sessions/${id}/complete`, {
    duration_seconds: input.durationSeconds,
    words_total: input.wordsTotal ?? null,
    words_correct: input.wordsCorrect ?? null,
    comprehension_correct: input.comprehensionCorrect ?? null,
    comprehension_total: input.comprehensionTotal ?? null,
    difficulty_rating: input.difficultyRating ?? null,
    notes: input.notes ?? null,
  });
}

/** GET /api/lexiprogress/sessions/{id} */
export async function fetchSession(id: number): Promise<{ session: ProgressSession }> {
  return getJson(`/api/lexiprogress/sessions/${id}`);
}

/** POST /api/lexiprogress/goals */
export async function createGoal(input: NewGoalInput): Promise<{ goal: ProgressGoal }> {
  return postJson('/api/lexiprogress/goals', {
    title: input.title,
    description: input.description ?? null,
    metric_key: input.metricKey,
    baseline_value: input.baselineValue ?? null,
    target_value: input.targetValue,
    unit: input.unit,
    starts_at: input.startsAt,
    target_date: input.targetDate ?? null,
  });
}

/** PATCH /api/lexiprogress/goals/{id} */
export async function updateGoalStatus(
  id: number,
  status: ProgressGoal['status'],
): Promise<{ goal: ProgressGoal }> {
  return postJson(`/api/lexiprogress/goals/${id}`, { status }, { method: 'PATCH' });
}

/** DELETE /api/lexiprogress/goals/{id} */
export async function deleteGoal(id: number): Promise<void> {
  await postJson(`/api/lexiprogress/goals/${id}`, {}, { method: 'DELETE' });
}

/** GET /api/lexiprogress/goals */
export async function fetchGoals(): Promise<{ goals: ProgressGoal[] }> {
  return getJson('/api/lexiprogress/goals');
}

/** GET /api/lexiprogress/comparisons/{sessionGroupId} */
export async function fetchComparison(sessionGroupId: string): Promise<ProgressComparison> {
  return getJson(`/api/lexiprogress/comparisons/${sessionGroupId}`);
}

/** GET /api/lexiprogress/documents */
export async function fetchDocuments(): Promise<{ data: ProgressDocument[] }> {
  return getJson('/api/lexiprogress/documents');
}

/** POST /api/lexiprogress/documents */
export async function createDocument(input: {
  title: string;
  textSnapshot: string;
  sourceType?: 'text' | 'scan' | 'sample';
}): Promise<{ document: ProgressDocument }> {
  return postJson('/api/lexiprogress/documents', {
    title: input.title,
    text_snapshot: input.textSnapshot,
    source_type: input.sourceType ?? 'text',
  });
}

/** GET, memakai jalur yang sama dengan POST supaya header & galatnya seragam. */
async function getJson(path: string): Promise<any> {
  return postJson(path, {}, { method: 'GET' });
}
