import { useState } from "react";

const EMPTY = { titulo: "", data: "", hora: "", descricao: "" };

export function Form({ editing, onSave, onCancel }) {
    const [values, setValues] = useState(editing ?? EMPTY);

    // Reinicia o formulário quando o item em edição muda (padrão de ajuste de estado durante a renderização).
    const [lastEditing, setLastEditing] = useState(editing);
    if (editing !== lastEditing) {
        setLastEditing(editing);
        setValues(editing ?? EMPTY);
    }

    const handleChange = (event) => setValues({ ...values, [event.target.name]: event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        const ok = await onSave(values);
        if (ok && !editing) setValues(EMPTY);
    };

    return (
        <form className="agenda-form" onSubmit={handleSubmit}>
            <h2>{editing ? "Editar compromisso" : "Novo compromisso"}</h2>
            <label>
                Título
                <input name="titulo" value={values.titulo} onChange={handleChange} maxLength={120} required />
            </label>
            <div className="agenda-form-row">
                <label>
                    Data
                    <input type="date" name="data" value={values.data} onChange={handleChange} required />
                </label>
                <label>
                    Hora
                    <input type="time" name="hora" value={values.hora} onChange={handleChange} required />
                </label>
            </div>
            <label>
                Descrição
                <textarea name="descricao" value={values.descricao} onChange={handleChange} maxLength={500} rows={3} />
            </label>
            <div className="agenda-form-actions">
                <button type="submit">{editing ? "Salvar" : "Adicionar"}</button>
                {editing && (
                    <button type="button" className="secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                )}
            </div>
        </form>
    );
}
