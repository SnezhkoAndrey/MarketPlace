export type UserType = {
  id?: string;
  email: string;
  password: string;
  name?: string;
};

export type CurrentUserType = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export type ProductType = {
  id?: string;
  title: string;
  userId: string;
  category: string;
  description: string;
  price: string;
};
