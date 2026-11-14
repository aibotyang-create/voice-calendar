// Reserved order for deliberately saved-for-later tasks. Ordinary archived rows
// remain dismissed. This keeps compatibility with the existing Firestore schema.
export const SAVED_TODO_ORDER=Number.MAX_SAFE_INTEGER;
export const isSavedTodo=todo=>todo.archived===true&&todo.order===SAVED_TODO_ORDER;
export const savedTodoPatch=()=>({archived:true,order:SAVED_TODO_ORDER});
export const dismissedTodoPatch=()=>({archived:true,order:0});
