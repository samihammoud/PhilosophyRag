"use client";

import * as React from "react";

import { Button } from "./button";
import { Input } from "./input";
import { cn } from "./utils";

export type QuoteUploadProps = React.ComponentPropsWithoutRef<"div"> & {
  quote: string;
  author: string;
  uploadStatus?: string;
  onQuoteChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onUpload?: (file: File) => void;
  onPostQuote: () => void;
};

export function QuoteUpload({
  className,
  quote,
  author,
  uploadStatus = "No file selected",
  onQuoteChange,
  onAuthorChange,
  onUpload,
  onPostQuote,
  ...props
}: QuoteUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const canPostQuote = quote.trim().length > 0 && author.trim().length > 0;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;
    onUpload(file);
  };

  return (
    <div
      className={cn(
        "w-full space-y-3 rounded-xl border border-gray-200 bg-white/70 p-3 backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md"
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-xs text-gray-600">{uploadStatus}</p>

      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-700">Quote</p>
        <Input
          value={quote}
          onChange={(event) => onQuoteChange(event.target.value)}
          placeholder="Enter quote"
          className="bg-white"
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-700">Author</p>
        <Input
          value={author}
          onChange={(event) => onAuthorChange(event.target.value)}
          placeholder="Enter author"
          className="bg-white"
        />
      </div>

      <Button
        type="button"
        className="w-full"
        onClick={onPostQuote}
        disabled={!canPostQuote}
      >
        Post Quote
      </Button>
    </div>
  );
}
