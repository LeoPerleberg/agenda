import { SET_ITEMS, ADD_ITEM, UPDATE_ITEM, REMOVE_ITEM } from "./constants";

export const agendaReducer = (state, action) => {
    switch (action.type) {
        case SET_ITEMS:
            return action.payload.items;
        case ADD_ITEM:
            return state.concat(action.payload.item);
        case UPDATE_ITEM:
            return state.map((item) => (item.id === action.payload.item.id ? action.payload.item : item));
        case REMOVE_ITEM:
            return state.filter((item) => item.id !== action.payload.id);
    }

    throw Error(`Unknown action: ${action.type}`);
};
