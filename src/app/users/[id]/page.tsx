"use client";

import { useEffect, useState } from "react";
import "./UserPage.scss";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import {
  editUser,
  getUser,
  removeUser,
  findUserData,
  currentUser,
  auth,
} from "@/redux/usersSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductCreateForm from "./components/ProductCreateForm";
import { getUserProduct, userGoodsData } from "@/redux/goodsSlice";
import { Formik, Form } from "formik";
import FieldForm from "@/components/FieldForm";

const User = ({ params }: { params: { id: string } }) => {
  const { back } = useRouter();

  const user = useAppSelector(findUserData);
  const current = useAppSelector(currentUser);
  const userGoods = useAppSelector(userGoodsData);

  const [edit, setEdit] = useState(false);

  const dispatch = useAppDispatch();

  const handleDeleteUser = () => {
    dispatch(removeUser(params.id, current.user.id));
    back();
  };

  useEffect(() => {
    dispatch(auth());
    dispatch(getUser(params.id));
    dispatch(getUserProduct(params.id));
  }, []);

  return (
    <div className="userPageMain">
      <button className="link" onClick={back}>
        Go back
      </button>
      {edit ? (
        <Formik
          initialValues={{
            name: current.user.name,
          }}
          // validationSchema={SigninSchema}
          onSubmit={(values, { resetForm }) => {
            dispatch(editUser(values.name, params.id));
            setEdit(false);
            resetForm({
              values: {
                name: "",
              },
            });
          }}
        >
          {({ isValid, dirty }) => (
            <Form className={"form"}>
              <FieldForm fieldName="name" />

              <button type="submit" disabled={!isValid || !dirty}>
                Save
              </button>
            </Form>
          )}
        </Formik>
      ) : (
        <div className="user">
          <div>Name: {user.name}</div>
        </div>
      )}
      {current.user?.id === params.id ? (
        <>
          <div className="container">
            <button className="button" onClick={() => setEdit((prev) => !prev)}>
              Settings
            </button>
            <button className="button" onClick={handleDeleteUser}>
              Delete account
            </button>
          </div>
          <ProductCreateForm id={params.id} />
        </>
      ) : null}
      {userGoods.map((ug) => (
        <Link href={`/goods/${ug.id}`} key={ug.id}>
          <div>{ug.title}</div>
        </Link>
      ))}
    </div>
  );
};

export default User;
