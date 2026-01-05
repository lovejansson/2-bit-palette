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


function createHexPalette(colors: PaletteColor[]): Blob {

    let content = "";

    for (const c of colors) {
        content += ColorConvert.hsv.hex(c.hsv[0], c.hsv[1], c.hsv[2]) + "\n";
    }

    const blob = new Blob([content], { type: "text/plain" })

    return blob;

}


function createPaintPalette(colors: PaletteColor[]): Blob {

    let content = "";

    for (const c of colors) {
        content += "FF" + ColorConvert.hsv.hex(c.hsv[0], c.hsv[1], c.hsv[2]) + "\n";
    }

    const blob = new Blob([content], { type: "text/plain" })

    return blob;

}


function createGimpPalette(colors: PaletteColor[]): Blob {

    let content = `GIMP Palette\nName: My 2-bit color palette\n`;

    for (const c of colors) {
        const rgb = ColorConvert.hsv.rgb(c.hsv[0], c.hsv[1], c.hsv[2]);
        content += `${rgb[0]}   ${rgb[1]}   ${rgb[2]}   ${"color " + c.num}\n`
    }

    const blob = new Blob([content], { type: "text/plain" })

    return blob;


}

function createJASCPALPalette(colors: PaletteColor[]): Blob {

    let content = `JASC-PAL\n0100\n4\n`;

    for (const c of colors) {
        const rgb = ColorConvert.hsv.rgb(c.hsv[0], c.hsv[1], c.hsv[2]);
        content += `${rgb[0]}   ${rgb[1]}   ${rgb[2]}\n`
    }

    const blob = new Blob([content], { type: "text/plain" });

    return blob;

}

function concatBytes(...arrays: Uint8Array[]) {
    const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Uint8Array(totalLength);

    let offset = 0;

    for (const a of arrays) {
        result.set(a, offset);
        offset += a.length;
    }

    return result;
}



function encodeUTF16BE(str: string): Uint8Array {
    const buffer = new Uint8Array(str.length * 2 + 2); // +2 for null terminator

    for (let i = 0; i < str.length; i++) {

        const codeUnit = str.charCodeAt(i);

        // codeUnit is 16bit so we split it into two to store each part in the buffer which stores 8bits for each element

        buffer[i * 2] = (codeUnit >> 8) & 0xff; // high byte, we & with 0xff (00000000 11111111) to make sure that we only keep the last 8 bits
        buffer[i * 2 + 1] = codeUnit & 0xff;        // low byte, we & with 0xff (00000000 11111111) to make sure that we only keep the last 8 bits

    }

    return buffer;
}

function createAsePalette(colors: PaletteColor[]): Blob {

    const parts: Uint8Array[] = [];

    // First part is the header of the ase file containging [ASEF][version major][version minor][block count]

    parts.push(new TextEncoder().encode("ASEF"));

    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);

    view.setUint16(0, 1, false); // Major version 1
    view.setUint16(2, 0, false); // Minor version 0
    view.setUint32(4, colors.length, false); // Block count 4 since we have 4 colors

    parts.push(new Uint8Array(buf));

    // Now add the color blocks for the colors

    /**
     *  [block type]        uint16   2 bytes   = 0x0001
        [block length]      uint32   4 bytes   = size of block data ONLY

        ┌─ Block data ────────────────────────────────────────────────┐
        │ [name length]     uint16   2 bytes   = UTF-16 code units (+1)│
        │ [name]            UTF-16BE variable  = includes null terminator
        │ [color model]     ASCII    4 bytes   = "RGB "
        │ [R value]         float32  4 bytes   = 0.0 – 1.0
        │ [G value]         float32  4 bytes   = 0.0 – 1.0
        │ [B value]         float32  4 bytes   = 0.0 – 1.0
        │ [color type]      uint16   2 bytes   = 0 | 1 | 2
        └─────────────────────────────────────────────────────────────┘
    */


    for (const c of colors) {

        const name = encodeUTF16BE(`color${c.num}`);
        let offset = 0;
        const blockDataSize =
            2 +
            name.length +
            4 +
            12 +
            2;

        const blockSize = 2 + 4 + blockDataSize;

        const buffer = new ArrayBuffer(blockSize);
        const view = new DataView(buffer);
        const bytes = new Uint8Array(buffer);

        
        view.setUint16(offset, 1, false);
        offset += 2;
        view.setUint32(offset, blockDataSize, false);
        offset += 4;
        view.setUint16(offset, name.length / 2, false);
        offset += 2;
        bytes.set(name, offset);
        offset += name.length;
        const rgbModel = new TextEncoder().encode("RGB ");
        bytes.set(rgbModel, offset);
        offset += 4;

        const [r, g, b] = ColorConvert.hsv.rgb(c.hsv);

        view.setFloat32(offset, r / 255, false);
        offset += 4;
        view.setFloat32(offset, g / 255, false);
        offset += 4;
        view.setFloat32(offset, b / 255, false);
        offset += 4;
        view.setUint16(offset, 0, false);

        parts.push(bytes);
    }

    return new Blob([concatBytes(...parts)], { type: "application/octet-stream" });
}

export { type PaletteColor, createGimpPalette, createJASCPALPalette, createPaintPalette, createHexPalette, createPNGPalette, createAsePalette }