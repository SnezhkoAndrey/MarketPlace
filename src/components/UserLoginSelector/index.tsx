"use client";

import { useState } from "react";
import "./UserLoginSelector.scss";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { currentUser, isAuthData, logout } from "@/redux/usersSlice";
import Image from "next/image";
import Popper from "../Popper/Popper";
import Link from "next/link";

const UserLoginSelector = () => {
  const [openSelector, setOpenSelector] = useState(false);

  const user = useAppSelector(currentUser);

  const isAuth = useAppSelector(isAuthData);

  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };
  return (
    <>
      {isAuth ? (
        <div className="userSelector">
          <button
            className={`link userMenu ${openSelector ? "open" : ""}`}
            onClick={() => {
              setOpenSelector(!openSelector);
            }}
          >
            <div className="userLink">
              <Image src={"/user.svg"} width={25} height={25} alt="user" />
              <div className="name">{user.user?.name}</div>
            </div>
          </button>
          {openSelector && (
            <Popper
              open={openSelector}
              onClickOutside={() => setOpenSelector(false)}
            >
              <Link href={`/users/${user.user.id}`}>
                <div className="menuItem profile">Profile</div>
              </Link>
              <button className="menuItem logout" onClick={handleLogout}>
                Logout
              </button>
            </Popper>
          )}
        </div>
      ) : (
        <Link href={"/login"}>
          <button className="link login">Login</button>
        </Link>
      )}
    </>
  );
};

export default UserLoginSelector;
