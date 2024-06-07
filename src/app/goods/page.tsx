"use client";

import { useEffect } from "react";
import "./Goods.scss";
import { goodsData, setGoodsData } from "@/redux/goodsSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import Link from "next/link";
import Image from "next/image";
import UserLoginSelector from "@/components/UserLoginSelector";
import { auth } from "@/redux/usersSlice";

const Goods = () => {
  const goods = useAppSelector(goodsData);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(auth());
    dispatch(setGoodsData());
  }, []);

  return (
    <>
      <div className="background">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="linkContainer">
        <Link href={"/"}>
          <button className="linkBack">
            <Image src={"/arrow-left.svg"} width={20} height={20} alt="arrow" />
            <div className="linkBackTitle">Go to main</div>
          </button>
        </Link>
        <UserLoginSelector />
      </div>
      <div className="goodsContainer">
        {goods.map((gd) => (
          <Link key={gd.id} href={`/goods/${gd.id}`}>
            <div className="productCard">
              <div className="productImage">
                <Image
                  src={"/gallery.svg"}
                  width={100}
                  height={100}
                  alt="productImg"
                  className="productLogo"
                />
              </div>
              <div className="productTitle" title={gd.title}>
                {gd.title}
              </div>
              <div className="productDetails">
                <div className="productPrice">$ {gd.price}</div>
                <Image
                  src={"/arrow-right.svg"}
                  width={20}
                  height={20}
                  alt="arrow"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
};

export default Goods;
