import ColorConvert, { type HSV } from "color-convert";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";
setBasePath("/node_modules/@shoelace-style/shoelace/dist");
import {
  SlAlert,
  SlButton,
  SlDialog,
  SlInput,
  type SlInputEvent,
  SlMenu,
  SlRange,
} from "@shoelace-style/shoelace";
import {
  createAsePalette,
  createGimpPalette,
  createHexPalette,
  createJASCPALPalette,
  createPaintPalette,
  createPNGPalette,
  type PaletteColor,
  type LospecPalette,
  searchLospecPalette,
} from "./src/palette";

import { registerIconLibrary } from "@shoelace-style/shoelace/dist/utilities/icon-library.js";

import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/themes/dark.css";
import "./index.css";
import type { Result, UserImage } from "./src/types";
import CanvasViewport from "./src/Canvas";

registerIconLibrary("pixelarticons", {
  resolver: (name: string) =>
    `${import.meta.env.BASE_URL}assets/icons/${name}.svg`,
  mutator: (svg: SVGElement) => svg.setAttribute("fill", "currentColor"),
});

main();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = src;

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject("Failed to load image");
    };
  });
}

function applyLospecPalette(
  palette: LospecPalette,
  colors: PaletteColor[],
  isMobile: boolean,
) {
  const lospecHSVColors = palette.colors.map((c) => ColorConvert.hex.hsv(c));

  lospecHSVColors.sort((c1, c2) => c1[2] - c2[2]);

  for (let i = 0; i < lospecHSVColors.length; ++i) {
    colors[i].hsv = lospecHSVColors[i];
  }

  for (const c of colors) {
    updateColorsUI(c, isMobile);
  }
}

function switchTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  const btnSun = document.getElementById("btn-sun")!;
  const btnMoon = document.getElementById("btn-moon")!;

  switch (theme) {
    case "dark":
      root.classList.add("sl-theme-dark");
      root.classList.remove("sl-theme-light");
      btnSun.classList.remove("hidden");
      btnMoon.classList.add("hidden");
      break;
    case "light":
      root.classList.add("sl-theme-light");
      root.classList.remove("sl-theme-dark");
      btnSun.classList.add("hidden");
      btnMoon.classList.remove("hidden");
      break;
  }

  localStorage.setItem("theme", theme);
}

function initColorsUI(canvas: CanvasViewport, colors: PaletteColor[], isMobile = false) {
  for (const c of colors) {
    const colorWrapper = document.getElementById(`color-${c.num}`);

    if (colorWrapper === null) throw new Error("Missing DOM: color " + c.num);

    const colorInputsWrapper = isMobile
      ? colorWrapper.querySelector(".dialog-color")
      : colorWrapper.querySelector(".color-wrapper");

    if (colorInputsWrapper === null)
      throw new Error("Missing DOM: color inputs " + c.num);

    const inputH: SlRange | null = colorInputsWrapper.querySelector(".range-h");
    const inputS: SlInput | null = colorInputsWrapper.querySelector(".input-s");
    const rangeS: SlRange | null = colorInputsWrapper.querySelector(".range-s");
    const inputV: SlInput | null = colorInputsWrapper.querySelector(".input-v");
    const rangeV: SlRange | null = colorInputsWrapper.querySelector(".range-v");

    if (
      inputH === null ||
      inputS === null ||
      inputV === null ||
      rangeS === null ||
      rangeV === null
    )
      throw new Error("Missing DOM: color " + c.num);

    // In mobile mode the color picker is inside of a dialog instead of directly on the page
    if (isMobile) {
      rangeS.tooltip = "top";
      rangeV.tooltip = "top";

      const btnColor = colorWrapper.querySelector(".btn-color");
      const dialogColorPicker: SlDialog | null =
        colorWrapper.querySelector(".dialog-color");
      if (dialogColorPicker === null || btnColor === null)
        throw new Error("Missing DOM: color " + c.num);

      btnColor.addEventListener("click", () => {
        dialogColorPicker.show();
      });
    } else {
      rangeS.tooltip = "none";
      rangeV.tooltip = "none";
    }

    // Setup all the eventlisteners

    inputH.addEventListener("sl-input", (e: SlInputEvent) => {
      if (e.target) {
        c.hsv[0] = parseInt((e.target as SlInput).value);
        updateColorsUI(c, isMobile);
        canvas.draw();
      }
    });

    inputS.addEventListener("sl-input", (e: SlInputEvent) => {
      if (e.target) {
        const value = (e.target as SlInput).value;

        if (value === "") {
          c.hsv[1] = 0;
        } else if (parseInt(value) > 100) {
          c.hsv[1] = 100;
        } else {
          c.hsv[1] = parseInt(value);
        }

        updateColorsUI(c, isMobile);
        canvas.draw();
      }
    });

    rangeS.addEventListener("sl-input", (e: SlInputEvent) => {
      if (e.target) {
        const value = (e.target as SlInput).value;

        if (value === "") {
          c.hsv[1] = 0;
        } else if (parseInt(value) > 100) {
          c.hsv[1] = 100;
        } else {
          c.hsv[1] = parseInt(value);
        }

        updateColorsUI(c, isMobile);
        canvas.draw();
      }
    });

    inputV.addEventListener("sl-input", (e: SlInputEvent) => {
      if (e.target) {
        const value = (e.target as SlInput).value;

        if (value === "") {
          c.hsv[2] = 0;
        } else if (parseInt(value) > 100) {
          c.hsv[2] = 100;
        } else {
          c.hsv[2] = parseInt(value);
        }

        updateColorsUI(c, isMobile);
        canvas.draw();
      }
    });

    rangeV.addEventListener("sl-input", (e: SlInputEvent) => {
      if (e.target) {
        const value = (e.target as SlInput).value;

        if (value === "") {
          c.hsv[2] = 0;
        } else if (parseInt(value) > 100) {
          c.hsv[2] = 100;
        } else {
          c.hsv[2] = parseInt(value);
        }

        updateColorsUI(c, isMobile);
        canvas.draw();
      }
    });

    updateColorsUI(c, isMobile);
    canvas.draw();
  }
}

