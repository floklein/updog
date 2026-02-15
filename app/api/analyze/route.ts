import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 30;

type AnimalMode = "dog" | "cat";

function getSchema(mode: AnimalMode) {
  const animal = mode === "cat" ? "cat" : "dog";
  return z.object({
    breed: z.string().describe(`The ${animal} breed the person most resembles`),
    breedEmoji: z
      .string()
      .describe(`A single emoji that best represents this ${animal} breed`),
    similarityReason: z
      .string()
      .describe(
        `A fun, kind, and complimentary 1-2 sentence explanation of why they resemble this breed`
      ),
    funFact: z
      .string()
      .describe(`An interesting fun fact about this ${animal} breed, 1 sentence`),
    matchPercentage: z
      .number()
      .min(50)
      .max(99)
      .describe("How closely they match this breed, between 50-99"),
  });
}

function getPromptText(mode: AnimalMode): string {
  if (mode === "cat") {
    return `You are a fun, lighthearted AI that matches people (or vibes) to their cat breed lookalike. Look at this photo and determine which cat breed the person most resembles.

Rules:
- Be creative, kind, and complimentary — never insulting
- Focus on positive traits like "mysterious eyes", "graceful posture", "independent energy", "elegant features"
- If there is no clear face in the photo, match the overall vibe, mood, or aesthetic of the image to a cat breed
- The matchPercentage should feel realistic but flattering, typically between 70 and 95
- Pick a real, recognizable cat breed — not a made-up one
- The breedEmoji should be a single emoji (use a cat emoji if nothing more specific fits)
- Keep the funFact genuinely interesting and specific to the breed`;
  }

  return `You are a fun, lighthearted AI that matches people (or vibes) to their dog breed lookalike. Look at this photo and determine which dog breed the person most resembles.

Rules:
- Be creative, kind, and complimentary — never insulting
- Focus on positive traits like "warm eyes", "friendly smile", "elegant features", "adventurous energy"
- If there is no clear face in the photo, match the overall vibe, mood, or aesthetic of the image to a dog breed
- The matchPercentage should feel realistic but flattering, typically between 70 and 95
- Pick a real, recognizable dog breed — not a made-up one
- The breedEmoji should be a single emoji (use a dog emoji if nothing more specific fits)
- Keep the funFact genuinely interesting and specific to the breed`;
}

// --- Dog image fetching ---

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

// --- Cat image fetching ---

interface CatBreed {
  id: string;
  name: string;
}

let catBreedCache: CatBreed[] | null = null;

async function getCatBreeds(): Promise<CatBreed[]> {
  if (catBreedCache) return catBreedCache;
  try {
    const res = await fetch("https://api.thecatapi.com/v1/breeds");
    if (!res.ok) return [];
    const data: CatBreed[] = await res.json();
    catBreedCache = data.map((b) => ({ id: b.id, name: b.name }));
    return catBreedCache;
  } catch {
    return [];
  }
}

function findBestCatBreedId(
  breed: string,
  breeds: CatBreed[]
): string | null {
  const normalized = breed.toLowerCase().replace(/[^a-z ]/g, "");
  const words = normalized.split(/\s+/);

  // Try exact name match first
  for (const b of breeds) {
    if (b.name.toLowerCase() === normalized) return b.id;
  }

  // Score by word overlap
  let bestId: string | null = null;
  let bestScore = 0;
  for (const b of breeds) {
    const nameParts = b.name.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/);
    let score = 0;
    for (const word of words) {
      for (const part of nameParts) {
        if (part === word) {
          score += 3;
        } else if (part.includes(word) || word.includes(part)) {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = b.id;
    }
  }

  return bestScore > 0 ? bestId : null;
}

async function fetchCatImage(breed: string): Promise<string | null> {
  try {
    const breeds = await getCatBreeds();
    const breedId = findBestCatBreedId(breed, breeds);
    if (!breedId) return null;

    const res = await fetch(
      `https://api.thecatapi.com/v1/images/search?breed_ids=${breedId}&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.length > 0 ? data[0].url : null;
  } catch {
    return null;
  }
}

// --- Route handler ---

export async function POST(request: Request) {
  const { image, mode = "dog" } = await request.json();
  const animalMode: AnimalMode = mode === "cat" ? "cat" : "dog";

  // image arrives as a data URL: "data:image/jpeg;base64,..."
  const [header, base64Data] = image.split(",");
  const mediaType = ((header.match(/data:(.*?);/) as RegExpMatchArray | null)?.[1] ??
    "image/jpeg") as `image/${string}`;

  const result = await generateObject({
    model: "google/gemini-2.5-flash",
    schema: getSchema(animalMode),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: getPromptText(animalMode),
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

  const animalImageUrl =
    animalMode === "cat"
      ? await fetchCatImage(result.object.breed)
      : await fetchDogImage(result.object.breed);

  return Response.json({
    ...result.object,
    animalImageUrl,
  });
}
