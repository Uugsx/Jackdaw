import {
  DEFAULT_WORKING_HOURS_SCHEDULE,
  addWorkingSeconds,
  isWithinWorkingHours,
  workingSecondsBetween,
  type WorkingHoursSchedule,
} from "./WorkingHours";

const SECONDS_PER_MINUTE = 60;
export const DEFAULT_RESPONSE_REMINDER_INTERVALS_MINUTES = [10, 20, 25];
export const DEFAULT_RESPONSE_REMINDER_NEW_INTERVAL_MINUTES = 30;
export const MIN_RESPONSE_REMINDER_INTERVAL_MINUTES = 1;
export const MAX_RESPONSE_REMINDER_INTERVAL_MINUTES = 7 * 24 * 60;
export const RESPONSE_REMINDER_MAX_STATE_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export interface ResponseReminderConfig {
  enabled: boolean;
  intervalsMinutes: number[];
  /** Категории, которые не участвуют в живом SLA-контроле и напоминаниях. */
  excludedCategoryNames: string[];
  /** Нужно ли контролировать входящие письма без категории в режиме категорий. */
  includeUncategorized: boolean;
  /** Момент включения контроля для отсечения старого архива. */
  enabledSince?: number;
}

export interface ResponseReminderStateEntry {
  receivedAt: number;
  firedIntervalsMinutes: number[];
  /** Момент, когда письмо было принято в работу вне рабочего графика. */
  startedAt?: number;
}

export interface PendingResponseRequest {
  accountId: number;
  folderId: number;
  emailId: number;
  messageID: string | null;
  threadID: string | null;
  subject: string;
  receivedAt: Date;
  categoryNames: string[];
  /** Флаг почтового сервера/клиента: прочитано ли письмо. */
  isRead?: boolean;
}

export type ResponseSlaStatus =
  "within-target" | "over-target" | "waiting-for-working-hours";

export interface ResponseSlaProgress {
  elapsedSeconds: number;
  remainingSeconds: number;
  overdueSeconds: number;
  targetSeconds: number;
  deadlineAt: Date | null;
  status: ResponseSlaStatus;
}

const defaultConfig: ResponseReminderConfig = {
  enabled: false,
  intervalsMinutes: [...DEFAULT_RESPONSE_REMINDER_INTERVALS_MINUTES],
  excludedCategoryNames: [],
  includeUncategorized: false,
};

export function normalizeResponseReminderIntervals(
  value: unknown,
  fallback: readonly number[] = DEFAULT_RESPONSE_REMINDER_INTERVALS_MINUTES,
): number[] {
  const normalized = normalizeIntervalList(value);
  if (normalized.length) {
    return normalized;
  }
  const normalizedFallback = normalizeIntervalList(fallback);
  return normalizedFallback.length
    ? normalizedFallback
    : [...DEFAULT_RESPONSE_REMINDER_INTERVALS_MINUTES];
}

export function normalizeResponseReminderConfig(
  value: unknown,
  fallback: ResponseReminderConfig = defaultConfig,
): ResponseReminderConfig {
  const source = isRecord(value) ? value : {};
  const enabledSince =
    positiveTimestamp(source.enabledSince) ??
    positiveTimestamp(fallback.enabledSince);
  return {
    enabled:
      typeof source.enabled == "boolean" ? source.enabled : fallback.enabled,
    intervalsMinutes: normalizeResponseReminderIntervals(
      source.intervalsMinutes,
      fallback.intervalsMinutes,
    ),
    excludedCategoryNames: normalizeCategoryNames(
      source.excludedCategoryNames,
      fallback.excludedCategoryNames,
    ),
    includeUncategorized:
      typeof source.includeUncategorized == "boolean"
        ? source.includeUncategorized
        : fallback.includeUncategorized,
    ...(enabledSince == null ? {} : { enabledSince }),
  };
}

export function isResponseReminderRequestAfterActivation(
  request: PendingResponseRequest,
  enabledSince: number | null | undefined,
): boolean {
  return enabledSince == null || request.receivedAt.getTime() >= enabledSince;
}

