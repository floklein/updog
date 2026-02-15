import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const schema = z.object({
  breed: z.string().describe("The dog breed the person most resembles"),
  breedEmoji: z
    .string()
    .describe("A single emoji that best represents this dog breed"),
  similarityReason: z
    .string()
    .describe(
      "A fun, kind, and complimentary 1-2 sentence explanation of why they resemble this breed"
    ),
  funFact: z
    .string()
    .describe("An interesting fun fact about this dog breed, 1 sentence"),
  matchPercentage: z
    .number()
    .min(50)
    .max(99)
    .describe("How closely they match this breed, between 50-99"),
});

// Cache the breed list so we only fetch it once per cold start
let breedListCache: string[] | null = null;

async function getBreedPaths(): Promise<string[]> {
  if (breedListCache) return breedListCache;
  try {
    const res = await fetch("https://dog.ceo/api/breeds/list/all");
    const data = await res.json();
    if (data.status !== "success") return [];
    const paths: string[] = [];
    for (const [breed, subBreeds] of Object.entries(data.message)) {
      const subs = subBreeds as string[];
      if (subs.length === 0) {
        paths.push(breed);
      } else {
        for (const sub of subs) {
          paths.push(`${breed}/${sub}`);
        }
      }
    }
    breedListCache = paths;
    return paths;
  } catch {
    return [];
  }
}

function findBestBreedPath(breed: string, paths: string[]): string | null {
  const normalized = breed.toLowerCase().replace(/[^a-z ]/g, "");
  const words = normalized.split(/\s+/);

  // Try exact full match against path segments (e.g. "golden retriever" -> "retriever/golden")
  for (const path of paths) {
    const parts = path.split("/");
    const allParts = parts.join(" ");
    if (allParts === normalized || parts.reverse().join(" ") === normalized) {
      return path;
    }
  }

  // Score each path by how many words from the breed name match
  let bestPath: string | null = null;
  let bestScore = 0;
  for (const path of paths) {
    const pathParts = path.split("/");
    let score = 0;
    for (const word of words) {
      for (const part of pathParts) {
        if (part === word) {
          score += 3;
        } else if (part.includes(word) || word.includes(part)) {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestPath = path;
    }
  }

  return bestScore > 0 ? bestPath : null;
}

async function fetchDogImage(breed: string): Promise<string | null> {
  try {
    const paths = await getBreedPaths();
    const breedPath = findBestBreedPath(breed, paths);
    if (!breedPath) return null;

    const res = await fetch(
      `https://dog.ceo/api/breed/${breedPath}/images/random`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.status === "success" ? data.message : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { image } = await request.json();

  // image arrives as a data URL: "data:image/jpeg;base64,..."
  const [header, base64Data] = image.split(",");
  const mediaType = ((header.match(/data:(.*?);/) as RegExpMatchArray | null)?.[1] ??
    "image/jpeg") as `image/${string}`;

  const result = await generateObject({
    model: "google/gemini-2.5-flash",
    schema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a fun, lighthearted AI that matches people (or vibes) to their dog breed lookalike. Look at this photo and determine which dog breed the person most resembles.

Rules:
- Be creative, kind, and complimentary — never insulting
- Focus on positive traits like "warm eyes", "friendly smile", "elegant features", "adventurous energy"
- If there is no clear face in the photo, match the overall vibe, mood, or aesthetic of the image to a dog breed
- The matchPercentage should feel realistic but flattering, typically between 70 and 95
- Pick a real, recognizable dog breed — not a made-up one
- The breedEmoji should be a single emoji (use a dog emoji if nothing more specific fits)
- Keep the funFact genuinely interesting and specific to the breed`,
          },
          {
            type: "image",
            image: base64Data,
            mediaType,
          },
        ],
      },
    ],
  });

  // Fetch a real photo of the matched breed using fuzzy matching
  const dogImageUrl = await fetchDogImage(result.object.breed);

  return Response.json({
    ...result.object,
    dogImageUrl,
  });
}
