import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TWILIGHT_PROMPT = `Edit this real estate photograph to show how it would look during blue hour — the period just after sunset when the sky is a deep, rich blue. This is a LIGHTING EDIT ONLY — the original photograph is sacred. STRICT RULES: 1) The camera angle, perspective, focal length, and framing must remain EXACTLY as shot — do not shift, rotate, zoom, crop, or reframe the image in any way. 2) Every architectural element — walls, roof, windows, doors, garage, columns, trim, gutters, siding — must remain in the EXACT same position, size, shape, and proportion. Do not redraw, reshape, or reinterpret any structure. 3) All landscaping — trees, bushes, grass, flowers, rocks, mulch — must stay exactly where they are with the same shapes and sizes. 4) The driveway, sidewalks, pathways, and all ground surfaces must remain identical. 5) SKY: Replace with a deep, rich steel-blue to navy blue sky. NO pink, NO purple, NO orange, NO sunset colors. Think pure blue hour — a clean, deep blue that is slightly lighter near the horizon and darker at the zenith. If mountains or distant landscape features exist, keep them in their exact positions as dark silhouettes against the blue sky. 6) WINDOWS: Add warm amber interior glow at moderate intensity — soft and inviting, as if a few rooms have lights on. Not every window needs to glow. Keep it natural and understated. 7) EXTERIOR LIGHTING: Add subtle warm accent lighting only where light fixtures plausibly exist on the house. Soft downlights under eaves, gentle sconce glow near entries. Minimal and realistic. 8) AMBIENT BRIGHTNESS: This is critical — the scene should NOT be too dark. During blue hour there is still significant ambient light. You should be able to clearly see the color and texture of all surfaces — siding, stone, brick, driveway concrete, roof shingles, grass, landscaping. The house exterior should be well-lit by ambient skylight with a cool blue tone. Think 60-70% of daytime brightness with a blue color shift, NOT nighttime darkness. The image should feel bright and airy despite being evening. 9) CONTRAST: Maintain good detail in both shadows and highlights. No crushed blacks. The warm window glow and exterior lights should pop against the cool blue ambient, but the shadows should still have visible detail. 10) This must look like the EXACT same photograph taken during blue hour by a professional architectural photographer with proper exposure settings.`;

export async function convertToTwilight(
  imageBuffer: Buffer,
  originalFilename: string
): Promise<{ resultBuffer: Buffer; revisedPrompt: string | null }> {
  const startTime = Date.now();
  console.log(
    `[OpenAI] Starting twilight conversion for: ${originalFilename}`
  );

  const blob = new Blob([new Uint8Array(imageBuffer)], {
    type: originalFilename.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg",
  });
  const file = new File([blob], originalFilename, { type: blob.type });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: file,
    prompt: TWILIGHT_PROMPT,
    size: "auto" as "1024x1024",
    quality: "high",
  });

  const imageData = response.data?.[0];
  if (!imageData?.b64_json) {
    throw new Error("OpenAI returned no image data");
  }

  const resultBuffer = Buffer.from(imageData.b64_json, "base64");
  const duration = Date.now() - startTime;
  console.log(`[OpenAI] Conversion completed in ${duration}ms`);

  return {
    resultBuffer,
    revisedPrompt: imageData.revised_prompt ?? null,
  };
}