export function responseReminderKey(request: PendingResponseRequest): string {
  return `${request.accountId}:${request.folderId}:${request.emailId}`;
}

/**
 * Возвращает момент старта SLA.
 *
 * Обычное письмо считается от момента получения, но время вне графика не
 * увеличивает его рабочий SLA. Если письмо пришло вне графика и уже прочитано
 * или получило категорию сотрудника, оно считается принятым в работу: для
 * такого ручного принятия таймер начинается сразу и идёт непрерывно.
 *
 * `storedStartedAt` нужен, чтобы последующие обновления не сбрасывали таймер
 * обратно в момент текущей проверки.
 */
export function getResponseSlaStartAt(
  request: PendingResponseRequest,
  now = new Date(),
  workingHours: WorkingHoursSchedule = DEFAULT_WORKING_HOURS_SCHEDULE,
  storedStartedAt?: number | null,
): Date {
  const receivedAt = request.receivedAt.getTime();
  const storedStartAt = positiveTimestamp(storedStartedAt);
  if (
    storedStartAt != null &&
    storedStartAt >= receivedAt &&
    storedStartAt <= now.getTime()
  ) {
    return new Date(storedStartAt);
  }

  if (
    !isWithinWorkingHours(request.receivedAt, workingHours) &&
    (request.isRead === true || request.categoryNames.length > 0)
  ) {
    return new Date(now.getTime());
  }
  return request.receivedAt;
}

export function elapsedResponseMinutes(
  request: PendingResponseRequest,
  now = new Date(),
  workingHours: WorkingHoursSchedule = DEFAULT_WORKING_HOURS_SCHEDULE,
  slaStartedAt?: Date,
): number {
  const startAt =
    slaStartedAt ?? getResponseSlaStartAt(request, now, workingHours);
  return Math.max(
    0,
    elapsedResponseSeconds(request, startAt, now, workingHours) /
      SECONDS_PER_MINUTE,
  );
}

/** Возвращает живое состояние SLA с учётом принятия письма в работу. */
export function getResponseSlaProgress(
  request: PendingResponseRequest,
  targetMinutes: number,
  now = new Date(),
  workingHours: WorkingHoursSchedule = DEFAULT_WORKING_HOURS_SCHEDULE,
  slaStartedAt?: Date,
): ResponseSlaProgress {
  const safeTargetMinutes = normalizeSlaTargetMinutes(targetMinutes);
  const targetSeconds = safeTargetMinutes * SECONDS_PER_MINUTE;
  const startAt =
    slaStartedAt ?? getResponseSlaStartAt(request, now, workingHours);
  const continuousClock = usesContinuousClock(request, startAt, workingHours);
  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      elapsedResponseSeconds(request, startAt, now, workingHours),
    ),
  );
  const remainingSeconds = Math.max(targetSeconds - elapsedSeconds, 0);
  const overdueSeconds = Math.max(elapsedSeconds - targetSeconds, 0);
  const deadlineAt = continuousClock
    ? new Date(startAt.getTime() + targetSeconds * 1_000)
    : addWorkingSeconds(startAt, targetSeconds, workingHours);
  const status: ResponseSlaStatus =
    overdueSeconds > 0
      ? "over-target"
      : elapsedSeconds == 0 &&
          !isWithinWorkingHours(now, workingHours) &&
          now.getTime() > request.receivedAt.getTime() &&
          !continuousClock
        ? "waiting-for-working-hours"
        : "within-target";
  return {
    elapsedSeconds,
    remainingSeconds,
    overdueSeconds,
    targetSeconds,
    deadlineAt,
    status,
  };
}

