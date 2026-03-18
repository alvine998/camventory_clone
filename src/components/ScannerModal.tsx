import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Modal from "./Modal";
import { XIcon, CameraIcon } from "lucide-react";

interface ScannerModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ open, setOpen, onScanSuccess }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (open) {
      setIsStarting(true);
      setError(null);
      
      const startScanner = async () => {
        try {
          // Provide a small delay to ensure the DOM element "reader" is rendered
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (!document.getElementById("reader")) {
             console.error("Scanner element 'reader' not found");
             return;
          }

          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          
          const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };
          
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              onScanSuccess(decodedText);
              setOpen(false);
            },
            () => {
              // Ignore scan errors as they happen constantly during scanning
            }
          ).catch(err => {
              console.error("Failed to start scanner:", err);
              setError("Could not access camera. Please ensure permissions are granted.");
          });
        } catch (err) {
          console.error("Scanner Initialization Error:", err);
          setError("Failed to initialize scanner.");
        } finally {
          setIsStarting(false);
        }
      };

      startScanner();

      return () => {
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(err => console.error("Error stopping scanner", err));
        }
      };
    }
  }, [open, onScanSuccess, setOpen]);

  return (
    <Modal open={open} setOpen={setOpen} size="md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-orange-500 flex items-center gap-2">
          <CameraIcon className="w-5 h-5" />
          Scan QR / Barcode
        </h2>
        <button 
          onClick={() => setOpen(false)} 
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <XIcon className="w-6 h-6 text-gray-500" />
        </button>
      </div>
      
      <div className="relative bg-black rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center">
        {isStarting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        )}
        
        {error ? (
          <div className="p-6 text-center text-white">
            <p className="mb-4 text-red-400 font-medium">{error}</p>
            <button 
              onClick={() => { setError(null); setOpen(false); setTimeout(() => setOpen(true), 100); }}
              className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div id="reader" className="w-full h-full"></div>
        )}
        
        {!error && !isStarting && (
          <div className="absolute inset-0 border-2 border-orange-500 border-dashed opacity-30 pointer-events-none m-12 rounded-lg"></div>
        )}
      </div>
      
      <p className="mt-4 text-sm text-gray-500 text-center font-medium">
        Point your camera at a QR code or barcode to scan.
      </p>
    </Modal>
  );
};

export default ScannerModal;
