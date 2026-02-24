"use client";

import * as React from "react";
import { FileUp, Quote } from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
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
        "w-full space-y-3 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur-sm",
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

      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-slate-600">
          Quote Composer
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-xl border-slate-300 bg-white"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUp className="size-3.5" />
          Import
        </Button>
      </div>

      <p className="text-xs text-slate-500">{uploadStatus}</p>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-700">Quote</p>
        <Textarea
          value={quote}
          onChange={(event) => onQuoteChange(event.target.value)}
          placeholder="Enter quote text..."
          className="min-h-24 rounded-xl border-slate-300 bg-white"
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-700">Author</p>
        <Input
          value={author}
          onChange={(event) => onAuthorChange(event.target.value)}
          placeholder="Enter author name..."
          className="rounded-xl border-slate-300 bg-white"
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
        onClick={onPostQuote}
        disabled={!canPostQuote}
      >
        <Quote className="size-4" />
        Post Quote
      </Button>
    </div>
  );
}