/** Возвращает все точки напоминания, пройденные с последней проверки. */
export function getDueResponseReminderIntervals(
  request: PendingResponseRequest,
  config: ResponseReminderConfig,
  state: ResponseReminderStateEntry | null | undefined,
  now = new Date(),
  workingHours: WorkingHoursSchedule = DEFAULT_WORKING_HOURS_SCHEDULE,
): number[] {
  if (!config.enabled) {
    return [];
  }
  const receivedAt = request.receivedAt.getTime();
  const fired = new Set(
    state?.receivedAt == receivedAt ? state.firedIntervalsMinutes : [],
  );
  const slaStartedAt = getResponseSlaStartAt(
    request,
    now,
    workingHours,
    state?.receivedAt == receivedAt ? state.startedAt : undefined,
  );
  const elapsedMinutes = elapsedResponseMinutes(
    request,
    now,
    workingHours,
    slaStartedAt,
  );
  return config.intervalsMinutes.filter(
    (interval) => interval <= elapsedMinutes && !fired.has(interval),
  );
}

/** Возвращает момент следующей точки или null после срабатывания всех точек. */
export function getNextResponseReminderAt(
  request: PendingResponseRequest,
  config: ResponseReminderConfig,
  state: ResponseReminderStateEntry | null | undefined,
  now = new Date(),
  workingHours: WorkingHoursSchedule = DEFAULT_WORKING_HOURS_SCHEDULE,
): Date | null {
  if (!config.enabled) {
    return null;
  }
  if (
    getDueResponseReminderIntervals(request, config, state, now, workingHours)
      .length
  ) {
    return new Date(now.getTime());
  }
  const receivedAt = request.receivedAt.getTime();
  const fired = new Set(
    state?.receivedAt == receivedAt ? state.firedIntervalsMinutes : [],
  );
  const slaStartedAt = getResponseSlaStartAt(
    request,
    now,
    workingHours,
    state?.receivedAt == receivedAt ? state.startedAt : undefined,
  );
  const elapsedMinutes = elapsedResponseMinutes(
    request,
    now,
    workingHours,
    slaStartedAt,
  );
  const nextInterval = config.intervalsMinutes.find(
    (interval) => interval > elapsedMinutes && !fired.has(interval),
  );
  return nextInterval == null
    ? null
    : usesContinuousClock(request, slaStartedAt, workingHours)
      ? new Date(
          slaStartedAt.getTime() + nextInterval * SECONDS_PER_MINUTE * 1_000,
        )
      : addWorkingSeconds(
          slaStartedAt,
          nextInterval * SECONDS_PER_MINUTE,
          workingHours,
        );
}

function normalizeIntervalList(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(
      value
        .map((item) => (typeof item == "number" ? item : Number(item)))
        .filter(
          (item) =>
            Number.isInteger(item) &&
            item >= MIN_RESPONSE_REMINDER_INTERVAL_MINUTES &&
            item <= MAX_RESPONSE_REMINDER_INTERVAL_MINUTES,
        ),
    ),
  ].sort((a, b) => a - b);
}

function normalizeCategoryNames(
  value: unknown,
  fallback: readonly string[],
): string[] {
  const source = Array.isArray(value) ? value : fallback;
  return [
    ...new Set(
      source
        .filter((item): item is string => typeof item == "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value == "object" && !Array.isArray(value);
}

function positiveTimestamp(value: unknown): number | undefined {
  const result = Number(value);
  return Number.isFinite(result) && result > 0 ? Math.floor(result) : undefined;
}

function elapsedResponseSeconds(
  request: PendingResponseRequest,
  startAt: Date,
  now: Date,
  workingHours: WorkingHoursSchedule,
): number {
  return usesContinuousClock(request, startAt, workingHours)
    ? Math.max(0, (now.getTime() - startAt.getTime()) / 1_000)
    : workingSecondsBetween(startAt, now, workingHours);
}

function usesContinuousClock(
  request: PendingResponseRequest,
  startAt: Date,
  workingHours: WorkingHoursSchedule,
): boolean {
  if (isWithinWorkingHours(request.receivedAt, workingHours)) {
    return false;
  }
  return (
    startAt.getTime() > request.receivedAt.getTime() ||
    request.isRead === true ||
    request.categoryNames.length > 0
  );
}

function normalizeSlaTargetMinutes(value: number): number {
  const result = Number(value);
  return Number.isFinite(result) && result >= 1 ? Math.floor(result) : 1;
}
