export const TZ = "America/Sao_Paulo";

export function todayYMD() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function combineDateTime(dateYmd: string, timeHm: string) {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const [hh, mm] = timeHm.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addMinutesToTime(timeHm: string, minutes: number) {
  const base = combineDateTime("2000-01-01", timeHm);
  const end = addMinutes(base, minutes);
  const hh = String(end.getHours()).padStart(2, "0");
  const mm = String(end.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function startOfDay(dateYmd: string) {
  return combineDateTime(dateYmd, "00:00");
}

export function endOfDay(dateYmd: string) {
  return combineDateTime(dateYmd, "23:59");
}

export function weekdayFromYmd(dateYmd: string) {
  return combineDateTime(dateYmd, "12:00").getDay();
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function formatTime(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateBR(value: Date | string) {
  let d: Date;
  
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "string" && value.includes("-") && !value.includes(":")) {
    // Parse "YYYY-MM-DD" format correctly
    d = combineDateTime(value, "12:00");
  } else {
    d = new Date(value);
  }
  
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTimeBR(value: Date | string) {
  let d: Date;
  
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "string" && value.includes("-") && !value.includes(":")) {
    // Parse "YYYY-MM-DD" format correctly
    d = combineDateTime(value, "12:00");
  } else {
    d = new Date(value);
  }
  
  const date = d.toLocaleDateString("pt-BR");
  const time = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return `${date} ${time}`;
}

export function getCurrentTimeForTimezone() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

export function ymdFromDate(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWithinSchedule(
  start: Date,
  end: Date,
  dateYmd: string,
  horarios: {
    diaSemana: number;
    horaInicio: string;
    horaFim: string;
    intervaloInicio: string | null;
    intervaloFim: string | null;
    ativo: boolean;
  }[]
) {
  if (!horarios.length) return true;

  const weekday = weekdayFromYmd(dateYmd);

  const dayRules = horarios.filter((item) => item.ativo && item.diaSemana === weekday);
  if (!dayRules.length) return false;

  for (const rule of dayRules) {
    const turnoInicio = combineDateTime(dateYmd, rule.horaInicio);
    const turnoFim = combineDateTime(dateYmd, rule.horaFim);

    if (start < turnoInicio || end > turnoFim) continue;

    if (rule.intervaloInicio && rule.intervaloFim) {
      const intInicio = combineDateTime(dateYmd, rule.intervaloInicio);
      const intFim = combineDateTime(dateYmd, rule.intervaloFim);

      if (overlaps(start, end, intInicio, intFim)) {
        continue;
      }
    }

    return true;
  }

  return false;
}

export function buildTimeSlots(startHour = 8, endHour = 20, interval = 30) {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "R$ 0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}