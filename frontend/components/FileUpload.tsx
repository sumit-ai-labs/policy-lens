"use client";

import React, { useRef, useState, DragEvent, useCallback } from "react";

import { uploadFile } from "@/services/api";

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
  isLoadingAnalysis: boolean;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

function FileUpload({
  onTextExtracted,
  isLoadingAnalysis,
  title = "Drag & drop your policy document",
  description = "or browse to upload",
  buttonLabel = "Analyze Policy",
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isBusy = loading || isLoadingAnalysis;

  const isValidFile = (candidate: File) => {
    const validTypes = ["application/pdf", "text/plain"];
    if (!validTypes.includes(candidate.type)) {
      setError("Only PDF or TXT files are supported.");
      return false;
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return false;
    }
    return true;
  };

  const handleFile = (candidate: File) => {
    setError("");
    setExtracted(false);
    if (isValidFile(candidate)) setFile(candidate);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await uploadFile(file);
      setExtracted(true);
      onTextExtracted(data.extracted_text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full">
      <div
        onClick={() => !isBusy && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-10
          transition-all duration-200 select-none
          ${dragging
            ? "scale-[1.01] border-blue-500 bg-blue-500/10"
            : "border-white/20 bg-black/20 hover:border-blue-500/50 hover:bg-white/5"
          }
          ${isBusy ? "cursor-not-allowed opacity-60" : ""}
        `}
      >
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${dragging ? "bg-blue-500/20" : "bg-white/10"}`}>
          <svg className={`h-8 w-8 ${dragging ? "text-blue-400" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-base font-semibold text-zinc-300">
            {dragging ? "Drop your file here" : title}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            <span className="font-medium text-blue-400 underline underline-offset-2">{description}</span>
          </p>
          <p className="mt-2 text-xs text-zinc-600">PDF or TXT | Max 5 MB</p>
        </div>

        {file && !isBusy && (
          <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2">
            <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="max-w-[200px] truncate text-sm font-medium text-blue-300">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setError("");
                setExtracted(false);
              }}
              className="ml-1 text-blue-500 transition-colors hover:text-blue-300"
            >
              x
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleChange}
          className="hidden"
          disabled={isBusy}
        />
      </div>

      {extracted && !error && (
        <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 backdrop-blur-sm">
          Text extracted successfully. Ready for comparison or analysis.
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 backdrop-blur-sm">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isBusy}
        className="mt-4 w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Extracting Text...
          </span>
        ) : isLoadingAnalysis ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Working...
          </span>
        ) : (
          buttonLabel
        )}
      </button>
    </div>
  );
}

export default React.memo(FileUpload);
