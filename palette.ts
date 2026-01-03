import ColorConvert, { type HSV } from 'color-convert';

type PaletteColor = {
    num: number;
    hsv: HSV,
}

async function createPNGPalette(colors: PaletteColor[], size: number): Promise<Blob> {

    const canvas = document.createElement("canvas");
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

    if (!ctx) throw new Error("ctx is null");

    canvas.width = size * colors.length;
    canvas.height = size;
    ctx.strokeStyle = "black";

    for (const c of colors) {
        const hsl = ColorConvert.hsv.hsl(c.hsv[0], c.hsv[1], c.hsv[2])
        ctx.fillStyle = `hsl(${hsl[0]} ${hsl[1]}% ${hsl[2]}%)`;
        ctx.fillRect((c.num - 1) * size, 0, size, size);
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob === null) {
                reject()
            } else {
                resolve(blob);
            }
        });
    })
}


async function createHexPalette(colors: PaletteColor[]): Promise<Blob> {

    let content = "";

    for (const c of colors) {
        content += ColorConvert.hsv.hex(c.hsv[0], c.hsv[1], c.hsv[2]) + "\n";
    }

    const blob = new Blob([content], { type: "text/plain" })

    return blob;

}


async function createPaintPalette(colors: PaletteColor[]): Promise<Blob> {

    let content = "";

    for (const c of colors) {
        content += "FF" + ColorConvert.hsv.hex(c.hsv[0], c.hsv[1], c.hsv[2]) + "\n";
    }

    const blob = new Blob([content], { type: "text/plain" })

    return blob;

}


async function createGimpPalette(colors: PaletteColor[]): Promise<Blob> {

    let content = `GIMP Palette\nName: My 2-bit color palette\n`;

    for (const c of colors) {
        const rgb = ColorConvert.hsv.rgb(c.hsv[0], c.hsv[1], c.hsv[2]);
        content += `${rgb[0]}   ${rgb[1]}   ${rgb[2]}   ${"color " + c.num}\n`
    }

    const blob = new Blob([content], { type: "text/plain" })

    return blob;


}

async function createJASCPALPalette(colors: PaletteColor[]): Promise<Blob> {

    let content = `JASC-PAL\n0100\n4\n`;

    for (const c of colors) {
        const rgb = ColorConvert.hsv.rgb(c.hsv[0], c.hsv[1], c.hsv[2]);
        content += `${rgb[0]}   ${rgb[1]}   ${rgb[2]}\n`
    }

    const blob = new Blob([content], { type: "text/plain" });

    return blob;

}

export { type PaletteColor, createGimpPalette, createJASCPALPalette, createPaintPalette, createHexPalette, createPNGPalette }