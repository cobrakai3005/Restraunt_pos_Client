"use client";

import { useRef, useState, useEffect } from "react";
import { ImagePlus, Upload, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

interface MenuImageFieldProps {
  currentImage?: string | null;
  onFileChange: (file: File | null) => void;
  onRemoveChange?: (remove: boolean) => void;
}

export function MenuImageField({ currentImage, onFileChange, onRemoveChange }: MenuImageFieldProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);

  // Reset when the saved image changes (e.g. after editing another item)
  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
    setFile(null);
    setRemoved(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [currentImage]);

  // Revoke the object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const preview = file ? objectUrlRef.current : removed ? "" : currentImage || "";

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast({ title: "Error", description: "Only JPEG, PNG, WebP or GIF images are allowed", variant: "destructive" });
      return;
    }
    if (selected.size > MAX_SIZE) {
      toast({ title: "Error", description: "Image too large. Maximum size is 5MB.", variant: "destructive" });
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(selected);
    setFile(selected);
    setRemoved(false);
    onFileChange(selected);
    onRemoveChange?.(false);
  };

  const handleRemove = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
    setFile(null);
    setRemoved(true);
    onFileChange(null);
    onRemoveChange?.(true);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCancelSelection = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
    setFile(null);
    setRemoved(false);
    onFileChange(null);
    onRemoveChange?.(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex items-start gap-4">
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Menu item preview" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <Label className="block text-sm font-medium">Item Image</Label>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleSelect}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-1 h-3.5 w-3.5" /> {file || preview ? "Replace Image" : "Choose Image"}
          </Button>
          {file && (
            <Button type="button" variant="ghost" size="sm" onClick={handleCancelSelection}>
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
          )}
          {preview && !file && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-rose-500 hover:text-rose-600"
              onClick={handleRemove}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF. Max 5MB.</p>
      </div>
    </div>
  );
}
