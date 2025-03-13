import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLOR } from "@/utils/color";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const router = useRouter();

  const onSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        password: e.target.password.value,
        confirm_password: e.target.confirm_password.value,
      };
      console.log(payload);
      setLoading(false);
      router.push("/");
    } catch (error: any) {
      console.log(error);
      setErrorMessage(error?.response?.data?.error_message);
      setLoading(false);
    }
  };
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
          <h1 className="text-4xl font-bold text-white">Reset Your Password</h1>
          <h3 className="text-2xl font-bold text-white mt-4">
            Reset your password, so you can continue using the Camventory App.
          </h3>
        </div>
        <div className=" lg:mt-0 mt-5 lg:w-1/2 w-full lg:ml-40 ml-0 lg:mr-20 mr-0 lg:px-0 px-5">
          <div className="bg-white rounded-lg shadow lg:px-10 px-4 lg:py-20 py-6">
            <h5 className={`text-center font-bold text-xl text-orange-500`}>
              Set a New Password
            </h5>
            <p className="text-center text-gray-500 mt-2">
              New password must be different from your previous password
            </p>
            <form onSubmit={onSubmit} className="flex flex-col gap-2 mt-5">
              <Input
                name="password"
                label="Password"
                required
                type="password"
                placeholder="Enter Password"
              />
              <Input
                name="confirm_password"
                label="Confirm Password"
                required
                type="password"
                placeholder="Enter Confirm Password"
              />
              {errorMessage && (
                <p className="my-1 text-sm text-red-500">{errorMessage}</p>
              )}
              <Button
                variant="custom-color"
                disabled={loading}
                className="bg-orange-500 mt-4"
              >
                {loading ? "Loading..." : "Reset Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
