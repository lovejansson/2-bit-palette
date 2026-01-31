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
  drawLoop?: boolean;
  draw: (ctx: CanvasRenderingContext2D) => void;
};

export default class CanvasViewport extends EventTarget {

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private zoom: number;
  private translation: Point;
  private canvasMousePos: Point;

  private zoomSettings: ZoomSettings | null;
  private panSettings: PanSettings | null;
  private drawLoop: boolean;
  private isPanKeyDown: boolean;
  private panPos: Point;
  private isMouseDown: boolean;

  private drawFunc: (ctx: CanvasRenderingContext2D) => void;

  constructor(canvas: HTMLCanvasElement, options: CanvasViewportOptions) {
    super();
    this.canvas = canvas;

    const ctx = this.canvas.getContext("2d");
    if (ctx === null) throw new Error("Canvas ctx is null");
    this.ctx = ctx;

    this.ctx.imageSmoothingEnabled = false;

    this.zoom = 1;

    this.translation = { x: 0, y: 0 };

    this.canvasMousePos = { x: 0, y: 0 };

    this.panPos = { x: 0, y: 0 };

    this.zoomSettings = options.zoom ?? null;

    this.panSettings = options.pan ?? null;

    this.drawLoop = options.drawLoop ?? true;

    this.drawFunc = options.draw;

    this.isPanKeyDown = false;
    this.isMouseDown = false;
  }

  get width(): number {
    return this.canvas.width;
  }

  set width(width: number) {
    const rounded = Math.round(width);
    this.canvas.width = rounded;
    this.ctx.imageSmoothingEnabled = false;
    if(!this.drawLoop) this.draw();
  }

  get height(): number {
    return this.canvas.height;
  }

  set height(height: number) {
    const rounded = Math.round(height);
    this.canvas.height = rounded;
    this.ctx.imageSmoothingEnabled = false;
    if(!this.drawLoop) this.draw();
  }

  init() {
    this.addEventListeners();
    if (this.drawLoop) {
      this.loop();
    } else {
      this.draw();
    }
  }

  loop() {
    this.draw();
    requestAnimationFrame(() => this.loop());
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
    return zoomSettings !== null;
  }

  private isPanEnabled(
    panSettings: PanSettings | null,
  ): panSettings is PanSettings {
    return panSettings !== null;
  }

  private addEventListeners() {
    if (this.isZoomEnabled(this.zoomSettings)) {

      addEventListener("wheel", (e: WheelEvent) => {
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
            this.translation.x = Math.round(this.canvasMousePos.x - worldPos.x * this.zoom);
            this.translation.y = Math.round(this.canvasMousePos.y - worldPos.y * this.zoom);
          }
        } else {

          if (this.zoom >= this.zoomSettings.min) {

            this.zoom = roundToDecimal(this.zoom - this.zoomSettings.speed, 3);

            const worldPos = this.getWorldPos({
              x: this.canvasMousePos.x,
              y: this.canvasMousePos.y,
            });

            this.translation.x = Math.round(this.canvasMousePos.x - worldPos.x * this.zoom);
            this.translation.y = Math.round(this.canvasMousePos.y - worldPos.y * this.zoom);
          }
        }

        e.stopPropagation();

      });
    }

    if (this.isPanEnabled(this.panSettings)) {

      addEventListener("keydown", (e: KeyboardEvent) => {

        if (!this.isPanEnabled(this.panSettings)) return;

        if (e.key === this.panSettings.key) {
          this.canvas.style.cursor = "grab";
          this.isPanKeyDown = true;
        }
      });

      addEventListener("keyup", (e: KeyboardEvent) => {
        if (!this.isPanEnabled(this.panSettings)) return;

        if (e.key === this.panSettings.key) {
          this.canvas.style.cursor = "default";
          this.isPanKeyDown = false;
        }
      });

      this.canvas.addEventListener("mousedown", (e: MouseEvent) => {

        if (e.target !== this.canvas) return;
        this.isMouseDown = true;

        if (this.isPanKeyDown) {
          const rect = this.canvas.getBoundingClientRect();

          this.panPos.x = Math.round(e.clientX - rect.left);
          this.panPos.y = Math.round(e.clientY - rect.top);
        }
      });

      this.canvas.addEventListener("mousemove", (e: MouseEvent) => {

        if (e.target !== this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();

        this.canvasMousePos.x = Math.round(e.clientX - rect.left);
        this.canvasMousePos.y = Math.round(e.clientY - rect.top);

        if (this.isPanKeyDown && this.isMouseDown) {
          this.translation.x += (this.canvasMousePos.x - this.panPos.x);
          this.translation.y += (this.canvasMousePos.y - this.panPos.y);
          this.panPos = { ...this.canvasMousePos };
        }

      });

      this.canvas.addEventListener("mouseup", (_: MouseEvent) => {
        this.panPos.x = 0;
        this.panPos.y = 0;
        this.isMouseDown = false;

        const worldPos = this.getWorldPos({
          x: this.canvasMousePos.x,
          y: this.canvasMousePos.y,
        });


        this.dispatchEvent(new CustomEvent("select", { detail: { pos: worldPos, } }));
      });

      this.canvas.addEventListener("click", (e: MouseEvent) => {

        if (e.target !== this.canvas) return;

        const worldPos = this.getWorldPos({
          x: this.canvasMousePos.x,
          y: this.canvasMousePos.y,
        });

        this.dispatchEvent(new CustomEvent("click", { detail: { pos: worldPos } }));

      });
    }
  }

  private getWorldPos(pos: Point) {
    // Uses the inverse translation matrix to convert a position on the canvas/screen to the world.
    const inv = this.ctx.getTransform().invertSelf();
    const p = new DOMPoint(pos.x, pos.y).matrixTransform(inv);
    return { x: p.x, y: p.y };
  }
}

function roundToDecimal(num: number, decmialPlaces: number) {
  return (
    Math.round(num * Math.pow(10, decmialPlaces)) / Math.pow(10, decmialPlaces)
  );
}
