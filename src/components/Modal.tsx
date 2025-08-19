import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useRef } from "react";

interface Props {
  open: any;
  setOpen: any;
  children: any;
  type?: "filters" | "default";
  size?: "sm" | "md" | "lg" | "xl";
}

export interface useModal {
  data?: any;
  key?: string;
  open: boolean;
}

export default function Modal(props: Props) {
  const { open, setOpen, children, type = "default", size = "sm" } = props;
  const cancelButtonRef = useRef<any>(null);

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={setOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div
              className={`flex min-h-full md:items-center items-center justify-center p-2 ${
                type == "default" ? "pt-2" : "pt-36 lg:pt-60"
              } text-center sm:items-center sm:p-0`}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel
                  className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all lg:py-4 lg:px-4 ${
                    size === "md"
                      ? "lg:w-1/2"
                      : size === "lg"
                      ? "lg:w-full"
                      : "lg:w-1/3"
                  } w-full py-2 px-2`}
                >
                  {children}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
