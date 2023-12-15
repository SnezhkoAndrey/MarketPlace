import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import usersReducer from "./usersSlice";
import goodsReducer from "./goodsSlice";

export const store = configureStore({
  reducer: {
    users: usersReducer,
    goods: goodsReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
