import ColorConvert, { type HSV } from 'color-convert';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
setBasePath('/node_modules/@shoelace-style/shoelace/dist');
import { SlInput, type SlInputEvent, SlMenu, SlRange } from '@shoelace-style/shoelace';
import { createGimpPalette, createHexPalette, createJASCPALPalette, createPaintPalette, createPNGPalette, type PaletteColor } from './palette';


main();


function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = src;

        image.onload = () => {
            resolve(image);
        }

        image.onerror = () => {
            reject("Failed to load image")
        }
    })
}

async function main() {
    const image = await loadImage("/assets/images/board-mini.png");



    const {indices, colors} = createColorIndices(image);

    const menuDownload: SlMenu | null = document.getElementById("menu-download") as SlMenu | null;

    const canvas = document.querySelector("canvas");


    if (menuDownload === null || canvas === null) throw new Error("Missing DOM");

    canvas.width = image.width;
    canvas.height = image.height
    const ctx = canvas.getContext("2d");

    if (ctx === null) throw new Error("ctx is null");

    ctx.drawImage(image, 0, 0);


    menuDownload.addEventListener("sl-select", (e) => {
        downloadPalette(colors, e.detail.item.value);
    });

    for (const c of colors) {

        const colorWrapper = document.getElementById(`color-${c.num}`);

        if (colorWrapper === null) throw new Error("Missing DOM: color " + c.num);

        const colorResult: HTMLDivElement | null = colorWrapper.querySelector(".color-result");
        const inputH: SlInput | null = colorWrapper.querySelector(".input-h");

        const inputS: SlInput | null = colorWrapper.querySelector(".input-s");
        const rangeS: SlRange | null = colorWrapper.querySelector(".range-s");
        const inputV: SlInput | null = colorWrapper.querySelector(".input-v");
        const rangeV: SlRange | null = colorWrapper.querySelector(".range-v");

        if (colorResult === null || inputH === null || inputS === null || inputV === null || rangeS === null || rangeV === null) throw new Error("Missing DOM: color " + c.num)

        inputH.addEventListener("sl-input", (e: SlInputEvent) => {
            if (e.target) {
                c.hsv[0] = parseInt((e.target as SlInput).value);
                updateColorResult(colorResult, c.hsv);
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

                rangeS.value = c.hsv[1];
                inputS.value = c.hsv[1].toString();
                updateColorResult(colorResult, c.hsv);
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

                rangeS.value = c.hsv[1];
                inputS.value = c.hsv[1].toString();
                updateColorResult(colorResult, c.hsv);
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

                rangeV.value = c.hsv[2];
                inputV.value = c.hsv[2].toString();
                updateColorResult(colorResult, c.hsv);
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

                rangeV.value = c.hsv[2];
                inputV.value = c.hsv[2].toString();
                updateColorResult(colorResult, c.hsv);
                updateCanvas(ctx, indices, colors);
            }

        });

        inputH.value = c.hsv[0].toString();
        rangeS.value = c.hsv[1];
        inputS.value = c.hsv[1].toString();
        rangeV.value = c.hsv[2];
        inputV.value = c.hsv[2].toString();

        updateColorResult(colorResult, c.hsv);
        updateCanvas(ctx, indices, colors);
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
        case "png-1":
            {
                const png = await createPNGPalette(colors, 1);
                download(png, "png");
                break;
            }
        case "png-8":
            {
                const png = await createPNGPalette(colors, 8);
                download(png, "png");
                break;
            }
        case "png-32":
            {
                const png = await createPNGPalette(colors, 32);
                download(png, "png");
                break;
            }
        case "pal":
            const pal = await createJASCPALPalette(colors);
            download(pal, "pal")
            break;
        case "photoshop-ase":
            break;
        case "paint":
            const paint = await createPaintPalette(colors);
            download(paint, "txt");
            break;
        case "gimp":
            const gimp = await createGimpPalette(colors);
            download(gimp, "gpl")
            break;
        case "hex":
            const hex = await createHexPalette(colors);
            download(hex, "hex");
            break;
    }
}


function updateColorResult(el: HTMLDivElement, hsv: HSV) {
    const hsl = ColorConvert.hsv.hsl(hsv[0], hsv[1], hsv[2]);
    el.style.backgroundColor = `hsl(${hsl[0]} ${hsl[1]}% ${hsl[2]}%)`;
}

function createColorIndices(image: HTMLImageElement): {colors: PaletteColor[], indices: number[] }{

    const indices: number[] = [];

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (canvas === null || ctx === null) throw new Error("Canvas/Ctx not initialized");

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

        if (colors.find(c => c[0] === hsv[0] && c[1] === hsv[1] && c[2] === hsv[2]) === undefined) {
            colors.push(hsv);
            if (colors.length > 4) throw new Error("Image contains more colors than 4!");
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

        colorNum = colors.findIndex(c => c[0] === hsv[0] && c[1] === hsv[1] && c[2] === hsv[2]);

        if (colorNum === -1) throw new Error("Failed to create indices array internal");

        indices.push(colorNum + 1);

    }

    const paletteColors: PaletteColor[] =  colors.map((c, idx) => ({ num: idx + 1, hsv: c }));
    return {indices, colors: paletteColors};

}

function updateCanvas(ctx: CanvasRenderingContext2D, indices: number[], colors: PaletteColor[]): void {
    const newPixels = new Uint8ClampedArray(4 * ctx.canvas.width * ctx.canvas.height);

    let paletteColor: PaletteColor | undefined = colors[0];
    let rIdx = 0;

    for (let i = 0; i < indices.length; ++i) {

        paletteColor = colors.find(c => c.num === indices[i]);

        if (paletteColor === undefined) throw new Error("Color not found");

        const rgb = ColorConvert.hsv.rgb(paletteColor.hsv);

        rIdx = i * 4;

        newPixels[rIdx] = rgb[0];
        newPixels[rIdx + 1] = rgb[1];
        newPixels[rIdx + 2] = rgb[2];
        newPixels[rIdx + 3] = 255;
    }

    const imageData = new ImageData(newPixels, ctx.canvas.width, ctx.canvas.height);
    ctx.putImageData(imageData, 0, 0);
}