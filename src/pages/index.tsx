import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLOR } from "@/utils/color";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

export default function Home() {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const onSubmit = (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        username: e.target.username.value,
        password: e.target.password.value,
      };
    } catch (error) {
      console.log(error);
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
          <h1 className="text-4xl font-bold text-white">
            Kamu Sedang Mencari Kamera?
          </h1>
          <h3 className="text-2xl font-bold text-white mt-4">
            Temukan berbagai pilihan berkualitas dengan harga terbaik hanya di
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
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row gap-2">
                  <input type="checkbox" />
                  <span className="text-xs">Remember me</span>
                </div>
                <Link href={"forgot-password"} className="text-xs text-red-500">
                  Forgot Password
                </Link>
              </div>
              <Button variant="custom-color" className="bg-orange-500 mt-4">
                Login
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
