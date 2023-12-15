"use client";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { setUsersData, usersData } from "@/redux/usersSlice";
import Link from "next/link";
import { useEffect } from "react";
import "./Users.scss";

const Users = () => {
  const users = useAppSelector(usersData);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setUsersData());
  }, []);

  return (
    <div className="usersMain">
      <Link href={"/"}>
        <button className="link">Go to main</button>
      </Link>
      {users.map((tr) => (
        <Link key={tr.id} href={`/users/${tr.id}`}>
          <div className="users">{tr.name}</div>
        </Link>
      ))}
    </div>
  );
};

export default Users;
