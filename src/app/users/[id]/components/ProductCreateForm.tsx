"use client";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { createProduct } from "@/redux/goodsSlice";
import { Formik, Form } from "formik";
import FieldForm from "@/components/FieldForm";

const ProductCreateForm = ({ id }: { id: string }) => {
  const dispatch = useAppDispatch();

  return (
    <Formik
      initialValues={{
        title: "",
        category: "",
        description: "",
        price: "",
      }}
      // validationSchema={SigninSchema}
      onSubmit={(values, { resetForm }) => {
        const { title, category, description, price } = values;
        dispatch(
          createProduct({ title, userId: id, category, description, price })
        );
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
            Add product
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default ProductCreateForm;
