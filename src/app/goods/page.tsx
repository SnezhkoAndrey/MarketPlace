"use client";

import { useEffect } from "react";
import "./Goods.scss";
import { goodsData, setGoodsData } from "@/redux/goodsSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import Link from "next/link";

const Goods = () => {
  const goods = useAppSelector(goodsData);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setGoodsData());
  }, []);
  return (
    <div className="goodsMain">
      <Link href={"/"}>
        <button className="link">Go to main</button>
      </Link>
      {goods.map((gd) => (
        <Link key={gd.id} href={`/goods/${gd.id}`}>
          <div className="goods">{gd.title}</div>
        </Link>
      ))}
    </div>
  );
};

export default Goods;
