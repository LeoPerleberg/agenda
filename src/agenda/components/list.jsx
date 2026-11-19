import { Item } from "./item";

function formatDate(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export function List({ items, onEdit, onRemove }) {
    if (items.length === 0) return <p className="agenda-empty">Nenhum compromisso cadastrado.</p>;

    const sorted = [...items].sort((a, b) => `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`));
    const groups = new Map();
    for (const item of sorted) {
        if (!groups.has(item.data)) groups.set(item.data, []);
        groups.get(item.data).push(item);
    }

    return (
        <section className="agenda-list">
            {[...groups].map(([date, dayItems]) => (
                <div key={date} className="agenda-day">
                    <h3>{formatDate(date)}</h3>
                    <ul>
                        {dayItems.map((item) => (
                            <Item key={item.id} item={item} onEdit={onEdit} onRemove={onRemove} />
                        ))}
                    </ul>
                </div>
            ))}
        </section>
    );
}
