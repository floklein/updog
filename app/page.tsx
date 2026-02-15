"use client";

import { useState, useRef, useCallback } from "react";

type AppState = "idle" | "preview" | "loading" | "result";

interface BreedResult {
  breed: string;
  breedEmoji: string;
  similarityReason: string;
  funFact: string;
  matchPercentage: number;
  dogImageUrl: string | null;
}

const LOADING_MESSAGES = [
  "Sniffing out your breed...",
  "Checking the dog park database...",
  "Comparing nose boops...",
  "Consulting the pack leader...",
  "Analyzing your inner puppy...",
];

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<BreedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage] = useState(
    () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
        setState("preview");
        setError(null);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (!imageUrl) return;
    setState("loading");
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data: BreedResult = await res.json();
      setResult(data);
      setState("result");
    } catch {
      setError("Something went wrong. Please try again!");
      setState("preview");
    }
  }, [imageUrl]);

  const handleReset = useCallback(() => {
    setState("idle");
    setImageUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Result screen
  if (state === "result" && result && imageUrl) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-amber-50 to-orange-100 font-[family-name:var(--font-geist-sans)] dark:from-zinc-950 dark:to-zinc-900">
        {/* Dog image - top section */}
        <div className="relative min-h-0 flex-1">
          {result.dogImageUrl ? (
            <img
              src={result.dogImageUrl}
              alt={result.breed}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-amber-200 to-amber-400 dark:from-amber-900 dark:to-amber-700" />
          )}

          {/* User selfie thumbnail - top left */}
          <div className="absolute left-4 top-4">
            <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-white shadow-xl">
              <img
                src={imageUrl}
                alt="Your selfie"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Breed name overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-5 pb-4 pt-16">
            <p className="text-sm font-semibold text-white/80">
              You look like a...
            </p>
            <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
              {result.breedEmoji} {result.breed}
            </h1>
          </div>
        </div>

        {/* Bottom content */}
        <div className="flex shrink-0 flex-col gap-3 p-4">
          {/* Info card */}
          <div className="rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-800">
            {/* Similarity reason */}
            <p className="mb-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {result.similarityReason}
            </p>

            {/* Fun fact */}
            <div className="rounded-2xl bg-amber-50 p-3 dark:bg-zinc-700/50">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                🦴 Fun Fact
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-700 dark:text-amber-200/80">
                {result.funFact}
              </p>
            </div>
          </div>

          {/* Try again button */}
          <button
            onClick={handleReset}
            className="w-full rounded-2xl bg-amber-600 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-amber-700 active:scale-95 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 p-5 font-[family-name:var(--font-geist-sans)] dark:from-zinc-950 dark:to-zinc-900">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-amber-900 dark:text-amber-100">
            Updog
          </h1>
          <p className="mt-2 text-lg text-amber-700 dark:text-amber-300">
            Find out which dog breed you look like!
          </p>
        </header>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Idle state */}
        {state === "idle" && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-8xl">🐶</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl bg-amber-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-amber-700 hover:shadow-xl active:scale-95 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              📸 Take a Selfie
            </button>
            <p className="text-sm text-amber-600/70 dark:text-amber-400/70">
              We&apos;ll match you with your dog breed twin
            </p>
          </div>
        )}

        {/* Preview state */}
        {state === "preview" && imageUrl && (
          <div className="flex w-full flex-col items-center gap-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl shadow-xl">
              <img
                src={imageUrl}
                alt="Your selfie"
                className="h-full w-full object-cover"
              />
            </div>
            {error && (
              <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="flex w-full gap-3">
              <button
                onClick={handleReset}
                className="flex-1 rounded-2xl border-2 border-amber-300 px-6 py-3.5 font-semibold text-amber-800 transition-all hover:bg-amber-100 active:scale-95 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/30"
              >
                Retake
              </button>
              <button
                onClick={handleAnalyze}
                className="flex-1 rounded-2xl bg-amber-600 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-amber-700 hover:shadow-xl active:scale-95 dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                🐕 Find My Breed!
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {state === "loading" && imageUrl && (
          <div className="flex w-full flex-col items-center gap-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl shadow-xl">
              <img
                src={imageUrl}
                alt="Your selfie"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="mb-4 text-5xl animate-bounce">🐾</div>
                <p className="text-lg font-semibold text-white">
                  {loadingMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
