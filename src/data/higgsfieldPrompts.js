/* =================================================================
   HIGGSFIELD REGENERATION PROMPTS
   Run these once credits are topped up, then drop the outputs into
   /public/images using the filenames in the `file` field.
   Keep one consistent grade across all: deep blacks, warm gold
   highlights, low saturation, cinematic, photoreal.
   CLI: higgsfield generate create gpt_image_2 --aspect_ratio <ar>
        --resolution 2k --wait --prompt "<prompt>"
   ================================================================= */

export const HIGGSFIELD_PROMPTS = [
  {
    file: "hero-sedan.jpg",
    aspect: "16:9",
    prompt:
      "Cinematic photoreal black Mercedes-Benz S-Class at night on a Casablanca boulevard, warm city bokeh, wet-asphalt reflections, gold rim light on the bodywork, moody, low saturation, deep blacks, luxury automotive advertising, 8k editorial",
  },
  {
    file: "meet-greet.jpg",
    aspect: "4:3",
    prompt:
      "Cinematic photoreal chauffeur in a dark tailored suit at a modern airport arrivals hall holding an elegant welcome name sign, warm gold lighting, soft-focus travelers behind, refined, discreet, deep blacks, low saturation, 8k editorial",
  },
  {
    file: "morocco-road.jpg",
    aspect: "16:9",
    prompt:
      "Cinematic photoreal black luxury car gliding through a Moroccan city at dusk, palm-lined boulevard, Hassan II mosque silhouette far off, warm gold highlights, deep blacks, low saturation, premium travel campaign, 8k editorial",
  },
  {
    file: "van-interior.jpg",
    aspect: "16:9",
    prompt:
      "Cinematic photoreal close-up of premium black quilted leather rear seats of a luxury van, ambient gold lighting strips, polished trim, champagne detail, moody, deep blacks, low saturation, 8k editorial",
  },
  {
    file: "chauffeur-door.jpg",
    aspect: "4:3",
    prompt:
      "Cinematic photoreal chauffeur in a black suit and white gloves opening the rear door of a glossy black Mercedes S-Class for a VIP at night, warm gold lighting, deep blacks, low saturation, luxury chauffeur service, 8k editorial",
  },
];
