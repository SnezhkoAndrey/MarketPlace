"use client";

import { useState } from "react";
import "./FieldForm.scss";
import { Field, ErrorMessage } from "formik";
import Image from "next/image";

const FieldForm = ({ fieldName }: { fieldName: string }) => {
  const [showPassword, setShowPassword] = useState(false);

  function capitalizeFirstLetter(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  const label = capitalizeFirstLetter(fieldName);
  return (
    <div
      className={`inputContainer ${
        fieldName === "password" ||
        fieldName === "name" ||
        fieldName === "email"
          ? ""
          : "goodsField"
      }`}
    >
      <Field
        id={fieldName}
        name={fieldName}
        className="input"
        type={
          fieldName === "password" ? (showPassword ? "text" : "password") : ""
        }
        placeholder=""
      />
      <label className={fieldName}>{label}</label>
      <ErrorMessage name={fieldName}>{(msg) => <div>{msg}</div>}</ErrorMessage>
      {fieldName === "password" ? (
        <button
          className="showPasswordButton"
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          title={showPassword ? "hide password" : "show password"}
        >
          {showPassword ? (
            <Image src={"/eye.svg"} width={20} height={20} alt="user" />
          ) : (
            <Image src={"/eye-slash.svg"} width={20} height={20} alt="user" />
          )}
        </button>
      ) : null}
      {fieldName === "email" ? (
        <Image
          src={"/email.svg"}
          width={20}
          height={20}
          alt="user"
          className="emailLogo"
        />
      ) : null}
      {fieldName === "name" ? (
        <Image
          src={"/user.svg"}
          width={20}
          height={20}
          alt="user"
          className="emailLogo"
        />
      ) : null}
    </div>
  );
};

export default FieldForm;
