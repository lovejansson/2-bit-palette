const menuDownload = document.getElementById("menu-download");

menuDownload.addEventListener("sl-select", (e) => {
    downloadPalette(e.detail.item.value);
});


const colors = Array(4).fill(0).map((_, idx) => ({ num: idx + 1, hsv: { h: 125, s: 30, v: idx * 20 + 20 } }));


for (const c of colors) {

    const colorWrapper = document.getElementById(`color-${c.num}`);

    if (colorWrapper === null) throw new Error("Missing DOM: color " + c.num);

    const colorResult = colorWrapper.querySelector(".color-result");
    const inputH = colorWrapper.querySelector(".input-h");

    const inputS = colorWrapper.querySelector(".input-s");
    const rangeS = colorWrapper.querySelector(".range-s");
    const inputV = colorWrapper.querySelector(".input-v");
    const rangeV = colorWrapper.querySelector(".range-v");

    if (colorResult === null || inputH === null || inputS === null || inputV === null || rangeS === null || rangeV === null) throw new Error("Missing DOM: color " + c.num)

    inputH.addEventListener("sl-input", (e) => {
        c.hsv.h = e.target.value;
        updateColorResult(colorResult, c.hsv)
    });


    inputS.addEventListener("sl-input", (e) => {

        if (e.target.value === "") {
            c.hsv.s = 0;
        } else if (e.target.value > 100) {
            c.hsv.s = 100;
        } else {
            c.hsv.s = parseInt(e.target.value);
        }

        rangeS.value = c.hsv.s;
        inputS.value = c.hsv.s;
        updateColorResult(colorResult, c.hsv)

    });

    rangeS.addEventListener("sl-input", (e) => {

        if (e.target.value === "") {
            c.hsv.s = 0;
        } else if (e.target.value > 100) {
            c.hsv.s = 100;
        } else {
            c.hsv.s = parseInt(e.target.value);
        }

        rangeS.value = c.hsv.s;
        inputS.value = c.hsv.s;
        updateColorResult(colorResult, c.hsv)

    });

    inputV.addEventListener("sl-input", (e) => {

        if (e.target.value === "") {
            c.hsv.v = 0;
        } else if (e.target.value > 100) {
            e.target.value = 100;
            c.hsv.v = 100;
        } else {
            c.hsv.v = parseInt(e.target.value);
        }

        rangeV.value = c.hsv.v;
        inputV.value = c.hsv.v;

        updateColorResult(colorResult, c.hsv)
    });

    rangeV.addEventListener("sl-input", (e) => {

        if (e.target.value === "") {
            c.hsv.v = 0;
        } else if (e.target.value > 100) {
            c.hsv.v = 100;
        } else {
            c.hsv.v = parseInt(e.target.value);
        }

        rangeV.value = c.hsv.v;
        inputV.value = c.hsv.v;

        updateColorResult(colorResult, c.hsv)
    });

    inputH.value = c.hsv.h;
    rangeS.value = c.hsv.s;
    inputS.value = c.hsv.s;
    rangeV.value = c.hsv.v;
    inputV.value = c.hsv.v;

    updateColorResult(colorResult, c.hsv)
}

function downloadPalette(format) {
    switch (format) {
        case "png-1":
            break;
        case "png-8":
            break;
        case "png-32":
            break;
        case "pal":
            break;
        case "photoshop-ase":
            break;
        case "paint":
            break;
        case "gimp":
            break;
        case "hex":
            break;
    }
}

function updateColorResult(el, hsv) {
    const hsl = fromHSVtoHSL(hsv)
    el.style.backgroundColor = `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`;
}

function fromHSVtoHSL(hsv) {
    const l = (hsv.v / 100) * (1 - (hsv.s / 100) / 2);

    let s = l === 0 || l === 1 ? 0 : ((hsv.v / 100) - l) / Math.min(l, 1 - l);

    return { h: hsv.h, s: s * 100, l: l * 100 };
}