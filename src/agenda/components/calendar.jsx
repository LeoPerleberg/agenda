import { useState } from "react";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const pad = (n) => String(n).padStart(2, "0");
const toMonthValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const toIsoDate = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

export function Calendar({ items }) {
    const [month, setMonth] = useState(() => toMonthValue(new Date()));

    const [year, monthNumber] = month.split("-").map(Number);
    const monthIndex = monthNumber - 1;
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = toIsoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    const byDate = new Map();
    for (const item of items) {
        if (!byDate.has(item.data)) byDate.set(item.data, []);
        byDate.get(item.data).push(item);
    }

    const shiftMonth = (delta) => setMonth(toMonthValue(new Date(year, monthIndex + delta, 1)));
    const handleMonthChange = (event) => {
        if (event.target.value) setMonth(event.target.value);
    };

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);

    return (
        <aside className="agenda-calendar">
            <div className="agenda-calendar-nav">
                <button type="button" className="secondary" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
                    &lsaquo;
                </button>
                <input type="month" value={month} onChange={handleMonthChange} aria-label="Selecionar mês" />
                <button type="button" className="secondary" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
                    &rsaquo;
                </button>
            </div>
            <div className="agenda-calendar-grid">
                {WEEKDAYS.map((name) => (
                    <div key={name} className="agenda-calendar-weekday">
                        {name}
                    </div>
                ))}
                {cells.map((day, index) => {
                    if (day === null) return <div key={`empty-${index}`} className="agenda-calendar-day empty" />;
                    const iso = toIsoDate(year, monthIndex, day);
                    const dayItems = (byDate.get(iso) ?? []).sort((a, b) => a.hora.localeCompare(b.hora));
                    return (
                        <div key={iso} className={`agenda-calendar-day${iso === today ? " today" : ""}`}>
                            <span className="agenda-calendar-number">{day}</span>
                            {dayItems.map((item) => (
                                <span key={item.id} className="agenda-calendar-event" title={`${item.hora} ${item.titulo}`}>
                                    {item.hora} {item.titulo}
                                </span>
                            ))}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
