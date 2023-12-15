"use client";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { login } from "@/redux/usersSlice";
import Link from "next/link";
import "./Login.scss";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import FieldForm from "@/components/FieldForm";
import Image from "next/image";

const Login = () => {
  const { push } = useRouter();

  const dispatch = useAppDispatch();

  return (
    <>
      <ul className="background">
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
      <Link href={"/"} className="linkContainer">
        <button className="linkBack">
          <Image src={"/arrow-left.svg"} width={20} height={20} alt="user" />
          <div className="linkBackTitle">Go to main</div>
        </button>
      </Link>
      <Formik
        initialValues={{
          email: "",
          password: "",
        }}
        // validationSchema={SigninSchema}
        onSubmit={(values, { resetForm }) => {
          dispatch(login({ ...values }));
          push("/");
          resetForm({
            values: {
              email: "",
              password: "",
            },
          });
        }}
      >
        {({ isValid, dirty }) => (
          <Form className={"form"}>
            <div className="titleLogin">Log In</div>
            <FieldForm fieldName="email" />

            <FieldForm fieldName="password" />

            <button
              type="submit"
              disabled={!isValid || !dirty}
              className="login"
            >
              Log in
            </button>

            <div className="registrationContainer">
              <div className="registrationTitle">Don't have a account</div>
              <Link href={"/registration"}>
                <button className="registrationButton">Register</button>
              </Link>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default Login;
