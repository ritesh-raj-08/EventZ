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
  const html5QrCodeRef = useRef<any>(null);
  const isScannerRunning = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);

  const { mutate: checkInAttendee } = useConvexMutation(
    api.registrations.checkInAttendee
  );

  const handleCheckIn = async (qrCode: string) => {
    try {
      console.log(`📱 QR Code detected: ${qrCode}`);
      const result = await checkInAttendee({ qrCode }) as CheckInResult;
      console.log("🔍 Check-in result:", result);

      if (result.success) {
        console.log("✅ Check-in successful!");
        toast.success("✅ Check-in successful!");
        // Stop scanner before closing
        await stopScanner();
        onClose();
      } else {
        console.log("⚠️ Check-in failed:", result.message);
        const messageLower = result.message?.toLowerCase() || "";
        
        if (messageLower.includes("invalid") || messageLower.includes("not found")) {
          toast.error("❌ Invalid QR code. Please scan a valid attendee QR code.");
        } else if (messageLower.includes("already checked in")) {
          setShowAlreadyCheckedIn(true);
        } else {
          toast.error(result.message || "Check-in failed");
        }
      }
    } catch (error: any) {
      console.error("❌ Check-in error:", error);
      
      const errorMsg = (error.message || String(error) || "").toLowerCase();
      
      if (errorMsg.includes("not authorized") || errorMsg.includes("unauthorized")) {
        setAuthErrorMessage("Only event organizers can check in attendees for their events.");
        setShowAuthError(true);
      } else if (errorMsg.includes("not found") || errorMsg.includes("invalid")) {
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

  const startScanner = async () => {
    try {
      // Don't start if already running or currently stopping
      if (isScannerRunning.current || isStoppingRef.current) {
        console.log("Scanner already running or stopping");
        return;
      }

      setError(null);
      const { Html5Qrcode } = await import("html5-qrcode");
      
      const config = {
        fps: 30,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: "environment",
        },
      };

      html5QrCodeRef.current = new Html5Qrcode("qr-reader-container");
      
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText: string) => {
          console.log("QR Code detected:", decodedText);
          handleCheckIn(decodedText);
        },
        (errorMessage: string) => {
          // Ignore scanning errors
          if (!errorMessage.includes("NotFoundException")) {
            console.debug("Scan error:", errorMessage);
          }
        }
      );
      
      isScannerRunning.current = true;
      setScannerReady(true);
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      
      // Handle specific errors
      if (err.name === 'NotAllowedError') {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        setError("No camera found on this device.");
      } else if (err.message?.includes("https")) {
        setError("Camera requires HTTPS. Please use HTTPS connection.");
      } else {
        setError(err.message || "Failed to start camera");
      }
      isScannerRunning.current = false;
    }
  };

  const stopScanner = async () => {
    // Prevent multiple simultaneous stop attempts
    if (isStoppingRef.current) {
      console.log("Already stopping scanner");
      return;
    }

    isStoppingRef.current = true;

    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          await html5QrCodeRef.current.clear();
          console.log("Scanner stopped successfully");
        } catch (err: any) {
          // Ignore "not running" errors - this is expected in Strict Mode
          if (!err.message?.includes("not running") && !err.message?.includes("paused")) {
            console.error("Error stopping scanner:", err);
          } else {
            console.log("Scanner was already stopped");
          }
        }
      }
    } finally {
      html5QrCodeRef.current = null;
      isScannerRunning.current = false;
      isStoppingRef.current = false;
      setScannerReady(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
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
      toast.error("Failed to process image");
      setUploadLoading(false);
    }
  };

  // Initialize scanner when modal opens
  useEffect(() => {
    if (isOpen && !useUploadMode) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        startScanner();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      stopScanner();
    }
  }, [isOpen, useUploadMode]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannerReady(false);
      setError(null);
      setUseUploadMode(false);
      setUploadLoading(false);
    }
  }, [isOpen]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          stopScanner();
          onClose();
        }
      }}>
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
              onClick={() => {
                stopScanner();
                setUseUploadMode(false);
              }}
              className="flex-1"
              type="button"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Camera
            </Button>
            <Button
              variant={useUploadMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                stopScanner();
                setUseUploadMode(true);
              }}
              className="flex-1"
              type="button"
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
                type="button"
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
                <div className="text-red-500 text-sm text-center p-4">
                  {error}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setError(null);
                      startScanner();
                    }}
                    className="mt-3"
                    type="button"
                    size="sm"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    id="qr-reader-container"
                    className="w-full overflow-hidden rounded-lg"
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
              type="button"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowAlreadyCheckedIn(false);
                setUseUploadMode(false);
              }}
              className="flex-1"
              type="button"
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
            type="button"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}