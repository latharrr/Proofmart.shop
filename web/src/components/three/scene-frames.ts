/**
 * World-space box each variant's camera fits ("contain") inside the stage.
 * Shared by the scene and the poster so a poster rendered at exactly this
 * aspect, shown with object-fit: contain, lines up with the live scene at any
 * stage size. Kept separate so the stage wrapper doesn't import three.js.
 */
export const SCENE_FRAMES = {
  hero: { w: 8.3, h: 4.4 },
  stack: { w: 4.8, h: 5.0 },
  single: { w: 4.5, h: 3.7 },
} as const;

export type SceneFrameVariant = keyof typeof SCENE_FRAMES;
