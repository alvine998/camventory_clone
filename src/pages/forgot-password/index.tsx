import Button from "@/components/Button";
import Input from "@/components/Input";
import { COLOR } from "@/utils/color";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [emailStatus, setEmailStatus] = useState<string>("waiting");
  const [email, setEmail] = useState<string>("");

  const onSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        email: e.target.email.value,
      };
      console.log(payload);
      setEmail(payload?.email);
      setEmailStatus("success");
      setLoading(false);
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
          <h1 className="text-4xl font-bold text-white">
            Atur Ulang Kata Sandi Anda
          </h1>
          <h3 className="text-2xl font-bold text-white mt-4">
            Atur ulang kata sandi Anda, agar Anda dapat terus menggunakan
            aplikasi Camventory
          </h3>
        </div>
        <div className=" lg:mt-0 mt-5 lg:w-1/2 w-full lg:ml-40 ml-0 lg:mr-20 mr-0 lg:px-0 px-5">
          <div className="bg-white rounded-lg shadow lg:px-10 px-4 lg:py-20 py-6">
            <h5 className={`text-center font-bold text-xl text-orange-500`}>
              Lupa Kata Sandi
            </h5>
            <form onSubmit={onSubmit} className="flex flex-col gap-2 mt-5">
              {emailStatus === "waiting" ? (
                <>
                  <p className="text-center text-gray-500 mt-2">
                    Jangan khawatir kami akan mengirimkan instruksi untuk
                    mengatur ulang
                  </p>
                  <Input
                    name="email"
                    label="Email"
                    required
                    type="email"
                    placeholder="Enter email"
                  />
                  {errorMessage && (
                    <p className="my-1 text-sm text-red-500">{errorMessage}</p>
                  )}
                  <Button
                    variant="custom-color"
                    disabled={loading}
                    className="bg-orange-500 mt-4"
                  >
                    {loading ? "Loading..." : "Reset Kata Sandi"}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-center text-gray-500">
                    Kami telah mengirimkan email untuk reset kata sandi ke
                    emailmu
                  </p>
                  <p className="text-center font-bold text-black">{email}</p>
                  <Button
                    variant="custom-color"
                    disabled={loading}
                    className="bg-orange-500 mt-4"
                  >
                    {loading ? "Loading..." : "Kirim Ulang"}
                  </Button>
                </>
              )}

              <Link href={"/"} className="w-full">
                <Button
                  type="button"
                  variant="white"
                  className="flex justify-center items-center gap-2 w-full"
                >
                  <ArrowLeftIcon className="text-orange-500 w-5" />
                  Kembali
                </Button>
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
