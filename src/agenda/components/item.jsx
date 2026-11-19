export function Item({ item, onEdit, onRemove }) {
    return (
        <li className="agenda-item">
            <time className="agenda-item-hora">{item.hora}</time>
            <div className="agenda-item-info">
                <strong>{item.titulo}</strong>
                {item.descricao && <p>{item.descricao}</p>}
            </div>
            <div className="agenda-item-actions">
                <button type="button" className="secondary" onClick={() => onEdit(item)}>
                    Editar
                </button>
                <button type="button" className="danger" onClick={() => onRemove(item.id)}>
                    Excluir
                </button>
            </div>
        </li>
    );
}
