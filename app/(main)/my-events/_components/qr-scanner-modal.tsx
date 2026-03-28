"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Loader2, Upload, AlertCircle } from "lucide-react";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types
interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
}

interface CheckInResult {
  success: boolean;
  message?: string;
}

export default function QRScannerModal({ isOpen, onClose, eventId }: QRScannerModalProps) {
  const [scannerReady, setScannerReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useUploadMode, setUseUploadMode] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [showAlreadyCheckedIn, setShowAlreadyCheckedIn] = useState<boolean>(false);
  const [showAuthError, setShowAuthError] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: checkInAttendee } = useConvexMutation(
    api.registrations.checkInAttendee
  );

  const handleCheckIn = async (qrCode: string) => {
    try {
      console.log(`📱 QR Code detected: ${qrCode}`);
      const result = await checkInAttendee({ qrCode }) as CheckInResult;
      console.log("🔍 Check-in result:", result);
      console.log("Result message:", result.message);

      if (result.success) {
        console.log("✅ Check-in successful! Closing modal...");
        toast.success("✅ Check-in successful!");
        onClose();
      } else {
        console.log("⚠️ Check-in failed:", result.message);
        const messageLower = result.message?.toLowerCase() || "";
        
        // Check for specific error cases in order of specificity
        if (messageLower.includes("invalid") || messageLower.includes("not found")) {
          console.log("Invalid QR code detected");
          toast.error("❌ Invalid QR code. Please scan a valid attendee QR code.");
        } else if (messageLower.includes("already checked in")) {
          console.log("Already checked in detected");
          setShowAlreadyCheckedIn(true);
        } else {
          toast.error(result.message || "Check-in failed");
        }
      }
    } catch (error: any) {
      console.error("❌ Check-in error caught in modal:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error.message);
      console.error("Error string:", String(error));
      
      // Handle different error types
      const errorMsg = (error.message || String(error) || "").toLowerCase();
      console.log("Checking error message:", errorMsg);
      
      if (errorMsg.includes("not authorized") || errorMsg.includes("unauthorized")) {
        console.log("Authorization error detected");
        setAuthErrorMessage("Only event organizers can check in attendees for their events.");
        setShowAuthError(true);
      } else if (errorMsg.includes("not found") || errorMsg.includes("invalid")) {
        console.log("Invalid QR code error");
        toast.error("❌ Invalid QR code. Please scan a valid attendee QR code.");
      } else if (errorMsg.includes("network")) {
        toast.error("🌐 Network error. Please check your connection and try again.");
      } else if (errorMsg.includes("not authenticated")) {
        toast.error("🔐 Session expired. Please log in again.");
      } else {
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      // Dynamically import the library
      const { Html5Qrcode } = await import("html5-qrcode");

      // Create a temporary container element
      const tempContainerId = "temp-qr-scanner-" + Date.now();
      const tempContainer = document.createElement("div");
      tempContainer.id = tempContainerId;
      tempContainer.style.display = "none";
      document.body.appendChild(tempContainer);

      try {
        const html5QrCode = new Html5Qrcode(tempContainerId);
        const qrResult = await html5QrCode.scanFile(file, true);
        console.log("📸 QR Code from image:", qrResult);
        await handleCheckIn(qrResult);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (decodeError: any) {
        toast.error("❌ No QR code found in the image. Please select a valid QR code image.");
        console.error("Decode error:", decodeError);
      } finally {
        // Clean up temporary container
        document.body.removeChild(tempContainer);
        setUploadLoading(false);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Handle different error types
      const errorMsg = (error.message || "").toLowerCase();
      
      if (errorMsg.includes("not authorized") || errorMsg.includes("unauthorized") || errorMsg.includes("you are not authorized")) {
        setAuthErrorMessage("Only event organizers can check in attendees for their events.");
        setShowAuthError(true);
      } else if (errorMsg.includes("file")) {
        toast.error("📁 Invalid image file. Please try another image.");
      } else if (errorMsg.includes("network")) {
        toast.error("🌐 Network error. Please try again.");
      } else if (errorMsg.includes("not authenticated")) {
        toast.error("🔐 Session expired. Please log in again.");
      } else {
        toast.error("Failed to process image");
      }
      
      setUploadLoading(false);
    }
  };

  // Initialize QR Scanner
  useEffect(() => {
    let scanner: any = null;
    let mounted = true;

    const initScanner = async () => {
      if (!isOpen || useUploadMode) return;

      try {
        console.log("Initializing QR scanner...");

        // Check if we're in a browser environment and mediaDevices API is available
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Camera access is not supported in this browser or context. Please use a modern browser with HTTPS.");
          return;
        }

        // Check camera permissions first
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          console.log("Camera permission granted");
        } catch (permError: any) {
          console.error("Camera permission denied:", permError);
          setError("Camera permission denied. Please enable camera access.");
          return;
        }

        // Dynamically import the library
        const { Html5QrcodeScanner } = await import("html5-qrcode");

        if (!mounted) return;

        console.log("Creating scanner instance...");

        scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            videoConstraints: {
              facingMode: "environment", // Use back camera on mobile
            },
          },
          /* verbose= */ false
        );

        const onScanSuccess = (decodedText: string) => {
          console.log("QR Code detected:", decodedText);
          if (scanner) {
            scanner.clear().catch(console.error);
          }
          handleCheckIn(decodedText);
        };

        const onScanError = (error: string) => {
          // Only log actual errors, not "no QR code found" messages
          if (error && !error.includes("NotFoundException")) {
            console.debug("Scan error:", error);
          }
        };

        scanner.render(onScanSuccess, onScanError);
        setScannerReady(true);
        setError(null);
        console.log("Scanner rendered successfully");
      } catch (error: any) {
        console.error("Failed to initialize scanner:", error);
        setError(`Failed to start camera: ${error.message}`);
        toast.error("Camera failed. Please use manual entry.");
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scanner) {
        console.log("Cleaning up scanner...");
        scanner.clear().catch(console.error);
      }
      setScannerReady(false);
    };
  }, [isOpen, useUploadMode]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-500" />
              Check-In Attendee
            </DialogTitle>
            <DialogDescription>
              Scan QR code or upload from gallery
            </DialogDescription>
          </DialogHeader>

          {/* tabs buttons for switching between camera and upload */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={useUploadMode ? "outline" : "default"}
              size="sm"
              onClick={() => setUseUploadMode(false)}
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Camera
            </Button>
            <Button
              variant={useUploadMode ? "default" : "outline"}
              size="sm"
              onClick={() => setUseUploadMode(true)}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Gallery
            </Button>
          </div>

          {useUploadMode ? (
            // Upload Mode
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadLoading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="w-full p-8 border-2 border-dashed border-purple-400 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-purple-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    <span className="text-sm text-muted-foreground">Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-purple-500" />
                    <span className="text-sm font-medium">Click to upload QR code</span>
                    <span className="text-xs text-muted-foreground">or drag and drop</span>
                  </>
                )}
              </button>
              {error && <div className="text-red-500 text-sm">{error}</div>}
            </div>
          ) : (
            // Camera Mode
            <>
              {error ? (
                <div className="text-red-500 text-sm">{error}</div>
              ) : (
                <>
                  <div
                    id="qr-reader"
                    className="w-full"
                    style={{ minHeight: "350px" }}
                  ></div>
                  {!scannerReady && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Starting camera...
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground text-center">
                    {scannerReady
                      ? "Position the QR code within the frame"
                      : "Please allow camera access when prompted"}
                  </p>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Already Checked In Alert */}
      <Dialog open={showAlreadyCheckedIn} onOpenChange={setShowAlreadyCheckedIn}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Already Checked In
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              This attendee has already been checked in for this event.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAlreadyCheckedIn(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowAlreadyCheckedIn(false);
                setUseUploadMode(false); // Reset to camera mode
              }}
              className="flex-1"
            >
              Scan Another
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Authorization Error Alert */}
      <Dialog open={showAuthError} onOpenChange={setShowAuthError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Unauthorized Access
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {authErrorMessage}
            </p>
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs text-red-700 dark:text-red-300">
                <strong>Note:</strong> Check-in is only available to the event organizer.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAuthError(false)}
            className="w-full"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}