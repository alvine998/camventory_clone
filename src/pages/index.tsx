import Button from "@/components/Button";
import Input from "@/components/Input";
import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";
import { CheckIcon } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function Home() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        username: (e.target as HTMLFormElement).username.value,
        password: (e.target as HTMLFormElement).password.value,
        is_remember: checked,
      };
      const result = await axios.post("/api/auth/login", payload);
      Swal.fire({
        icon: "success",
        title: "Login Success",
        showConfirmButton: false,
        timer: 1500,
      });

      // Set user login data
      useAuthStore
        .getState()
        .login(result?.data?.payload?.token, result.data?.payload?.user);

      router.push("/main/dashboard");
      setLoading(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error);
        if (
          "response" in error &&
          error.response &&
          typeof error.response === "object"
        ) {
          const response = error.response as {
            data?: {
              message?: { code: number; message: string; status: boolean };
            };
          };
          setErrorMessage(response?.data?.message?.message);
        } else {
          setErrorMessage("An unexpected error occurred");
        }
        setLoading(false);
      } else {
        console.error("An unknown error occurred");
      }
    }
  };

  useEffect(() => {
    if (errorMessage) {
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    }
  }, [errorMessage]);
  return (
    <div className='bg-[url("/images/bg-login.png")] bg-cover bg-center h-screen lg:p-10 flex flex-col items-center justify-center z-0'>
      <Head>
        <title>Login</title>
      </Head>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-[#85676799] z-10"></div>
      <Image
        alt="logo"
        src={"/images/logo.png"}
        className="w-auto h-auto absolute top-10 left-10 z-20"
        layout="relative"
        width={170}
        height={25}
      />
      <div className="flex lg:flex-row flex-col justify-between items-center w-full z-30">
        <div className="w-1/2 lg:block hidden">
          <h1 className="text-4xl font-bold text-white">
            Are you looking for a camera?
          </h1>
          <h3 className="text-2xl font-bold text-white mt-4">
            Find a variety of quality options at the best prices only at
            Camventory!
          </h3>
        </div>
        <div className=" lg:mt-0 mt-5 lg:w-1/2 w-full lg:ml-40 ml-0 lg:mr-20 mr-0 lg:px-0 px-5">
          <div className="bg-white rounded-lg shadow lg:px-10 px-4 lg:py-20 py-6">
            <h5 className={`text-center font-bold text-xl text-orange-500`}>
              Login
            </h5>
            <p className="text-center text-gray-500 mt-2">
              Enter your Username and Password to get started
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-2 mt-5">
              <Input
                name="username"
                label="Username"
                required
                placeholder="Enter username"
              />
              <Input
                name="password"
                label="Password"
                required
                placeholder="********"
                type="password"
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
              <div className="flex flex-row justify-between items-center mt-2">
                <div className="flex flex-row gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setChecked(!checked);
                    }}
                    className={`border rounded w-5 h-5 ${
                      checked
                        ? "bg-orange-500 flex items-center justify-center border-orange-700"
                        : "bg-transparent border-gray-800"
                    }`}
                  >
                    {checked ? (
                      <CheckIcon className="text-white w-4 h-4 font-bold" />
                    ) : (
                      ""
                    )}
                  </button>
                  <span className="text-xs">Remember me</span>
                </div>
                <Link href={"forgot-password"} className="text-xs text-red-500">
                  Forgot Password
                </Link>
              </div>
              {errorMessage && (
                <p className="my-1 text-sm text-red-500">{errorMessage}</p>
              )}
              <Button
                variant="custom-color"
                disabled={loading}
                className="bg-orange-500 text-white mt-4"
              >
                {loading ? "Loading..." : "Login"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
