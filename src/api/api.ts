import { ProductType, UserType } from "@/types/types";

interface headerParam {
  key: string;
  value: string;
}

const HTTPClient = () => {
  const myHeaders = new Headers();
  myHeaders.append("content-type", "application/json");
  const baseURL = "http://localhost:5000/";

  async function fetchJSON(
    endpoint: string,
    options = {},
    params?: headerParam
  ) {
    if (params?.key) {
      myHeaders.set(params?.key, params?.value);
    }

    const response = await fetch(baseURL + endpoint, {
      ...options,
      headers: myHeaders,
    });

    const data = await response.json();

    console.log(data);

    return data;
  }

  const GET = async (endpoint: string, params?: headerParam) => {
    return await fetchJSON(
      endpoint,
      {
        method: "get",
      },
      params
    );
  };

  const DELETE = async (endpoint: string) => {
    return await fetchJSON(endpoint, {
      method: "delete",
    });
  };

  const POSTProduct = async (endpoint: string, product: ProductType) => {
    return await fetchJSON(endpoint, {
      method: "post",
      body: JSON.stringify(product),
    });
  };

  const POST = async (
    endpoint: string,
    { email, password, name }: UserType
  ) => {
    return await fetchJSON(endpoint, {
      method: "post",
      body: JSON.stringify(
        name ? { email, password, name } : { email, password }
      ),
    });
  };

  const PUTProduct = async (
    endpoint: string,
    value: {
      title: string;
      category: string;
      description: string;
      price: string;
    }
  ) => {
    return await fetchJSON(endpoint, {
      method: "put",
      body: JSON.stringify({ ...value }),
    });
  };

  const PUT = async (endpoint: string, name: string) => {
    return await fetchJSON(endpoint, {
      method: "put",
      body: JSON.stringify({ name }),
    });
  };

  return { GET, DELETE, POST, PUT, POSTProduct, PUTProduct };
};

export default HTTPClient;
