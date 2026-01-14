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
  ctx: CanvasRenderingContext2D,
  indices: number[]
) {
  const lospecHSVColors = palette.colors.map((c) => ColorConvert.hex.hsv(c));

  lospecHSVColors.sort((c1, c2) => c1[2] - c2[2]);

  for (let i = 0; i < lospecHSVColors.length; ++i) {
    console.log(colors[i]);
    colors[i].hsv = lospecHSVColors[i];
  }

  for (const c of colors) {
    updateColorHTML(c);
  }

  updateCanvas(ctx, indices, colors);
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

async function main() {
  const menuDownload: SlMenu | null = document.getElementById(
    "menu-download"
  ) as SlMenu | null;

  const inputLospecSearch: SlInput | null = document.getElementById(
    "input-lospec-search"
  ) as SlInput | null;
  const btnLospecSearch: SlButton | null = document.getElementById(
    "btn-lospec-search"
  ) as SlButton | null;
  const btnApplyLospecPalette: SlButton | null = document.getElementById(
    "btn-apply-lospec-palette"
  ) as SlButton | null;
  const divLospecPalette: HTMLDivElement = document.getElementById(
    "lospec-palette"
  )! as HTMLDivElement;
  const pLospecPalette: HTMLParagraphElement = document.getElementById(
    "lospec-palette-name"
  )! as HTMLParagraphElement;
  const pLospecPaletteAuthor: HTMLParagraphElement = document.getElementById(
    "lospec-palette-author"
  )! as HTMLParagraphElement;
  const alertLospecError: SlAlert = document.getElementById(
    "lospec-search-error"
  )! as SlAlert;

  const canvas = document.querySelector("canvas");
  const btnAbout = document.getElementById("btn-about");
  const btnSun = document.getElementById("btn-sun");
  const btnMoon = document.getElementById("btn-moon");
  const dialogTag: SlDialog | null = document.getElementById(
    "dialog-tag"
  ) as SlDialog | null;

  if (
    menuDownload === null ||
    canvas === null ||
    btnAbout === null ||
    dialogTag === null ||
    btnMoon === null ||
    btnSun === null ||
    btnLospecSearch === null ||
    inputLospecSearch === null ||
    btnApplyLospecPalette === null
  )
    throw new Error("Missing DOM");

  const ctx = canvas.getContext("2d");

  if (ctx === null) throw new Error("ctx is null");

  const image = await loadImage(
    `${import.meta.env.BASE_URL}assets/images/board-mini.png`
  );

  const { indices, colors } = createColorIndices(image);

  canvas.width = image.width;
  canvas.height = image.height;

  let lospecPalette: LospecPalette | null = null;

  btnApplyLospecPalette.addEventListener("click", () => {
    divLospecPalette.parentElement?.classList.add("hidden");
    if (lospecPalette !== null) {
      applyLospecPalette(lospecPalette, colors, ctx, indices);
    }
  });

  inputLospecSearch.addEventListener("input", () => {
    if (alertLospecError.open) {
      alertLospecError.hide();
    }

    if (!divLospecPalette.parentElement?.classList.contains("hidden")) {
      divLospecPalette.parentElement?.classList.add("hidden");
    }
  });

  btnLospecSearch.addEventListener("click", async () => {
    if (inputLospecSearch.value) {
      btnLospecSearch.disabled = true;
      btnLospecSearch.children[0].classList.add("hidden");
      btnLospecSearch.children[1].classList.remove("hidden");
      const res = await searchLospecPalette(inputLospecSearch.value.toLowerCase().replaceAll(" ", "-"));

      if (res.isSuccess) {
        const palette = res.data;

        if (palette.colors.length !== 4) {
          alertLospecError.textContent = "Palette must have exactly 4 colors.";
          alertLospecError.show();
        } else {
          lospecPalette = palette;
          const linearGradient = `linear-gradient(to right, #${palette.colors[0]} 0% 25%, #${palette.colors[1]} 25% 50%, #${palette.colors[2]} 50% 75%, #${palette.colors[3]} 75% 100%)`;
          divLospecPalette.style.setProperty("background", linearGradient);
          pLospecPalette.textContent = palette.name;
          pLospecPaletteAuthor.textContent = `By ${palette.author || "Lospec"}`;
          divLospecPalette.parentElement?.classList.remove("hidden");
        }
      } else {
        alertLospecError.textContent  = "Palette not found.";
        alertLospecError.show();
      }
      btnLospecSearch.disabled = false;
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

  ctx.drawImage(image, 0, 0);

  menuDownload.addEventListener("sl-select", (e) => {
    downloadPalette(colors, e.detail.item.value);
  });

  for (const c of colors) {
    const colorWrapper = document.getElementById(`color-${c.num}`);

    if (colorWrapper === null) throw new Error("Missing DOM: color " + c.num);

    const colorResult: HTMLDivElement | null =
      colorWrapper.querySelector(".color-result");
    const inputH: SlRange | null = colorWrapper.querySelector(".range-h");

    const inputS: SlInput | null = colorWrapper.querySelector(".input-s");
    const rangeS: SlRange | null = colorWrapper.querySelector(".range-s");
    const inputV: SlInput | null = colorWrapper.querySelector(".input-v");
    const rangeV: SlRange | null = colorWrapper.querySelector(".range-v");

    if (
      colorResult === null ||
      inputH === null ||
      inputS === null ||
      inputV === null ||
      rangeS === null ||
      rangeV === null
    )
      throw new Error("Missing DOM: color " + c.num);

    window.addEventListener("resize", () => {
      if (window.innerWidth < 767) {
        rangeS.tooltip = "top";
        rangeV.tooltip = "top";
      } else {
        rangeS.tooltip = "none";
        rangeV.tooltip = "none";
      }
    });

    inputH.addEventListener("sl-input", (e: SlInputEvent) => {
      if (e.target) {
        c.hsv[0] = parseInt((e.target as SlInput).value);
        updateColorHTML(c);
        updateCanvas(ctx, indices, colors);
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

        updateColorHTML(c);
        updateCanvas(ctx, indices, colors);
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

        updateColorHTML(c);
        updateCanvas(ctx, indices, colors);
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

        updateColorHTML(c);
        updateCanvas(ctx, indices, colors);
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

        updateColorHTML(c);
        updateCanvas(ctx, indices, colors);
      }
    });

    if (window.innerWidth < 767) {
      rangeS.tooltip = "top";
      rangeV.tooltip = "top";
    } else {
      rangeS.tooltip = "none";
      rangeV.tooltip = "none";
    }

    updateColorHTML(c);
    updateCanvas(ctx, indices, colors);

    requestAnimationFrame(() =>
      document.querySelector("body")!.classList.remove("hidden")
    );
  }
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

function updateColorHTML(color: PaletteColor) {
  const colorWrapper = document.getElementById(`color-${color.num}`);

  if (colorWrapper === null) throw new Error("Missing DOM: color " + color.num);

  const colorResult: HTMLDivElement | null =
    colorWrapper.querySelector(".color-result");
  const inputH: SlRange | null = colorWrapper.querySelector(".range-h");

  const inputS: SlInput | null = colorWrapper.querySelector(".input-s");
  const rangeS: SlRange | null = colorWrapper.querySelector(".range-s");
  const inputV: SlInput | null = colorWrapper.querySelector(".input-v");
  const rangeV: SlRange | null = colorWrapper.querySelector(".range-v");

  if (
    colorResult === null ||
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
  colorResult.style.backgroundColor = `hsl(${hsl[0]} ${hsl[1]}% ${hsl[2]}%)`;
}

function createColorIndices(image: HTMLImageElement): {
  colors: PaletteColor[];
  indices: number[];
} {
  const indices: number[] = [];

  const canvas = document.createElement("canvas");

  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (canvas === null || ctx === null)
    throw new Error("Canvas/Ctx not initialized");

  canvas.width = image.width;
  canvas.height = image.height;
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
        (c) => c[0] === hsv[0] && c[1] === hsv[1] && c[2] === hsv[2]
      ) === undefined
    ) {
      colors.push(hsv);
      if (colors.length > 4)
        throw new Error("Image contains more colors than 4!");
    }
  }

  if (colors.length < 4) {
    throw new Error("Image contains less colors than 4!");
  }

  colors.sort((a, b) => a[2] - b[2]);

  let colorNum = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    r = imageData[i];
    g = imageData[i + 1];
    b = imageData[i + 2];

    // not interested in a
    hsv = ColorConvert.rgb.hsv(r, g, b);

    colorNum = colors.findIndex(
      (c) => c[0] === hsv[0] && c[1] === hsv[1] && c[2] === hsv[2]
    );

    if (colorNum === -1)
      throw new Error("Failed to create indices array internal");

    indices.push(colorNum + 1);
  }

  const paletteColors: PaletteColor[] = colors.map((c, idx) => ({
    num: idx + 1,
    hsv: c,
  }));
  return { indices, colors: paletteColors };
}

function updateCanvas(
  ctx: CanvasRenderingContext2D,
  indices: number[],
  colors: PaletteColor[]
): void {
  const newPixels = new Uint8ClampedArray(
    4 * ctx.canvas.width * ctx.canvas.height
  );

  let paletteColor: PaletteColor | undefined = colors[0];
  let rIdx = 0;

  for (let i = 0; i < indices.length; ++i) {
    paletteColor = colors.find((c) => c.num === indices[i]);

    if (paletteColor === undefined) throw new Error("Color not found");

    const rgb = ColorConvert.hsv.rgb(paletteColor.hsv);

    rIdx = i * 4;

    newPixels[rIdx] = rgb[0];
    newPixels[rIdx + 1] = rgb[1];
    newPixels[rIdx + 2] = rgb[2];
    newPixels[rIdx + 3] = 255;
  }

  const imageData = new ImageData(
    newPixels,
    ctx.canvas.width,
    ctx.canvas.height
  );
  ctx.putImageData(imageData, 0, 0);
}
