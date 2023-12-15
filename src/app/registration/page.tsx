"use client";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { createUser } from "@/redux/usersSlice";
import Link from "next/link";
import "./Registration.scss";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import FieldForm from "@/components/FieldForm";
import SquareBackgroundAnimation from "@/components/SquareBackgroundAnimation";
import Image from "next/image";

const Registration = () => {
  const { push } = useRouter();

  const dispatch = useAppDispatch();

  return (
    <>
      <ul className="backgroundRegistration">
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
      </ul>
      <Link href={"/"}>
        <button className="linkBack">
          <Image src={"/arrow-left.svg"} width={20} height={20} alt="user" />
          <div className="linkBackTitle">Go to main</div>
        </button>
      </Link>
      <Formik
        initialValues={{
          email: "",
          password: "",
          name: "",
        }}
        // validationSchema={SigninSchema}
        onSubmit={(values, { resetForm }) => {
          dispatch(createUser({ ...values }));
          push("/");
          resetForm({
            values: {
              email: "",
              password: "",
              name: "",
            },
          });
        }}
      >
        {({ isValid, dirty }) => (
          <Form className={"form"}>
            <div className="titleRegistration">Registration</div>

            <FieldForm fieldName="email" />

            <FieldForm fieldName="password" />

            <FieldForm fieldName="name" />

            <button
              type="submit"
              disabled={!isValid || !dirty}
              className="signUp"
            >
              Sign up
            </button>
            <div className="warning">
              Attention! This is a test application, please do not use real
              data!
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default Registration;
