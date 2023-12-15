import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState, AppThunk } from "./store";
import HTTPClient from "../api/api";
import { CurrentUserType, UserType } from "@/types/types";

const { GET, DELETE, POST, PUT } = HTTPClient();

const initialState = {
  users: [] as UserType[],
  findUser: {} as UserType,
  loadingData: false,
  error: "",
  currentUser: {} as CurrentUserType,
  isAuthData: false,
};

export const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<UserType[]>) => {
      state.users = action.payload;
    },
    setFindUser: (state, action: PayloadAction<UserType>) => {
      state.findUser = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<CurrentUserType>) => {
      state.currentUser = action.payload;
    },
    setAuth: (state, action: PayloadAction<boolean>) => {
      state.isAuthData = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loadingData = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setUsers,
  setFindUser,
  setLoading,
  setError,
  setCurrentUser,
  setAuth,
} = usersSlice.actions;

export const usersData = ({ users }: RootState) => users.users;
export const findUserData = ({ users }: RootState) => users.findUser;
export const currentUser = ({ users }: RootState) => users.currentUser;
export const isAuthData = ({ users }: RootState) => users.isAuthData;
export const loadingData = ({ users }: RootState) => users.loadingData;
export const selectError = ({ users }: RootState) => users.error;

export const setUsersData = (): AppThunk => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const response = await GET("users");
    dispatch(setUsers(response));
    dispatch(setLoading(false));
  } catch (error: any) {
    dispatch(setError(error.message));
    dispatch(setLoading(false));
  }
};

export const removeUser =
  (id: string, currentId?: string): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      if (id === currentId) {
        dispatch(logout());
      }
      await DELETE(`users/${id}`);
      await DELETE(`goods/user/${id}`);
      dispatch(setUsersData());
      dispatch(setLoading(false));
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export const createUser =
  (user: UserType): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      const response = await POST(`registration`, user);
      dispatch(login(response));
      dispatch(setLoading(false));
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export const getUser =
  (id: string): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      const response = await GET(`users/${id}`);
      dispatch(setFindUser(response));
      dispatch(setLoading(false));
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export const editUser =
  (name: string, id: string): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      await PUT(`users/${id}`, name);
      dispatch(getUser(id));
      dispatch(setLoading(false));
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export const login =
  (user: UserType): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      const response = await POST(`login`, user);
      if (!response.message) {
        dispatch(setCurrentUser(response));
        dispatch(setAuth(true));
        localStorage.setItem("token", response.token);
        dispatch(setLoading(false));
      } else {
        console.log(response.message);
        dispatch(setError(response.message));
      }
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export const auth = (): AppThunk => async (dispatch, getState) => {
  try {
    const token = localStorage.getItem("token") as string;

    if (token) {
      dispatch(setLoading(true));
      const response = await GET(`auth`, {
        key: "Authorization",
        value: `Bearer ${token}`,
      });

      if (!response.message) {
        dispatch(setCurrentUser(response));
        dispatch(setAuth(true));
        localStorage.removeItem("token");

        localStorage.setItem("token", response.token);
        dispatch(setLoading(false));
      } else {
        localStorage.removeItem("token");
        dispatch(setError(response.message));
      }
    }
  } catch (error: any) {
    localStorage.removeItem("token");
    dispatch(setError(error.message));
    dispatch(setLoading(false));
  }
};

export const logout = (): AppThunk => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    localStorage.removeItem("token");
    dispatch(setCurrentUser({} as CurrentUserType));
    dispatch(setAuth(false));
    dispatch(setLoading(false));
  } catch (error: any) {
    dispatch(setError(error.message));
    dispatch(setLoading(false));
  }
};

export default usersSlice.reducer;