async function main() {
  const menuDownload: SlMenu | null = document.getElementById(
    "menu-download",
  ) as SlMenu | null;

  const inputLospecSearch: SlInput | null = document.getElementById(
    "input-lospec-search",
  ) as SlInput | null;
  const btnLospecSearch: SlButton | null = document.getElementById(
    "btn-lospec-search",
  ) as SlButton | null;
  const btnApplyLospecPalette: SlButton | null = document.getElementById(
    "btn-apply-lospec-palette",
  ) as SlButton | null;
  const divLospecPalette: HTMLDivElement = document.getElementById(
    "lospec-palette",
  )! as HTMLDivElement;
  const pLospecPalette: HTMLParagraphElement = document.getElementById(
    "lospec-palette-name",
  )! as HTMLParagraphElement;
  const pLospecPaletteAuthor: HTMLParagraphElement = document.getElementById(
    "lospec-palette-author",
  )! as HTMLParagraphElement;
  const alertError: SlAlert = document.getElementById(
    "alert-error",
  )! as SlAlert;

  const canvasEl = document.querySelector("canvas");
  const btnAbout = document.getElementById("btn-about");
  const btnSun = document.getElementById("btn-sun");
  const btnMoon = document.getElementById("btn-moon");
  const dialogTag: SlDialog | null = document.getElementById(
    "dialog-tag",
  ) as SlDialog | null;

  if (
    menuDownload === null ||
    canvasEl === null ||
    btnAbout === null ||
    dialogTag === null ||
    btnMoon === null ||
    btnSun === null ||
    btnLospecSearch === null ||
    inputLospecSearch === null ||
    btnApplyLospecPalette === null
  )
    throw new Error("Missing DOM");

  const defaultImage = await loadImage(
    `${import.meta.env.BASE_URL}assets/images/board-mini.png`,
  );

  const indicesResult = createColorIndices(defaultImage);

  if (!indicesResult.isSuccess) {
    alertError.textContent = indicesResult.data;
    alertError.show();
    return;
  }

  const colors: PaletteColor[] = [
    { num: 1, hsv: [100, 50, 10] },
    { num: 2, hsv: [100, 50, 30] },
    { num: 3, hsv: [100, 50, 75] },
    { num: 4, hsv: [100, 50, 94] },
  ];

  const images: UserImage[] = [
    {
      pos: { x: 0, y: 0 },
      width: defaultImage.width,
      height: defaultImage.height,
      indices: indicesResult.data,
    },
  ];

  let isMobile = window.innerWidth < 767;

  const canvas = new CanvasViewport(canvasEl, {
    drawLoop: false,
    draw: (ctx: CanvasRenderingContext2D) => draw(ctx, colors, images),
  });

  canvas.width = defaultImage.width;
  canvas.height = defaultImage.height;

  canvas.init();

  initColorsUI(canvas, colors, window.innerWidth < 767);

  addEventListener("resize", () => {
    isMobile = window.innerWidth < 767;
    initColorsUI(canvas, colors, window.innerWidth < 767);
  });

  let lospecPalette: LospecPalette | null = null;

  btnApplyLospecPalette.addEventListener("click", () => {
    divLospecPalette.parentElement?.classList.add("hidden");
    if (lospecPalette !== null) {
      applyLospecPalette(lospecPalette, colors, isMobile);
      canvas.draw();
    }
  });

  inputLospecSearch.addEventListener("input", () => {
    if (alertError.open) {
      alertError.hide();
    }

    if (!divLospecPalette.parentElement?.classList.contains("hidden")) {
      divLospecPalette.parentElement?.classList.add("hidden");
    }
  });

  btnLospecSearch.addEventListener("click", async () => {
    if (inputLospecSearch.value) {
      btnLospecSearch.children[0].classList.add("hidden");
      btnLospecSearch.children[1].classList.remove("hidden");
      const res = await searchLospecPalette(
        inputLospecSearch.value.toLowerCase().trim().replaceAll(" ", "-"),
      );

      if (res.isSuccess) {
        const palette = res.data;

        if (palette.colors.length !== 4) {
          alertError.textContent = "Palette must have exactly 4 colors.";
          alertError.show();
        } else {
          lospecPalette = palette;
          const linearGradient = `linear-gradient(to right, #${palette.colors[0]} 0% 25%, #${palette.colors[1]} 25% 50%, #${palette.colors[2]} 50% 75%, #${palette.colors[3]} 75% 100%)`;
          divLospecPalette.style.setProperty("background", linearGradient);
          pLospecPalette.textContent = palette.name;
          pLospecPaletteAuthor.textContent = `By ${palette.author || "Lospec"}`;
          divLospecPalette.parentElement?.classList.remove("hidden");
        }
      } else {
        alertError.textContent = "Palette not found.";
        alertError.show();
      }
      btnLospecSearch.children[0].classList.remove("hidden");
      btnLospecSearch.children[1].classList.add("hidden");
      inputLospecSearch.value = "";
    }
  });

  btnAbout.addEventListener("click", () => {
    dialogTag.show();
  });

  btnSun.addEventListener("click", () => {
    switchTheme("light");
  });

  btnMoon.addEventListener("click", () => {
    switchTheme("dark");
  });

  if (localStorage.getItem("theme") === "dark") {
    switchTheme("dark");
  } else {
    switchTheme("light");
  }

  menuDownload.addEventListener("sl-select", (e) => {
    downloadPalette(colors, e.detail.item.value);
  });

  requestAnimationFrame(() => {

    document.querySelector("body")!.classList.remove("hidden");
    canvas.draw();
  },
  );
}

