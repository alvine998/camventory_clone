import React, { useState, useRef } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { X, Printer, Pencil, RotateCcw } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { IReservation } from "@/types/reservation";
import SignatureCanvas from "react-signature-canvas";

interface PrintPDFModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  reservation: IReservation;
  isCheckoutFlow?: boolean;
  onCheckout?: (signaturePath: string) => void;
}

export default function PrintPDFModal({
  open,
  setOpen,
  reservation,
  isCheckoutFlow = false,
  onCheckout,
}: PrintPDFModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const existingSignaturePath = reservation?.ref_customer?.signature;
  const existingSignatureUrl = existingSignaturePath
    ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${existingSignaturePath}`
    : null;

  const displaySignature = signatureDataUrl || existingSignatureUrl;

  const handleGenerate = async () => {
    if (!printRef.current) return;
    setIsLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = printRef.current;
      const opt = {
        margin: 0,
        filename: `Agreement-${reservation.book_id}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: "in",
          format: "letter",
          orientation: "portrait" as const,
        },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckoutInternal = async () => {
    if (!displaySignature) {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire({
        icon: "warning",
        title: "Signature Required",
        text: "Please provide a signature before checking out.",
      });
      return;
    }

    if (!printRef.current) {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to access the document for PDF generation.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const axios = (await import("axios")).default;
      const html2pdf = (await import("html2pdf.js")).default;

      // Step 1: Get signature path (string only, no URL)
      let signaturePath = "";

      if (existingSignaturePath) {
        // Use existing signature path from database
        signaturePath = existingSignaturePath;
      } else if (signatureDataUrl && signatureDataUrl.startsWith("data:")) {
        // Upload newly drawn signature
        const response = await fetch(signatureDataUrl);
        const blob = await response.blob();

        const formData = new FormData();
        const file = new File([blob], `signature-${reservation.book_id}.png`, {
          type: "image/png",
        });
        formData.append("file", file);
        formData.append("category", "checkout_document");

        const uploadRes = await axios.post("/api/upload", formData);

        if (uploadRes.status === 200 || uploadRes.status === 201) {
          const uploadPayload = uploadRes.data.payload;

          console.log("Upload response payload:", uploadPayload);

          // The backend returns the full response, try to extract the file path
          if (typeof uploadPayload === "string") {
            signaturePath = uploadPayload;
          } else if (uploadPayload?.data?.path) {
            signaturePath = uploadPayload.data.path;
          } else if (uploadPayload?.path) {
            signaturePath = uploadPayload.path;
          } else if (uploadPayload?.url) {
            signaturePath = uploadPayload.url
              .replace(process.env.NEXT_PUBLIC_IMAGE_URL || "", "")
              .replace(/^\//, "");
          } else if (uploadPayload?.filename) {
            signaturePath = uploadPayload.filename;
          } else if (uploadPayload?.id) {
            signaturePath = uploadPayload.id;
          } else {
            // Fallback: check all string properties
            for (const value of Object.values(uploadPayload || {})) {
              if (
                typeof value === "string" &&
                (value.includes("/") || value.includes("."))
              ) {
                signaturePath = value;
                break;
              }
            }
          }

          if (!signaturePath) {
            console.error(
              "Could not extract path, full payload:",
              uploadPayload,
            );
            throw new Error(
              `Could not extract signature path from upload response: ${JSON.stringify(uploadPayload)}`,
            );
          }
        } else {
          throw new Error(
            `Signature upload failed with status ${uploadRes.status}`,
          );
        }
      }

      if (!signaturePath) {
        throw new Error("No valid signature path available");
      }

      // Step 2: Generate PDF from HTML canvas
      const element = printRef.current;
      const opt = {
        margin: 0,
        filename: `Checkout-${reservation.book_id}.pdf`,
        image: { type: "jpeg" as const, quality: 0.6 },
        html2canvas: { scale: 1, useCORS: true },
        jsPDF: {
          unit: "in",
          format: "letter",
          orientation: "portrait" as const,
        },
      };

      const pdfBlob = await html2pdf().set(opt).from(element).output("blob");

      // Step 3: Upload PDF document
      const pdfFormData = new FormData();
      const pdfFilename = `Checkout-${reservation.book_id}.pdf`;
      const pdfFile = new File([pdfBlob], pdfFilename, {
        type: "application/pdf",
      });
      pdfFormData.append("file", pdfFile);
      pdfFormData.append("category", "checkout_document"); // Try checkout category for PDFs

      const pdfUploadRes = await axios.post("/api/upload", pdfFormData);

      let documentPath = "";
      if (pdfUploadRes.status === 200 || pdfUploadRes.status === 201) {
        const pdfPayload = pdfUploadRes.data.payload;

        // Extract path from response
        if (typeof pdfPayload === "string") {
          documentPath = pdfPayload;
        } else if (pdfPayload?.path) {
          documentPath = pdfPayload.path;
        } else if (pdfPayload?.url) {
          documentPath = pdfPayload.url
            .replace(process.env.NEXT_PUBLIC_IMAGE_URL || "", "")
            .replace(/^\//, "");
        } else if (pdfPayload?.filename) {
          documentPath = pdfPayload.filename;
        } else if (pdfPayload?.id) {
          documentPath = pdfPayload.id;
        }
      } else {
        // If checkout category doesn't work, try items category
        pdfFormData.set("category", "items");
        const fallbackRes = await axios.post("/api/upload", pdfFormData);
        if (fallbackRes.status === 200 || fallbackRes.status === 201) {
          const pdfPayload = fallbackRes.data.payload;
          if (typeof pdfPayload === "string") {
            documentPath = pdfPayload;
          } else if (pdfPayload?.path) {
            documentPath = pdfPayload.path;
          } else if (pdfPayload?.url) {
            documentPath = pdfPayload.url
              .replace(process.env.NEXT_PUBLIC_IMAGE_URL || "", "")
              .replace(/^\//, "");
          } else if (pdfPayload?.filename) {
            documentPath = pdfPayload.filename;
          } else if (pdfPayload?.id) {
            documentPath = pdfPayload.id;
          }
        }
      }

      console.log(signaturePath, "signature path");
      console.log(documentPath, "document path");

      // Step 4: Call checkout API with signature and document paths
      const checkoutRes = await axios.post(`/api/reservation/checkout`, {
          id: reservation.id || reservation.book_id,
          user_id: reservation.ref_user?.id,
          items: reservation.details || [],
          signature: signaturePath,
          file_path: documentPath || null, // Use document path if available, else null
      });

      if (checkoutRes.status === 200 || checkoutRes.status === 201) {
          if (onCheckout) {
              onCheckout(signaturePath);
          }
      } else {
          throw new Error(`Checkout failed with status ${checkoutRes.status}`);
      }
    } catch (error: any) {
      console.error("Checkout process error:", error);
      const Swal = (await import("sweetalert2")).default;
      Swal.fire({
        icon: "error",
        title: "Process Failed",
        text:
          error?.response?.data?.message ||
          error.message ||
          "An error occurred during the checkout process.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const saveSignature = () => {
    if (sigCanvas.current?.isEmpty()) return;
    setSignatureDataUrl(
      sigCanvas.current?.getCanvas().toDataURL("image/png") || null,
    );
    setShowSignaturePad(false);
  };

  React.useEffect(() => {
    const resizeCanvas = () => {
      if (sigCanvas.current && showSignaturePad) {
        const canvas = sigCanvas.current.getCanvas();
        const parent = canvas.parentElement;
        if (parent) {
          // Temporarily store signature data
          const data = sigCanvas.current.toData();
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvas.width = parent.offsetWidth * ratio;
          canvas.height = parent.offsetHeight * ratio;
          canvas.getContext("2d")?.scale(ratio, ratio);
          sigCanvas.current.clear(); // otherwise getTrimmedCanvas will return a wrong size
          sigCanvas.current.fromData(data);
        }
      }
    };

    if (showSignaturePad) {
      // Need a slight timeout to let modal render fully first
      setTimeout(resizeCanvas, 50);
    }

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [showSignaturePad]);

  return (
    <>
      <Modal open={open} setOpen={setOpen} size="lg">
        <div className="flex flex-col h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold text-orange-500">Print PDF</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex flex-1 overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <div className="w-1/4 p-4 border-r bg-white overflow-y-auto">
              <div className="space-y-4">
                <div
                  className="p-4 border-2 border-orange-500 rounded-lg bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => setShowSignaturePad(true)}
                >
                  <h3 className="font-bold text-gray-800 text-sm">
                    Check-out agreement with signature
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-gray-400">
                    <Pencil className="w-3 h-3" />
                    <span className="text-[10px]">
                      {displaySignature ? "Signed" : "Need signature"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div
                ref={printRef}
                className="bg-white shadow-lg mx-auto max-w-[800px] min-h-[1000px] p-10 relative"
              >
                {/* PDF Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Image
                        src="/images/logo-camera-only.svg"
                        alt="logo"
                        width={24}
                        height={24}
                      />
                      <span className="font-bold text-gray-800 text-lg uppercase tracking-wider">
                        Camventory
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 font-serif">
                      Check-out Agreement
                    </h1>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm mb-1 uppercase">
                      Lokasi Pengambilan
                    </p>
                    <p className="text-xs text-gray-600 uppercase">
                      {reservation?.pickup_location}
                    </p>
                  </div>
                </div>

                <hr className="border-gray-200 mb-8" />

                {/* PDF Info Sections */}
                <div className="grid grid-cols-2 gap-x-12 mb-8">
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-32 font-bold text-gray-800 text-xs uppercase">
                        Document #
                      </span>
                      <span className="text-xs text-gray-700 uppercase font-mono">
                        {reservation.book_id}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold text-gray-800 text-xs uppercase">
                        Checked Out On
                      </span>
                      <span className="text-xs text-gray-700 uppercase">
                        {moment
                          .unix(reservation.start_date)
                          .format("DD MMMM YYYY HH:mm A")}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-bold text-gray-800 text-xs uppercase">
                        Due Back On
                      </span>
                      <span className="text-xs text-gray-700 uppercase">
                        {moment
                          .unix(reservation.end_date)
                          .format("DD MMMM YYYY HH:mm A")}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="w-12 font-bold text-gray-800 text-xs uppercase">
                        From
                      </span>
                      <div className="flex-1 text-xs text-gray-700">
                        <p className="font-bold uppercase">Camventory</p>
                        <p>{reservation?.pickup_location}</p>
                        <p>{reservation?.ref_user?.phone}</p>
                      </div>
                    </div>
                    <div className="flex mt-4">
                      <span className="w-12 font-bold text-gray-800 text-xs uppercase">
                        To
                      </span>
                      <div className="flex-1 text-xs text-gray-700">
                        <p className="font-bold uppercase">
                          {reservation.ref_customer?.name}
                        </p>
                        <p>{reservation.ref_customer?.address || ""}</p>
                        <p>{reservation.ref_customer?.phone || ""}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse mb-8 text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-200">
                      <th className="text-left py-3 px-4 font-bold text-gray-800 uppercase">
                        Item
                      </th>
                      <th className="text-left py-3 px-4 font-bold text-gray-800 uppercase">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-bold text-gray-800 uppercase">
                        Rate Daily
                      </th>
                      <th className="text-left py-3 px-4 font-bold text-gray-800 uppercase">
                        Serial Number
                      </th>
                      <th className="text-left py-3 px-4 font-bold text-gray-800 uppercase">
                        Equipment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservation.details?.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 bg-gray-100 rounded border flex items-center justify-center overflow-hidden relative">
                              {item.item_image_path ? (
                                <Image
                                  src={
                                    process.env.NEXT_PUBLIC_IMAGE_URL +
                                    "/" +
                                    item.item_image_path
                                  }
                                  alt={item.item_name}
                                  layout="fill"
                                  objectFit="cover"
                                />
                              ) : (
                                <Printer className="w-6 h-6 text-gray-300" />
                              )}
                            </div>
                            <span className="font-bold text-gray-800">
                              {item.item_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {item.item_type || "Item"}
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          Rp{item.rate_day?.toLocaleString("id-ID") || "0"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="inline-block px-3 py-1 bg-green-50 border border-green-500 text-green-600 rounded-full text-[10px] font-bold whitespace-nowrap">
                            {item.serial_number || "-"}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {item.item_name} Only
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PDF Footer */}
                <div className="flex justify-between items-start gap-8 mt-12 pt-8 border-t border-gray-100">
                  <div className="w-1/3">
                    <p className="font-bold text-gray-800 text-[10px] mb-4 uppercase">
                      Notes:
                    </p>
                    <p className="font-bold text-gray-800 text-[10px] mb-2 uppercase">
                      Signature and date:
                    </p>
                    <div className="mt-4 flex flex-col items-center">
                      {displaySignature ? (
                        <Image
                          src={displaySignature}
                          alt="Signature"
                          width={100}
                          height={48}
                          unoptimized
                          className="max-w-full h-12 object-contain"
                        />
                      ) : (
                        <div className="w-24 h-12 border border-dashed border-gray-200 rounded flex items-center justify-center">
                          <Pencil className="w-6 h-6 text-gray-200" />
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {moment().format("DD MMMM YYYY")}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 text-[10px] text-gray-600 leading-relaxed">
                    <p className="font-bold text-gray-800 mb-1 uppercase">
                      By signing this form, you agree to the following terms and
                      conditions:
                    </p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>
                        You acknowledge that all information provided is
                        accurate and complete.
                      </li>
                      <li>
                        You agree to comply with all applicable rules, policies,
                        and regulations.
                      </li>
                      <li>
                        You understand that failure to adhere to these terms may
                        result in termination of service or other consequences.
                      </li>
                      <li>
                        You consent to the collection and use of your data as
                        outlined in our privacy policy.
                      </li>
                      <li>
                        You confirm that you have read and understood all the
                        information provided in this document.
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Floating Signature Button Removed by User Request */}
                {isCheckoutFlow && !displaySignature && (
                  <div
                    className="absolute bottom-[200px] left-1/2 -translate-x-1/2 no-print"
                    data-html2canvas-ignore="true"
                  >
                    <button
                      onClick={() => setShowSignaturePad(true)}
                      className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-orange-600 transition-colors animate-bounce"
                      title="Click to sign"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t bg-white">
            <Button variant="white" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {isCheckoutFlow ? (
              <Button
                variant="submit"
                onClick={handleCheckoutInternal}
                isLoading={isLoading}
              >
                Confirm Checkout
              </Button>
            ) : (
              <Button
                variant="submit"
                onClick={handleGenerate}
                isLoading={isLoading}
              >
                Generate
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Signature Pad Modal */}
      <Modal open={showSignaturePad} setOpen={setShowSignaturePad} size="md">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Draw Signature</h3>
            <div className="flex gap-2">
              <button
                onClick={clearSignature}
                title="Clear"
                className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSignaturePad(false)}
                className="p-2 text-gray-500 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 overflow-hidden w-full h-[250px]">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                className: "signature-canvas w-full h-full",
              }}
              clearOnResize={false}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="white" onClick={() => setShowSignaturePad(false)}>
              Cancel
            </Button>
            <Button variant="submit" onClick={saveSignature}>
              Save Signature
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
        .signature-canvas {
          cursor: crosshair;
        }
      `}</style>
    </>
  );
}
