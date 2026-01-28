import { type Point } from "./types";

type ZoomSettings = {
  min: number;
  max: number;
  speed: number;
};

type PanSettings = {
  key?: string;
};

export type CanvasViewportOptions = {
  zoom?: ZoomSettings;
  pan?: PanSettings;
  draw: (ctx: CanvasRenderingContext2D) => void;
};

export default class CanvasViewport {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private zoom: number;
  private translation: Point;

  private canvasMousePos: Point;

  private zoomSettings: ZoomSettings | null;
  private panSettings: PanSettings | null;

  private drawFunc: (ctx: CanvasRenderingContext2D) => void;

  constructor(canvas: HTMLCanvasElement, options: CanvasViewportOptions) {
    this.canvas = canvas;
    const ctx = this.canvas.getContext("2d");
    if (ctx === null) throw new Error("Canvas ctx is null");
    this.ctx = ctx;

    this.ctx.imageSmoothingEnabled = false;

    this.zoom = 1;
    this.translation = { x: 0, y: 0 };

    this.canvasMousePos = { x: 0, y: 0 };

    this.zoomSettings = options.zoom ?? null;
    this.panSettings = options.pan ?? null;
    this.drawFunc = options.draw;
  }

  get width(): number {
    return this.canvas.width;
  }

  set width(width: number) {
    this.canvas.width = width;
  }

  get height(): number {
    return this.canvas.height;
  }

  set height(height: number) {
    this.canvas.height = height;
  }

  init() {
    this.addEventListeners();
  }

  draw() {
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.translate(this.translation.x, this.translation.y);
    this.ctx.scale(this.zoom, this.zoom);
    this.drawFunc(this.ctx);
  }

  private isZoomEnabled(
    zoomSettings: ZoomSettings | null,
  ): zoomSettings is ZoomSettings {
    return zoomSettings !== undefined;
  }

  private isPanEnabled(
    panSettings: PanSettings | null,
  ): panSettings is PanSettings {
    return panSettings !== undefined;
  }

  private addEventListeners() {
    addEventListener("wheel", (e: WheelEvent) => {
      console.dir(this);

      if (e.target !== this.canvas) return;
      if (!this.isZoomEnabled(this.zoomSettings)) return;

      const delta = Math.sign(e.deltaY);

      if (delta < 0) {
        if (this.zoom < this.zoomSettings.max) {
          const worldPos = this.getWorldPos({
            x: this.canvasMousePos.x,
            y: this.canvasMousePos.y,
          });
          this.zoom = roundToDecimal(this.zoom + this.zoomSettings.speed, 3);
    

          /**
           * To calculate:
           *
           * Screen/Mouse pos = World pos * zoom + translation
           *
           * Now when zoomPos, mousePos and zoom changes we need to update translation values.
           *
           * Solve for translation:
           *
           * Translation = mouse pos - world pos * zoom
           *
           */
          this.translation.x = this.canvasMousePos.x - worldPos.x * this.zoom;
          this.translation.y = this.canvasMousePos.y - worldPos.y * this.zoom;
        }
      } else {
        if (this.zoom >= this.zoomSettings.min) {
          this.zoom = roundToDecimal(this.zoom - this.zoomSettings.speed, 3);

          const worldPos = this.getWorldPos({
            x: this.canvasMousePos.x,
            y: this.canvasMousePos.y,
          });

          this.translation.x = this.canvasMousePos.x - worldPos.x * this.zoom;
          this.translation.y = this.canvasMousePos.y - worldPos.y * this.zoom;
        }
      }

      this.draw();
      e.stopPropagation();
    });

    if (this.isPanEnabled(this.panSettings)) {
      this.canvas.addEventListener("onmousedown", (e) => {});

      this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
        if (e.target !== this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();

        this.canvasMousePos.x = Math.round(e.clientX - rect.left);
        this.canvasMousePos.y = Math.round(e.clientY - rect.top);
      });

      this.canvas.addEventListener("onmouseup", (e) => {});
    }
  }

  /**
   *
   * 1. Use a requestAnimation frame that calls "draw" every frame
   *
   * 2. Only draw when isDirty -> user decides when draw happens and how the draw procedure is accounted for
   *
   */

  private getWorldPos(pos: Point) {
    // Uses the inverse translation matrix to convert a position on the canvas/screen to the world.
    const inv = this.ctx.getTransform().invertSelf();
    const p = new DOMPoint(pos.x, pos.y).matrixTransform(inv);
    return { x: p.x, y: p.y };

    //  const inv = this.ctx.getTransform().invertSelf();

    // const worldX = inv.a * pos.x + inv.c * pos.y + inv.e;
    // const worldY = inv.b * pos.x + inv.d * pos.y + inv.f;

    // return { x: Math.round(worldX), y: Math.round(worldY) };
  }
}

function roundToDecimal(num: number, decmialPlaces: number) {
  return (
    Math.round(num * Math.pow(10, decmialPlaces)) / Math.pow(10, decmialPlaces)
  );
}