function download(blob: Blob, extension: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "2-bit-palette" + "." + extension;
  a.click();
}

async function downloadPalette(colors: PaletteColor[], format: string) {
  switch (format) {
    case "png-1": {
      const png = await createPNGPalette(colors, 1);
      download(png, "png");
      break;
    }
    case "png-8": {
      const png = await createPNGPalette(colors, 8);
      download(png, "png");
      break;
    }
    case "png-32": {
      const png = await createPNGPalette(colors, 32);
      download(png, "png");
      break;
    }
    case "pal":
      const pal = createJASCPALPalette(colors);
      download(pal, "pal");
      break;
    case "photoshop-ase":
      const ase = createAsePalette(colors);
      download(ase, "ase");
      break;
    case "paint":
      const paint = createPaintPalette(colors);
      download(paint, "txt");
      break;
    case "gimp":
      const gimp = createGimpPalette(colors);
      download(gimp, "gpl");
      break;
    case "hex":
      const hex = createHexPalette(colors);
      download(hex, "hex");
      break;
  }
}

function updateColorsUI(color: PaletteColor, isMobile: boolean = false) {
  const colorWrapper = document.getElementById(`color-${color.num}`);
  if (colorWrapper === null) throw new Error("Missing DOM: color " + color.num);

  const colorInputsWrapper = isMobile
    ? colorWrapper.querySelector(".dialog-color")
    : colorWrapper.querySelector(".color-wrapper");

  if (colorInputsWrapper === null)
    throw new Error("Missing DOM: color " + color.num);
  const colorResults: NodeListOf<HTMLElement> =
    colorWrapper.querySelectorAll(".color-result");

  const inputH: SlRange | null = colorInputsWrapper.querySelector(".range-h");

  const inputS: SlInput | null = colorInputsWrapper.querySelector(".input-s");
  const rangeS: SlRange | null = colorInputsWrapper.querySelector(".range-s");
  const inputV: SlInput | null = colorInputsWrapper.querySelector(".input-v");
  const rangeV: SlRange | null = colorInputsWrapper.querySelector(".range-v");

  if (
    inputH === null ||
    inputS === null ||
    inputV === null ||
    rangeS === null ||
    rangeV === null
  )
    throw new Error("Missing DOM: color " + color.num);

  inputH.value = color.hsv[0];
  inputS.value = color.hsv[1].toString();
  inputV.value = color.hsv[2].toString();
  rangeS.value = color.hsv[1];
  rangeV.value = color.hsv[2];

  const hsl = ColorConvert.hsv.hsl(color.hsv[0], color.hsv[1], color.hsv[2]);
  for (const c of colorResults) {
    c.style.backgroundColor = `hsl(${hsl[0]} ${hsl[1]}% ${hsl[2]}%)`;
  }
}

