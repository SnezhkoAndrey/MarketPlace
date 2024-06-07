"use client";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import "./page.scss";
import Link from "next/link";
import { auth, currentUser, isAuthData, logout } from "@/redux/usersSlice";
import { useEffect, useState } from "react";
import Image from "next/image";
import MyCanvas from "../components/Canvas";
import CursorText from "@/components/AnimatedText";
import AnimatedText from "@/components/AnimatedText";
import Popper from "@/components/Popper/Popper";
import UserLoginSelector from "@/components/UserLoginSelector";

const Home = () => {
  const [openSelector, setOpenSelector] = useState(false);

  const user = useAppSelector(currentUser);

  const isAdmin = user.user?.email === "admin";

  const isAuth = useAppSelector(isAuthData);

  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    dispatch(auth());
  }, []);

  return (
    <main className={"main"}>
      <div className="header">
        <Link href="/goods">
          <button className="link goods">Goods</button>
        </Link>
        {isAuth && isAdmin ? (
          <Link href={"/users"}>
            <button className="link users">Go to users</button>
          </Link>
        ) : null}
        <UserLoginSelector />
      </div>
      <MyCanvas />
    </main>
  );
};

export default Home;
