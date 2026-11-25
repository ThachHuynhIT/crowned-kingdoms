import type Phaser from 'phaser';
import { artQuality, nextPow2 } from './artQuality';
import { UI_KEY } from './atlas';

/**
 * Smooth sampling of a texture (close-up art, 12/11/2026): LINEAR magnification and trilinear mipmaps where the
 * context allows them (WebGL2, or power-of-two pages on WebGL1), so art drawn smaller than its pixels keeps its
 * detail instead of dropping pixels. Phaser has no per-texture mipmap switch, so the GL parameters are set directly;
 * the texture Phaser had bound on the active unit is bound back afterwards.
 */
export const applySmoothFilter = (
  renderer: Phaser.Renderer.Canvas.CanvasRenderer | Phaser.Renderer.WebGL.WebGLRenderer,
  texture: Phaser.Textures.Texture,
): void => {
  const gl = (renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl as WebGLRenderingContext | undefined;
  if (!gl) return;
  const previous = gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null;
  const webgl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  for (const source of texture.source) {
    const handle = source.glTexture?.webGLTexture;
    if (!handle) continue;
    const mips = webgl2 || (isPow2(source.width) && isPow2(source.height));
    gl.bindTexture(gl.TEXTURE_2D, handle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
  }
  gl.bindTexture(gl.TEXTURE_2D, previous);
};

const isPow2 = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;

const isWebGL2 = (renderer: Phaser.Game['renderer']): boolean => {
  const gl = (renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl as WebGLRenderingContext | undefined;
  return gl !== undefined && typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
};

/**
 * WebGL1 builds mipmaps only for power-of-two textures. Re-create single-page texture `key` on a power-of-two canvas,
 * the picture at the top left and transparent beyond, keeping every frame (`__BASE` stays the picture's own size), so
 * `applySmoothFilter` can mipmap it. Only for textures drawn through their frames (never tiled, never read back as
 * pixels). Returns false when it cannot (several pages, or past `maxSide`).
 */
export const padToPowerOfTwo = (textures: Phaser.Textures.TextureManager, key: string, maxSide = 4096): boolean => {
  const tex = textures.get(key);
  if (tex.source.length !== 1) return false;
  const src = tex.getSourceImage() as CanvasImageSource & { width: number; height: number };
  const w = nextPow2(src.width);
  const h = nextPow2(src.height);
  if (w === src.width && h === src.height) return true;
  if (w > maxSide || h > maxSide) return false;
  const frames = tex.getFrameNames(true).map((name) => {
    const f = tex.get(name);
    return { name, x: f.cutX, y: f.cutY, w: f.cutWidth, h: f.cutHeight };
  });
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')?.drawImage(src, 0, 0);
  textures.remove(key);
  const padded = textures.addCanvas(key, canvas);
  if (!padded) return false;
  padded.remove('__BASE');
  for (const f of frames) padded.add(f.name, 0, f.x, f.y, f.w, f.h);
  return true;
};

/** UI frames keep their crisp nine-slice edges: the generated `ui` texture, the Kenney kit frames, Phaser's own. */
export const keepsNearest = (key: string): boolean => key === UI_KEY || key.startsWith('ui-kit-') || key.startsWith('__');

/**
 * Smooth every loaded texture but the UI frames, when the session's art quality asks for it. On WebGL1 the textures in
 * `padKeys` (world pictures drawn whole, far below their size at the overview zoom) are first padded to a power of two
 * so they get mipmaps; the others are sampled LINEAR only.
 */
export const smoothLoadedTextures = (game: Phaser.Game, padKeys: ReadonlySet<string> = new Set()): void => {
  if (!artQuality().smooth) return;
  const webgl2 = isWebGL2(game.renderer);
  for (const key of game.textures.getTextureKeys()) {
    if (keepsNearest(key)) continue;
    if (!webgl2 && padKeys.has(key)) padToPowerOfTwo(game.textures, key);
    applySmoothFilter(game.renderer, game.textures.get(key));
  }
};

/**
 * Smooth one texture made after Preload, when the art quality asks for it: the painted field (`pad`: padded to a power
 * of two on WebGL1 so it mipmaps) and the tiling ground (never padded: it repeats).
 */
export const smoothTextureIfEnabled = (textures: Phaser.Textures.TextureManager, key: string, pad = false): void => {
  if (!artQuality().smooth || !textures.exists(key)) return;
  if (pad && !isWebGL2(textures.game.renderer)) padToPowerOfTwo(textures, key);
  applySmoothFilter(textures.game.renderer, textures.get(key));
};