function createColorIndices(image: HTMLImageElement): Result<number[], string> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = image.width;
  canvas.height = image.height;

  if (canvas === null || ctx === null)
    throw new Error("Canvas/Ctx not initialized");

  ctx.imageSmoothingEnabled = true;

  ctx.drawImage(image, 0, 0, image.width, image.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const colors: HSV[] = [];

  let r: number = 0;
  let g: number = 0;
  let b: number = 0;

  let hsv: HSV = ColorConvert.rgb.hsv(r, g, b);

  for (let i = 0; i < imageData.length; i += 4) {
    r = imageData[i];
    g = imageData[i + 1];
    b = imageData[i + 2];

    // not interested in a
    hsv = ColorConvert.rgb.hsv(r, g, b);

    if (
      colors.find(
        (c) => c[0] === hsv[0] && c[1] === hsv[1] && c[2] === hsv[2],
      ) === undefined
    ) {
      colors.push(hsv);
      if (colors.length > 4)
        return {
          isSuccess: false,
          data: "Image contains more colors than 4!",
        };
    }
  }

  if (colors.length < 4) {
    return { isSuccess: false, data: "Image contains less colors than 4!" };
  }

  colors.sort((a, b) => a[2] - b[2]);

  const indices: number[] = [];

  let colorNum = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    r = imageData[i];
    g = imageData[i + 1];
    b = imageData[i + 2];

    // not interested in a
    hsv = ColorConvert.rgb.hsv(r, g, b);

    colorNum = colors.findIndex(
      (c) => c[0] === hsv[0] && c[1] === hsv[1] && c[2] === hsv[2],
    );

    if (colorNum === -1)
      throw new Error("Failed to create indices array internal");

    indices.push(colorNum + 1);
  }

  return { isSuccess: true, data: indices };
}

function draw(
  ctx: CanvasRenderingContext2D,
  colors: PaletteColor[],
  images: UserImage[],
) {


  for (const image of images) {
    // Create the pixels for the image by mapping the image indices with the chosen colors.

    const newPixels = new Uint8ClampedArray(4 * image.width * image.height);

    let paletteColor: PaletteColor | undefined = colors[0];
    let rIdx = 0;

    for (let i = 0; i < image.indices.length; ++i) {
      paletteColor = colors.find((c) => c.num === image.indices[i]);

      if (paletteColor === undefined)
        throw new Error("Palette color not found");

      const rgb = ColorConvert.hsv.rgb(paletteColor.hsv);

      rIdx = i * 4;

      newPixels[rIdx] = rgb[0];
      newPixels[rIdx + 1] = rgb[1];
      newPixels[rIdx + 2] = rgb[2];
      newPixels[rIdx + 3] = 255;

    }

    const imageData = new ImageData(
      newPixels,
      image.width,
      image.height,
    );

    const canvasOff = document.createElement("canvas");
    canvasOff.width = image.width;
    canvasOff.height = image.height;
    const offCtx = canvasOff.getContext("2d")!;
    offCtx.imageSmoothingEnabled = false;
    canvasOff.style.imageRendering = "pixelated";

    offCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(canvasOff, image.pos.x, image.pos.y);

  }
}
