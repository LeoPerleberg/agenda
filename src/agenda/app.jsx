import { useEffect, useReducer, useState } from "react";
import { Header } from "./components/header";
import { Form } from "./components/form";
import { List } from "./components/list";
import { Calendar } from "./components/calendar";

import { agendaReducer } from "./reducer";
import { SET_ITEMS, ADD_ITEM, UPDATE_ITEM, REMOVE_ITEM } from "./constants";
import * as api from "./api";

import "./app.css";

export function App() {
    const [items, dispatch] = useReducer(agendaReducer, []);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.listar()
            .then((data) => dispatch({ type: SET_ITEMS, payload: { items: data } }))
            .catch((err) => setError(err.message));
    }, []);

    const run = async (action) => {
        try {
            setError("");
            await action();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const save = (values) =>
        run(async () => {
            if (editing) {
                const item = await api.atualizar(editing.id, values);
                dispatch({ type: UPDATE_ITEM, payload: { item } });
                setEditing(null);
            } else {
                const item = await api.criar(values);
                dispatch({ type: ADD_ITEM, payload: { item } });
            }
        });

    const remove = (id) =>
        run(async () => {
            await api.remover(id);
            dispatch({ type: REMOVE_ITEM, payload: { id } });
            if (editing && editing.id === id) setEditing(null);
        });

    return (
        <main className="agenda">
            <Header />
            <div className="agenda-layout">
                <section className="agenda-main">
                    <Form editing={editing} onSave={save} onCancel={() => setEditing(null)} />
                    {error && <p className="agenda-error" role="alert">{error}</p>}
                    <List items={items} onEdit={setEditing} onRemove={remove} />
                </section>
                <Calendar items={items} />
            </div>
        </main>
    );
}
