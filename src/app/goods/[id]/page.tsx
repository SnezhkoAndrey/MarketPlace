"use client";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import {
  editProduct,
  getProduct,
  productData,
  removeProduct,
} from "@/redux/goodsSlice";
import { auth, currentUser, findUserData } from "@/redux/usersSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import FieldForm from "@/components/FieldForm";

const Product = ({ params }: { params: { id: string } }) => {
  const { back } = useRouter();

  const product = useAppSelector(productData);

  const user = useAppSelector(findUserData);

  const current = useAppSelector(currentUser);

  const [isEdit, setIsEdit] = useState(false);

  const dispatch = useAppDispatch();

  const handleDeleteProduct = () => {
    dispatch(removeProduct(params.id));
    back();
  };

  useEffect(() => {
    dispatch(auth());
    dispatch(getProduct(params.id));
  }, []);

  return (
    <div>
      <button className="link" onClick={back}>
        Go back
      </button>
      {isEdit ? (
        <Formik
          initialValues={{
            title: product.title,
            category: product.category,
            description: product.description,
            price: product.price,
          }}
          // validationSchema={SigninSchema}
          onSubmit={(values, { resetForm }) => {
            dispatch(editProduct(params.id, { ...values }));
            setIsEdit(false);
            resetForm({
              values: {
                title: "",
                category: "",
                description: "",
                price: "",
              },
            });
          }}
        >
          {({ isValid, dirty }) => (
            <Form className={"form"}>
              <FieldForm fieldName="title" />

              <FieldForm fieldName="category" />

              <FieldForm fieldName="description" />

              <FieldForm fieldName="price" />

              <button type="submit" disabled={!isValid || !dirty}>
                Save
              </button>
            </Form>
          )}
        </Formik>
      ) : (
        <div>
          <div>{product.title}</div>
          <div>{product.category}</div>
          <div>{product.description}</div>
          <div>{product.price}</div>
          <div>
            Added: <Link href={`/users/${product.userId}`}>{user.name}</Link>
          </div>
        </div>
      )}
      {current.user?.id === product.userId ? (
        <>
          <button onClick={() => setIsEdit((prev) => !prev)}>Settings</button>
          <button onClick={handleDeleteProduct}>Delete</button>
        </>
      ) : null}
    </div>
  );
};

export default Product;
