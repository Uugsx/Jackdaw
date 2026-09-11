import { getLocalStorage } from "../Util/LocalStorage";
import {
  DEFAULT_WORKING_HOURS_SCHEDULE,
  cloneWorkingHoursSchedule,
  normalizeWorkingHoursSchedule,
  type WorkingHoursSchedule,
} from "../../logic/Reports/WorkingHours";

export const WORKING_HOURS_STORAGE_KEY = "reports.working-hours.v1";

const workingHoursSetting = getLocalStorage<unknown>(
  WORKING_HOURS_STORAGE_KEY,
  {},
);

export function getWorkingHoursSchedule(
  accountId: number | null,
): WorkingHoursSchedule {
  if (accountId == null) {
    return cloneWorkingHoursSchedule(DEFAULT_WORKING_HOURS_SCHEDULE);
  }
  const configs = readConfigMap();
  return normalizeWorkingHoursSchedule(
    configs[String(accountId)],
    DEFAULT_WORKING_HOURS_SCHEDULE,
  );
}

export function setWorkingHoursSchedule(
  accountId: number,
  schedule: WorkingHoursSchedule,
): void {
  const configs = readConfigMap();
  const next = {
    ...configs,
    [String(accountId)]: normalizeWorkingHoursSchedule(schedule),
  };
  workingHoursSetting.value = next;
}

export function subscribeWorkingHoursSettings(
  listener: () => void,
): () => void {
  return workingHoursSetting.subscribe(listener);
}

function readConfigMap(): Record<string, unknown> {
  try {
    const value = workingHoursSetting.value;
    return value && typeof value == "object" && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {};
  } catch {
    return {};
  }
}
