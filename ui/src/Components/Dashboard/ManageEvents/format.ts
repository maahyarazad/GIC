const EMPTY = "—";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

/** "YYYY-MM-DD" (a Dubai calendar day) → "15 Oct 2026", without a UTC shift. */
export const formatDay = (date?: string | null): string => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? "");
    if (!match) return EMPTY;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString("en-GB", DATE_FORMAT);
};

/** ISO timestamp → "15 Oct 2026, 18:30" in the viewer's time zone. */
export const formatTimestamp = (value?: string | null): string => {
    if (!value) return EMPTY;
    const date = new Date(value);
    return isNaN(date.getTime())
        ? EMPTY
        : date.toLocaleString("en-GB", { ...DATE_FORMAT, hour: "2-digit", minute: "2-digit" });
};
