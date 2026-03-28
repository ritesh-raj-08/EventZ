"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@clerk/nextjs";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  trigger?: "limit" | "header" | "color";
};

export default function UpgradeModal({
  isOpen,
  onClose,
  trigger = "limit",
}: UpgradeModalProps) {
  const [showConfirmUpgrade, setShowConfirmUpgrade] = useState(false);
  const { mutate: upgradeToPro, loading: upgrading } = useConvexMutation(
    api.users.upgradeToPro
  );

  const handleConfirmUpgrade = async () => {
    try {
      await upgradeToPro();
      toast.success("✨ Welcome to Pro! You can now create unlimited events!");
      // Close the "confirm upgrade" screen first
      setShowConfirmUpgrade(false);
      // Then close the entire modal
      setTimeout(() => onClose(), 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade to Pro");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <DialogTitle className="text-2xl">
              Upgrade to Pro
            </DialogTitle>
          </div>
          <DialogDescription>
            {trigger === "header" &&
              "Create Unlimited Events with Pro! "}
            {trigger === "limit" &&
              "You've reached your free event limit. "}
            {trigger === "color" &&
              "Custom theme colors are a Pro feature. "}
            Unlock unlimited events and premium features!
          </DialogDescription>
        </DialogHeader>

        {!showConfirmUpgrade ? (
          <>
            {/* Pricing Cards */}
            <PricingTable
              checkoutProps={{
                appearance: {
                  elements: {
                    drawerRoot: {
                      zIndex: 2000,
                    },
                  },
                },
              }}
            />

            {/* Footer */}
           
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
              <p className="text-sm">
                Click the button below to confirm your Pro upgrade and unlock unlimited event creation!
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmUpgrade(false)}
                className="flex-1"
                disabled={upgrading}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmUpgrade}
                disabled={upgrading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  "✨ Activate Pro Now"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}