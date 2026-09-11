import type {
  ReportData,
  ReportDateRange,
  MailResponseRow,
  ReportTimelinePoint,
  TimelineGranularity,
} from "../../logic/Reports/ReportsData";
import { formatWorkingTime } from "../../logic/Reports/WorkingHours";
import { appGlobal } from "../../logic/app";
import { sanitize } from "../../../lib/util/sanitizeDatatypes";

const EXPORT_LOCALE = "ru-RU";
const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MAX_DOWNLOAD_FILENAME_ATTEMPTS = 100;

export interface ReportExportOptions {
  categoryFilterLabel?: string;
  responderColumnLabel?: string;
}

function isFileExistsError(ex: unknown): boolean {
  return (
    typeof ex == "object" &&
    ex != null &&
    (ex as { code?: unknown }).code == "EEXIST"
  );
}

async function saveTextFileToDownloads(
  content: string,
  filename: string,
): Promise<string | null> {
  const remoteApp = appGlobal.remoteApp;
  if (
    typeof remoteApp?.directory != "function" ||
    typeof remoteApp?.path?.join != "function" ||
    typeof remoteApp?.fs?.writeFile != "function"
  ) {
    return null;
  }

  const downloadsDir = await remoteApp.directory("downloads");
  const extensionStart = filename.lastIndexOf(".");
  const basename =
    extensionStart > 0 ? filename.slice(0, extensionStart) : filename;
  const extension = extensionStart > 0 ? filename.slice(extensionStart) : "";

  for (let attempt = 0; attempt < MAX_DOWNLOAD_FILENAME_ATTEMPTS; attempt++) {
    const suffix = attempt == 0 ? "" : ` (${attempt + 1})`;
    const candidate = `${basename}${suffix}${extension}`;
    const filepath = await remoteApp.path.join(downloadsDir, candidate);
    try {
      await remoteApp.fs.writeFile(filepath, content, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
      return candidate;
    } catch (ex) {
      if (!isFileExistsError(ex)) {
        throw ex;
      }
    }
  }

  throw new Error(
    "Не удалось сохранить отчёт: слишком много одноимённых файлов.",
  );
}

export async function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string,
): Promise<string> {
  const safeFilename = sanitize.filename(filename, "report");
  const savedFilename = await saveTextFileToDownloads(content, safeFilename);
  if (savedFilename != null) {
    return savedFilename;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFilename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return safeFilename;
}

export function createReportHTML(
  report: ReportData,
  options: ReportExportOptions = {},
): string {
  const title = "Отчёт об активности Jackdaw Mail";
  const maxTimeline = Math.max(
    1,
    ...report.timeline.map((point) => point.total),
  );
  const maxHeatmap = Math.max(1, ...report.activity.map((cell) => cell.count));
  const maxResponderRequests = Math.max(
    1,
    ...report.mail.responders.map((responder) => responder.requests),
  );
  const maxCategoryRequests = Math.max(
    1,
    ...report.mail.categories.map((category) => category.incoming),
  );
  const maxResponseDayAnswers = Math.max(
    1,
    ...report.mail.responseTimeDays.map((day) => day.answered),
  );
  const weekdays = WEEKDAY_LABELS;
  const outsideWorkingHoursResponseCount = report.mail.responseTimes.filter(
    (response) => response.responseTimeStatus == "outside-working-hours",
  ).length;
  const summaryRows = [
    ["Наблюдаемая активность", formatNumber(report.summary.activityCount)],
    ["Сообщения почты", formatNumber(report.summary.mailMessages)],
    [
      "Запросы с подтверждённым ответом",
      `${formatNumber(report.summary.mailAnswered)} / ${formatNumber(report.summary.mailIncoming)} (${formatPercent(report.summary.responseRate)})`,
    ],
    [
      "Норматив первого ответа",
      `${formatNumber(report.summary.responseTargetMinutes)} рабочих мин`,
    ],
    [
      "Среднее время ответа",
      formatDuration(report.summary.responseTime.averageSeconds),
    ],
    [
      "Ответов в срок",
      `${formatNumber(report.summary.responseTime.withinTarget)} (${formatPercent(responseRate(report.summary.responseTime.withinTarget, report.summary.responseTime.answered))})`,
    ],
    [
      "Просроченных ответов",
      formatNumber(report.summary.responseTime.overTarget),
    ],
    [
      "Ответы вне рабочего времени",
      formatNumber(outsideWorkingHoursResponseCount),
    ],
    ["Сообщения чатов", formatNumber(report.summary.chatMessages)],
    ["Часы в календаре", formatNumber(report.summary.calendarHours, 1)],
    [
      "Изменено файлов",
      `${formatNumber(report.summary.filesChanged)} (${formatBytes(report.summary.fileBytes)})`,
    ],
  ];
  const timeline = report.timeline
    .map((point) => timelineColumn(point, maxTimeline))
    .join("");
  const heatmap = weekdays
    .map((weekday, index) => {
      const cells = Array.from({ length: 24 }, (_, hour) => {
        const count =
          report.activity.find(
            (cell) => cell.weekday == index && cell.hour == hour,
          )?.count ?? 0;
        const opacity = count
          ? Math.max(0.14, Math.min(1, count / maxHeatmap))
          : 0;
        return `<span class="heat-cell" style="--cell-opacity:${numberStyle(opacity)}" title="${escapeHTML(`${weekday} ${String(hour).padStart(2, "0")}:00 — ${count}`)}"></span>`;
      }).join("");
      return `<div class="heat-row"><span class="heat-day">${weekday}</span>${cells}</div>`;
    })
    .join("");
  const responderChart = report.mail.responders.length
    ? report.mail.responders
        .slice(0, 12)
        .map((responder) =>
          barChartRow(
            responder.accountName,
            responder.requests,
            maxResponderRequests,
            `${formatNumber(responder.answered)} с ответом · ${formatPercent(responder.requests ? responder.answered / responder.requests : 0)}`,
            responder.responseTime.overTarget ? "alert" : "accent",
          ),
        )
        .join("")
    : emptyChart("Нет данных по отвечающим за этот период.");
  const categoryChart = report.mail.categories.length
    ? report.mail.categories
        .slice(0, 12)
        .map((category) =>
          barChartRow(
            category.name,
            category.incoming,
            maxCategoryRequests,
            `${formatNumber(category.answered)} с ответом · ${formatNumber(category.responseTime.overTarget)} просрочек`,
            category.responseTime.overTarget ? "alert" : "good",
          ),
        )
        .join("")
    : emptyChart("Нет категорий за этот период.");
  const responseDayChart = report.mail.responseTimeDays.length
    ? report.mail.responseTimeDays
        .slice(-14)
        .map((day) =>
          barChartRow(
            formatDate(parseInputDate(day.day)),
            day.answered,
            maxResponseDayAnswers,
            `${formatNumber(day.withinTarget)} в срок · ${formatNumber(day.overTarget)} просрочек`,
            day.overTarget ? "alert" : "good",
          ),
        )
        .join("")
    : emptyChart("Нет подтверждённых ответов по дням.");

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(title)} — ${escapeHTML(report.range.from)} — ${escapeHTML(report.range.to)}</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1B1C1D; background: #F6F5F2; }
    * { box-sizing: border-box; }
    body { max-width: 1440px; margin: 0 auto; padding: 36px 40px 60px; background: #F6F5F2; }
    h1 { margin: 0 0 8px; font-size: 38px; letter-spacing: -0.04em; }
    h2 { margin: 0 0 5px; font-size: 20px; letter-spacing: -0.02em; }
    p { margin: 0; color: #6A655D; font-size: 13px; line-height: 1.5; }
    .eyebrow { margin-bottom: 9px; color: #B97616; font-size: 11px; font-weight: 800; letter-spacing: .14em; }
    .meta { margin-bottom: 25px; color: #6A655D; font-size: 13px; }
    .summary { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin: 0 0 16px; }
    .summary-card, section { border: 1px solid #C4BEB4; border-radius: 14px; background: #FFF; }
    .summary-card { min-height: 100px; padding: 14px; }
    .summary-card span { display: block; color: #6A655D; font-size: 12px; font-weight: 700; }
    .summary-card strong { display: block; margin-top: 15px; font-size: 25px; letter-spacing: -.04em; }
    section { margin-bottom: 16px; padding: 20px; break-inside: avoid; }
    .section-head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 17px; }
    .section-kicker { margin-bottom: 8px; color: #B97616; font-size: 10px; font-weight: 800; letter-spacing: .14em; }
    .legend { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px 13px; color: #6A655D; font-size: 11px; }
    .legend span { display: inline-flex; align-items: center; gap: 5px; }
    .dot { width: 8px; height: 8px; border-radius: 3px; display: inline-block; }
    .mail-in { background: #6688A8; } .mail-out { background: #B97616; } .chat { background: #4C8B7E; } .calendar { background: #836A9C; } .files { background: #6A8F5C; }
    .chart-scroll, .table-scroll { overflow-x: auto; }
    .chart { display: flex; align-items: flex-end; gap: 5px; min-width: max(100%, 600px); height: 250px; padding: 8px 2px 0; border-bottom: 1px solid #D8D2C8; }
    .column { display: flex; flex: 1 0 14px; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 5px; }
    .stack { display: flex; width: min(100%, 23px); height: 216px; flex-direction: column; justify-content: flex-end; }
    .segment { display: block; width: 100%; min-height: 0; opacity: .88; }
    .segment:first-child { border-radius: 3px 3px 0 0; }
    .axis { overflow: hidden; width: 100%; color: #6A655D; font-size: 9px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
    .heatmap { min-width: 700px; }
    .heat-hours, .heat-row { display: grid; grid-template-columns: 45px repeat(24, minmax(16px, 1fr)); gap: 3px; }
    .heat-hours { margin-bottom: 3px; color: #6A655D; font-size: 9px; text-align: center; }
    .heat-row { grid-auto-rows: 20px; margin-bottom: 3px; }
    .heat-day { align-self: center; color: #6A655D; font-size: 10px; font-weight: 700; text-align: right; }
    .heat-cell { position: relative; border: 1px solid #E1DDD6; border-radius: 4px; background: #F4F2EE; }
    .heat-cell::after { position: absolute; inset: 0; border-radius: inherit; background: #B97616; content: ""; opacity: var(--cell-opacity); }
    .chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
    .chart-block { min-width: 0; }
    .response-day-chart { margin-bottom: 20px; }
    .chart-block h3 { margin: 0 0 11px; font-size: 13px; }
    .bar-chart { display: grid; gap: 10px; }
    .bar-row { display: grid; grid-template-columns: minmax(120px, .62fr) minmax(120px, 1fr) auto; gap: 9px; align-items: center; }
    .bar-label { overflow: hidden; color: #1B1C1D; font-size: 11px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { height: 10px; overflow: hidden; border-radius: 999px; background: #EEEAE4; }
    .bar-fill { display: block; height: 100%; min-width: 0; border-radius: inherit; }
    .bar-fill.accent { background: #B97616; }
    .bar-fill.good { background: #4C8B7E; }
    .bar-fill.alert { background: #B84E3B; }
    .bar-value { min-width: 26px; color: #1B1C1D; font-size: 11px; font-variant-numeric: tabular-nums; text-align: right; }
    .bar-meta { grid-column: 1 / -1; margin-top: -5px; color: #6A655D; font-size: 10px; }
    .chart-empty { padding: 15px 0; color: #6A655D; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 9px 8px; border-bottom: 1px solid #E1DDD6; text-align: left; vertical-align: top; }
    thead th { color: #6A655D; font-size: 10px; letter-spacing: .05em; text-transform: uppercase; white-space: nowrap; }
    tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
    .numeric { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .muted { color: #6A655D; }
    .rate { color: #4C8B7E; font-weight: 700; }
    .response-summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 0 0 18px; }
    .response-summary .summary-card { min-height: 86px; }
    .response-summary .summary-card strong { margin-top: 11px; font-size: 21px; }
    .response-good { color: #4C8B7E; }
    .response-alert { color: #B84E3B; }
    .note { margin-top: 22px; color: #6A655D; font-size: 11px; line-height: 1.5; }
    .schedule-note { margin-top: 7px; }
    @media (max-width: 1000px) { .summary { grid-template-columns: repeat(3, 1fr); } .response-summary { grid-template-columns: repeat(3, 1fr); } .chart-grid { grid-template-columns: 1fr; } }
    @media (max-width: 620px) { body { padding: 22px 16px 40px; } .summary { grid-template-columns: repeat(2, 1fr); } .summary-card:first-child { grid-column: 1 / -1; } }
    @media (max-width: 620px) { .response-summary { grid-template-columns: repeat(2, 1fr); } }
    @media print { body { padding: 0; background: #fff; } section, .summary-card { box-shadow: none; } }
  </style>
</head>
<body>
  <header>
    <p class="eyebrow">ОТЧЁТЫ ОБ АКТИВНОСТИ</p>
    <h1>${escapeHTML(title)}</h1>
  <p class="meta">${escapeHTML(formatRange(report.range))} · ${escapeHTML(report.mailAccountFilter ? `почтовый аккаунт: ${report.mailAccountFilter.accountName}${report.mailAccountFilter.email ? ` — ${report.mailAccountFilter.email}` : ""}` : "все почтовые аккаунты")} · ${escapeHTML(report.mailFolderFilter ? `папка: ${report.mailFolderFilter.name}` : "все папки")}${options.categoryFilterLabel ? ` · ${escapeHTML(`фильтр категорий: ${options.categoryFilterLabel}`)}` : ""} · сформирован ${escapeHTML(formatDateTime(report.generatedAt))}</p>
  </header>
  <div class="summary">${summaryRows.map(([label, value]) => `<div class="summary-card"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join("")}</div>
  <section>
    <div class="section-head"><div><p class="section-kicker">ДИНАМИКА</p><h2>Активность во времени</h2><p>Почта, чаты, календарь и файлы по ${escapeHTML(granularityLabel(report.granularity))}.</p></div><div class="legend"><span><i class="dot mail-in"></i>Входящие письма</span><span><i class="dot mail-out"></i>Исходящие письма</span><span><i class="dot chat"></i>Чаты</span><span><i class="dot calendar"></i>Календарь</span><span><i class="dot files"></i>Файлы</span></div></div>
    <div class="chart-scroll"><div class="chart">${timeline}</div></div>
  </section>
  <section>
    <div class="section-head"><div><p class="section-kicker">РИТМ РАБОТЫ</p><h2>Когда происходит активность</h2><p>Исходящие сообщения, встречи и изменения файлов по дням недели и часам.</p></div></div>
    <div class="chart-scroll"><div class="heatmap"><div class="heat-hours"><span></span>${Array.from({ length: 24 }, (_, hour) => `<span>${hour % 4 == 0 ? `${String(hour).padStart(2, "0")}:00` : ""}</span>`).join("")}</div>${heatmap}</div></div>
  </section>
  <section><div class="section-head"><div><p class="section-kicker">ВРЕМЯ ОТВЕТА</p><h2>Скорость первого ответа</h2><p>От получения запроса до первого подтверждённого ответа. Норматив: ${escapeHTML(`${formatNumber(report.summary.responseTargetMinutes)} рабочих мин.`)}</p><p class="schedule-note">Рабочий календарь: ${escapeHTML(formatWorkingHoursSummary(report.workingHours))}. Ночное время, выходные и часы вне графика не увеличивают время ответа.</p></div></div>
    <div class="response-summary">
      <div class="summary-card"><span>Среднее время ответа</span><strong>${escapeHTML(formatDuration(report.summary.responseTime.averageSeconds))}</strong></div>
      <div class="summary-card"><span>Минимальное время ответа</span><strong>${escapeHTML(formatDuration(report.summary.responseTime.minimumSeconds))}</strong></div>
      <div class="summary-card"><span>Максимальное время ответа</span><strong class="response-alert">${escapeHTML(formatDuration(report.summary.responseTime.maximumSeconds))}</strong></div>
      <div class="summary-card"><span>В срок</span><strong class="response-good">${escapeHTML(formatPercent(responseRate(report.summary.responseTime.withinTarget, report.summary.responseTime.answered)))}</strong></div>
      <div class="summary-card"><span>Просрочки</span><strong class="response-alert">${escapeHTML(formatNumber(report.summary.responseTime.overTarget))}</strong></div>
    </div>
    <div class="chart-block response-day-chart"><h3>Ответы по дням и SLA</h3><div class="bar-chart" role="img" aria-label="Ответы по дням и SLA">${responseDayChart}</div></div>
    <div class="section-head"><div><p class="section-kicker">ДНИ С ПРОСРОЧКАМИ</p><h2>Когда были задержки</h2><p>Дни отсортированы по количеству ответов позже норматива.</p></div></div>
    <div class="table-scroll">${table(
      [
        "День",
        "Ответов",
        "Среднее время",
        "Минимум",
        "Максимум",
        "В срок",
        "Просрочки",
      ],
      report.mail.responseTimeDays
        .filter((day) => day.overTarget > 0)
        .sort(
          (a, b) =>
            b.overTarget - a.overTarget ||
            (b.maximumSeconds ?? 0) - (a.maximumSeconds ?? 0) ||
            b.day.localeCompare(a.day),
        )
        .map((day) => [
          formatDate(parseInputDate(day.day)),
          formatNumber(day.answered),
          formatDuration(day.averageSeconds),
          formatDuration(day.minimumSeconds),
          formatDuration(day.maximumSeconds),
          formatNumber(day.withinTarget),
          formatNumber(day.overTarget),
        ]),
      [1, 2, 3, 4, 5, 6],
    )}</div>
    <div class="section-head"><div><p class="section-kicker">ПОДРОБНОСТИ</p><h2>Самые долгие ответы</h2><p>Полный список ответов за выбранный период.</p></div></div>
    <div class="table-scroll">${table(
      [
        "Поступило",
        "Ответ",
        "Время ответа",
        options.responderColumnLabel ?? "Профиль",
        "Тема",
        "Статус SLA",
      ],
      report.mail.responseTimes.map((response) => [
        formatDateTime(response.requestAt),
        formatDateTime(response.responseAt),
        formatResponseDuration(response),
        response.accountName,
        response.subject,
        formatResponseStatus(response),
      ]),
      [0, 1, 2],
    )}</div>
  </section>
  <section><div class="section-head"><div><p class="section-kicker">ОТВЕТЫ</p><h2>Кто отвечает</h2><p>Сотрудники или почтовые профили с запросами, ответами и самым активным днём/часом.</p></div></div><div class="chart-grid"><div class="chart-block"><h3>Запросы по сотрудникам</h3><div class="bar-chart" role="img" aria-label="Запросы по сотрудникам">${responderChart}</div></div><div class="chart-block"><h3>Запросы по категориям</h3><div class="bar-chart" role="img" aria-label="Запросы по категориям">${categoryChart}</div></div></div><div class="table-scroll">${table(
    [
      options.responderColumnLabel ?? "Профиль",
      "Электронная почта",
      "Запросы",
      "С ответом",
      "Доля",
      "Среднее время",
      "Минимум",
      "Максимум",
      "В срок",
      "Доля в срок",
      "Просрочки",
      "Отправлено",
      "Пиковый день",
      "Пиковый час",
      "Последняя активность",
    ],
    report.mail.responders.map((responder) => [
      responder.accountName,
      responder.email,
      formatNumber(responder.requests),
      formatNumber(responder.answered),
      formatPercent(
        responder.requests ? responder.answered / responder.requests : 0,
      ),
      formatDuration(responder.responseTime.averageSeconds),
      formatDuration(responder.responseTime.minimumSeconds),
      formatDuration(responder.responseTime.maximumSeconds),
      formatNumber(responder.responseTime.withinTarget),
      formatPercent(
        responseRate(
          responder.responseTime.withinTarget,
          responder.responseTime.answered,
        ),
      ),
      formatNumber(responder.responseTime.overTarget),
      formatNumber(responder.sent),
      responder.peakWeekday == null ? "—" : weekdayLabel(responder.peakWeekday),
      responder.peakHour == null ? "—" : formatHour(responder.peakHour),
      formatDate(responder.lastActivity),
    ]),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  )}</div></section>
  <section><div class="section-head"><div><p class="section-kicker">ИСТОЧНИКИ ЗАПРОСОВ</p><h2>Кто создаёт спрос</h2><p>Отправители с наибольшим количеством входящих запросов.</p></div></div><div class="table-scroll">${table(
    [
      "Человек",
      "Электронная почта",
      "Запросы",
      "С ответом",
      "Доля",
      "Отправлено",
      "Последняя активность",
    ],
    report.mail.correspondents.map((person) => [
      person.name || person.email || "Неизвестный контакт",
      person.email,
      formatNumber(person.incoming),
      formatNumber(person.answered),
      formatPercent(person.incoming ? person.answered / person.incoming : 0),
      formatNumber(person.outgoing),
      formatDate(person.lastActivity),
    ]),
    [0, 1, 2, 3, 4, 5, 6],
  )}</div></section>
  <section><div class="section-head"><div><p class="section-kicker">СПРОС</p><h2>Частые запросы</h2><p>Повторяющиеся темы входящих писем без префиксов ответа и пересылки.</p></div></div><div class="table-scroll">${table(
    ["Тема", "Запросы", "С ответом", "Доля", "Последняя активность"],
    report.mail.topics.map((topic) => [
      topic.topic,
      formatNumber(topic.requests),
      formatNumber(topic.answered),
      formatPercent(topic.requests ? topic.answered / topic.requests : 0),
      formatDate(topic.lastActivity),
    ]),
    [0, 1, 2, 3, 4],
  )}</div></section>
  <section><div class="section-head"><div><p class="section-kicker">КАТЕГОРИИ</p><h2>Категории и теги</h2><p>Уникальные письма с каждой меткой; одно письмо может попасть в несколько строк.</p></div></div><div class="table-scroll">${table(
    [
      "Категория",
      "Письма с меткой",
      "Входящие запросы",
      "Исходящие",
      "Подтверждённые ответы",
      "Среднее время",
      "Минимум",
      "Максимум",
      "В срок",
      "Доля в срок",
      "Просрочки",
    ],
    report.mail.categories.map((category) => [
      category.name,
      formatNumber(category.total),
      formatNumber(category.incoming),
      formatNumber(category.outgoing),
      formatNumber(category.answered),
      formatDuration(category.responseTime.averageSeconds),
      formatDuration(category.responseTime.minimumSeconds),
      formatDuration(category.responseTime.maximumSeconds),
      formatNumber(category.responseTime.withinTarget),
      formatPercent(
        responseRate(
          category.responseTime.withinTarget,
          category.responseTime.answered,
        ),
      ),
      formatNumber(category.responseTime.overTarget),
    ]),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  )}</div></section>
  <section><div class="section-head"><div><p class="section-kicker">ПОЧТОВЫЕ ЯЩИКИ</p><h2>Почтовые аккаунты</h2><p>Активность по аккаунтам и папкам.</p></div></div><div class="table-scroll">${table(
    [
      "Аккаунт",
      "Сообщения",
      "Входящие",
      "Исходящие",
      "С ответом",
      "Размер, байт",
      "Последняя активность",
    ],
    report.mail.accounts.map((account) => [
      account.accountName,
      formatNumber(account.total),
      formatNumber(account.incoming),
      formatNumber(account.outgoing),
      formatNumber(account.answered),
      formatBytes(account.totalBytes),
      formatDate(account.lastActivity),
    ]),
    [0, 1, 2, 3, 4, 5, 6],
  )}</div></section>
  <section><div class="section-head"><div><p class="section-kicker">ПАПКИ</p><h2>Почтовые папки</h2><p>Где хранится почтовая активность.</p></div></div><div class="table-scroll">${table(
    ["Аккаунт", "Папка", "Путь", "Сообщения", "Входящие", "Исходящие"],
    report.mail.folders.map((folder) => [
      folder.accountName,
      folder.folderName,
      folder.folderPath,
      formatNumber(folder.total),
      formatNumber(folder.incoming),
      formatNumber(folder.outgoing),
    ]),
    [0, 1, 2, 3, 4, 5],
  )}</div></section>
  <section><div class="section-head"><div><p class="section-kicker">ВРЕМЯ</p><h2>Загрузка календаря</h2><p>Время в событиях и встречах.</p></div></div><div class="table-scroll">${table(
    ["Календарь", "События", "Часы", "Онлайн-встречи", "Участники"],
    report.calendar.calendars.map((calendar) => [
      calendar.calendarName,
      formatNumber(calendar.events),
      formatNumber(calendar.hours, 1),
      formatNumber(calendar.onlineMeetings),
      formatNumber(calendar.participants),
    ]),
    [0, 1, 2, 3, 4],
  )}</div></section>
  <section><div class="section-head"><div><p class="section-kicker">УЧАСТНИКИ</p><h2>Участники календаря</h2><p>Люди, участвовавшие во встречах за период.</p></div></div><div class="table-scroll">${table(
    ["Человек", "Электронная почта", "События"],
    report.calendar.participants.map((person) => [
      person.name,
      person.email,
      formatNumber(person.events),
    ]),
    [0, 1, 2],
  )}</div></section>
  <section><div class="section-head"><div><p class="section-kicker">ДИАЛОГИ</p><h2>Чаты</h2><p>Чаты с наибольшим количеством сообщений.</p></div></div><div class="table-scroll">${table(
    [
      "Чат",
      "Аккаунт",
      "Сообщения",
      "Входящие",
      "Исходящие",
      "Последняя активность",
    ],
    report.chat.rooms.map((room) => [
      room.roomName,
      room.accountName,
      formatNumber(room.total),
      formatNumber(room.incoming),
      formatNumber(room.outgoing),
      formatDate(room.lastActivity),
    ]),
    [0, 1, 2, 3, 4, 5],
  )}</div></section>
  <section><div class="section-head"><div><p class="section-kicker">ДОКУМЕНТЫ</p><h2>Изменённые файлы</h2><p>Папки с наибольшим количеством изменённых файлов.</p></div></div><div class="table-scroll">${table(
    ["Аккаунт", "Папка", "Путь", "Файлы", "Размер"],
    report.files.directories.map((directory) => [
      directory.accountName,
      directory.directoryName,
      directory.directoryPath,
      formatNumber(directory.files),
      formatBytes(directory.bytes),
    ]),
    [0, 1, 2, 3, 4],
  )}</div></section>
  <p class="note">Важно для интерпретации: активность — это измеряемый ориентир по синхронизированным локальным данным, а не учёт рабочего времени. Ответ считается подтверждённым, если почтовый сервер пометил письмо как отвеченное или найдено отправленное письмо, связанное с запросом по In-Reply-To или с той же цепочкой. Время ответа считается в рабочих минутах от получения письма до первого подтверждённого ответа по выбранному графику и отображается только при наличии времени отправки; ночь, выходные и часы вне графика не увеличивают отсчёт. Ответы, между получением и отправкой которых не было рабочего интервала, отмечены как «Вне рабочего времени» и не входят в среднее, SLA и рейтинги. Ответ после конца периода учитывается, если запрос пришёл в выбранный период. Одно письмо может иметь несколько меток, поэтому строки категорий не складываются. Отсутствующая история или несинхронизированный аккаунт делают отчёт неполным.</p>
</body>
</html>`;
}

function timelineColumn(point: ReportTimelinePoint, max: number): string {
  const values = [
    [point.mailIncoming, "mail-in"],
    [point.mailOutgoing, "mail-out"],
    [point.chatIncoming + point.chatOutgoing, "chat"],
    [point.calendarEvents, "calendar"],
    [point.filesChanged, "files"],
  ] as const;
  const segments = values
    .map(
      ([value, className]) =>
        `<i class="segment ${className}" style="height:${numberStyle((value / max) * 100)}%"></i>`,
    )
    .join("");
  return `<div class="column" title="${escapeHTML(`${point.start}: ${point.total}`)}"><div class="stack">${segments}</div><span class="axis">${escapeHTML(timelineLabel(point.start))}</span></div>`;
}

function barChartRow(
  label: string,
  value: number,
  max: number,
  meta: string,
  fillClass: "accent" | "good" | "alert",
): string {
  const percentage = max > 0 ? (Math.max(0, value) / max) * 100 : 0;
  return `<div class="bar-row" title="${escapeHTML(`${label}: ${formatNumber(value)}`)}"><span class="bar-label">${escapeHTML(label)}</span><span class="bar-track"><i class="bar-fill ${fillClass}" style="width:${numberStyle(percentage)}%"></i></span><strong class="bar-value">${escapeHTML(formatNumber(value))}</strong><span class="bar-meta">${escapeHTML(meta)}</span></div>`;
}

function emptyChart(message: string): string {
  return `<p class="chart-empty">${escapeHTML(message)}</p>`;
}

function table(
  headers: string[],
  rows: unknown[][],
  numericColumns: number[],
): string {
  const headerHTML = headers
    .map(
      (header, index) =>
        `<th scope="col"${numericColumns.includes(index) ? ` class="numeric"` : ""}>${escapeHTML(header)}</th>`,
    )
    .join("");
  const bodyHTML = rows.length
    ? rows
        .map(
          (row) =>
            `<tr>${row.map((value, index) => `<td${numericColumns.includes(index) ? ` class="numeric"` : ""}>${escapeHTML(value)}</td>`).join("")}</tr>`,
        )
        .join("")
    : `<tr><td class="muted" colspan="${headers.length}">Нет данных за этот период.</td></tr>`;
  return `<table><thead><tr>${headerHTML}</tr></thead><tbody>${bodyHTML}</tbody></table>`;
}

function escapeHTML(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function numberStyle(value: number): string {
  return String(Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0);
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(EXPORT_LOCALE, { maximumFractionDigits }).format(
    value || 0,
  );
}

function formatPercent(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
  return new Intl.NumberFormat(EXPORT_LOCALE, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(normalized);
}

function responseRate(answered: number, total: number): number {
  return total ? answered / total : 0;
}

function formatWorkingHoursSummary(
  schedule: ReportData["workingHours"],
): string {
  return schedule.days
    .map((day, index) =>
      day.enabled
        ? `${WEEKDAY_LABELS[index]} ${formatWorkingTime(day.startMinutes)}–${formatWorkingTime(day.endMinutes)}`
        : `${WEEKDAY_LABELS[index]} — выходной`,
    )
    .join(" · ");
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) {
    return "—";
  }
  const totalSeconds = Math.max(0, Math.round(seconds));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const restSeconds = totalSeconds % 60;
  if (days) {
    return `${formatNumber(days)} д ${formatNumber(hours)} ч`;
  }
  if (hours) {
    return minutes
      ? `${formatNumber(hours)} ч ${formatNumber(minutes)} мин`
      : `${formatNumber(hours)} ч`;
  }
  if (minutes) {
    return restSeconds
      ? `${formatNumber(minutes)} мин ${formatNumber(restSeconds)} с`
      : `${formatNumber(minutes)} мин`;
  }
  return `${formatNumber(restSeconds)} с`;
}

function formatResponseDuration(
  response: Pick<MailResponseRow, "durationSeconds" | "responseTimeStatus">,
): string {
  return response.responseTimeStatus == "outside-working-hours"
    ? "Не оценивается"
    : formatDuration(response.durationSeconds);
}

function formatResponseStatus(
  response: Pick<MailResponseRow, "responseTimeStatus" | "withinTarget">,
): string {
  if (response.responseTimeStatus == "outside-working-hours") {
    return "Вне рабочего времени";
  }
  return response.withinTarget ? "В срок" : "Просрочка";
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${formatNumber(bytes / Math.pow(1024, index), index ? 1 : 0)} ${units[index]}`;
}

function formatDate(date: Date | null): string {
  return (
    date?.toLocaleDateString(EXPORT_LOCALE, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) ?? "—"
  );
}

function formatDateTime(date: Date): string {
  return date.toLocaleString(EXPORT_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRange(range: ReportDateRange): string {
  const from = parseInputDate(range.from);
  const to = parseInputDate(range.to);
  return from && to
    ? `${formatDate(from)} → ${formatDate(to)}`
    : `${range.from} → ${range.to}`;
}

function timelineLabel(value: string): string {
  const date = parseInputDate(value);
  return date
    ? date.toLocaleDateString(EXPORT_LOCALE, { day: "numeric", month: "short" })
    : value;
}

function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[weekday] ?? "—";
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function granularityLabel(granularity: TimelineGranularity): string {
  return granularity == "day"
    ? "дням"
    : granularity == "week"
      ? "неделям"
      : "месяцам";
}

function parseInputDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() == Number(match[1]) &&
    date.getMonth() == Number(match[2]) - 1 &&
    date.getDate() == Number(match[3])
    ? date
    : null;
}
