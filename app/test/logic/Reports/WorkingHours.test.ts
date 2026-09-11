import { expect, test } from "vitest";
import {
  addWorkingSeconds,
  formatWorkingTime,
  parseWorkingTime,
  validateWorkingHoursSchedule,
  workingSecondsBetween,
  type WorkingDaySchedule,
  type WorkingHoursSchedule,
} from "../../../logic/Reports/WorkingHours";

const workingDay = (
  startMinutes: number,
  endMinutes: number,
): WorkingDaySchedule => ({
  enabled: true,
  startMinutes,
  endMinutes,
});

const dayOff = (): WorkingDaySchedule => ({
  enabled: false,
  startMinutes: 9 * 60,
  endMinutes: 18 * 60,
});

const exampleSchedule: WorkingHoursSchedule = {
  days: [
    workingDay(9 * 60 + 30, 18 * 60),
    workingDay(9 * 60 + 30, 18 * 60),
    workingDay(9 * 60 + 30, 18 * 60),
    workingDay(9 * 60 + 30, 18 * 60),
    workingDay(9 * 60 + 30, 16 * 60),
    dayOff(),
    dayOff(),
  ],
};

test("считает только рабочие минуты с разным графиком по дням", () => {
  const fridayAfternoon = new Date(2026, 8, 4, 15, 50);
  const mondayMorning = new Date(2026, 8, 7, 9, 40);

  expect(
    workingSecondsBetween(fridayAfternoon, mondayMorning, exampleSchedule),
  ).toBe(20 * 60);
  expect(
    workingSecondsBetween(
      new Date(2026, 8, 4, 18, 5),
      mondayMorning,
      exampleSchedule,
    ),
  ).toBe(10 * 60);
  expect(
    workingSecondsBetween(
      new Date(2026, 8, 5, 12),
      mondayMorning,
      exampleSchedule,
    ),
  ).toBe(10 * 60);
});

test("переносит точку напоминания через конец дня и выходные", () => {
  expect(
    addWorkingSeconds(new Date(2026, 8, 4, 15, 50), 20 * 60, exampleSchedule),
  ).toEqual(new Date(2026, 8, 7, 9, 40));
  expect(
    addWorkingSeconds(new Date(2026, 8, 4, 18, 5), 10 * 60, exampleSchedule),
  ).toEqual(new Date(2026, 8, 7, 9, 40));
});

test("проверяет график и формат времени для формы настроек", () => {
  expect(parseWorkingTime("09:30")).toBe(570);
  expect(parseWorkingTime("18:00")).toBe(1080);
  expect(parseWorkingTime("24:00")).toBeNull();
  expect(formatWorkingTime(570)).toBe("09:30");
  expect(validateWorkingHoursSchedule(exampleSchedule)).toBeNull();
  expect(
    validateWorkingHoursSchedule({
      ...exampleSchedule,
      days: exampleSchedule.days.map((day, index) =>
        index == 0 ? { ...day, endMinutes: day.startMinutes } : day,
      ),
    }),
  ).toBe("invalid");
  expect(
    validateWorkingHoursSchedule({
      days: exampleSchedule.days.map((day) => ({ ...day, enabled: false })),
    }),
  ).toBe("no-working-days");
});
