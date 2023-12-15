import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState, AppThunk } from "./store";
import HTTPClient from "../api/api";
import { ProductType } from "@/types/types";
import { getUser } from "./usersSlice";

const { GET, DELETE, POSTProduct, PUTProduct } = HTTPClient();

const initialState = {
  goods: [] as ProductType[],
  userGoods: [] as ProductType[],
  product: {} as ProductType,
  loadingData: false,
  error: "",
};

export const goodsSlice = createSlice({
  name: "goods",
  initialState,
  reducers: {
    setGoods: (state, action: PayloadAction<ProductType[]>) => {
      state.goods = action.payload;
    },
    setUserGoods: (state, action: PayloadAction<ProductType[]>) => {
      state.userGoods = action.payload;
    },
    setProduct: (state, action: PayloadAction<ProductType>) => {
      state.product = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loadingData = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setGoods, setUserGoods, setProduct, setLoading, setError } =
  goodsSlice.actions;

export const goodsData = ({ goods }: RootState) => goods.goods;
export const userGoodsData = ({ goods }: RootState) => goods.userGoods;
export const productData = ({ goods }: RootState) => goods.product;
export const loadingData = ({ goods }: RootState) => goods.loadingData;
export const selectError = ({ goods }: RootState) => goods.error;

export const setGoodsData = (): AppThunk => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const response = await GET("goods");
    dispatch(setGoods(response));
    dispatch(setLoading(false));
  } catch (error: any) {
    dispatch(setError(error.message));
    dispatch(setLoading(false));
  }
};

export const createProduct =
  (product: ProductType): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      await POSTProduct(`goods`, product);
      const response = await GET(`goods/user/${product.userId}`);
      dispatch(setUserGoods(response));
      dispatch(setLoading(false));
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export const getProduct =
  (id: string): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      const response = await GET(`goods/${id}`);
      dispatch(setProduct(response));
      dispatch(getUser(response.userId));
      dispatch(setLoading(false));
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export const getUserProduct =
  (userId: string): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      const response = await GET(`goods/user/${userId}`);
      dispatch(setUserGoods(response));
      dispatch(setLoading(false));
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export const removeProduct =
  (id: string): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      await DELETE(`goods/${id}`);
      dispatch(setGoodsData());
      dispatch(setLoading(false));
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export const editProduct =
  (
    id: string,
    value: {
      title: string;
      category: string;
      description: string;
      price: string;
    }
  ): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch(setLoading(true));
      await PUTProduct(`goods/${id}`, value);
      dispatch(getProduct(id));
      dispatch(setLoading(false));
    } catch (error: any) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

export default goodsSlice.reducer;
