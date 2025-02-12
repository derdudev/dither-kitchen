const canvas = document.querySelector("#view");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

let img;

const scaleSlider = document.getElementById("scale-slider");
const thresholdSlider = document.getElementById("threshold-slider");

scaleSlider.oninput = (e) => {
    update(scaleSlider.value, thresholdSlider.value);
}

thresholdSlider.oninput = (e) => {
    update(scaleSlider.value, thresholdSlider.value);
}

function update(scale, threshold) {
    let scaledWidth = Math.floor(img.width*scale);
    let scaledHeight = Math.floor(img.height*scale);
    let width = scaledWidth;
    let height = scaledHeight;
    if(scaledWidth > 400){
        width = 400;
        height = scaledHeight*400/scaledWidth;
    }
    if(height > 400){
        height = 400;
        width = scaledWidth*400/scaledHeight;
    }
    od_bayer_8(img, width, height, threshold);
}

function upload(){
    const fileUploadInput = document.querySelector("#image-upload");
    const uploadedImage = fileUploadInput.files[0];

    const fileReader = new FileReader();
    fileReader.readAsDataURL(uploadedImage);
    fileReader.onloadend = (e) => {
       //let pixels = new Uint8Array(fileReader.result);
        img = new Image();
       img.src = fileReader.result;
       img.onload = (e) => {
           width = img.width*0.5;
           height = img.height*0.5;
           od_bayer_8(img, width, height);
           scaleSlider.disabled = false;
           thresholdSlider.disabled = false;
       }
    }
}

function od_bayer_8(img, width, height, threshold=64) {
    canvas.setAttribute("width", width*2);
    canvas.setAttribute("height", height*2);
    ctx.drawImage(img, 0, 0, width, height);
    let imageData = ctx.getImageData(0, 0, width, height);
    let pixels = imageData.data;
    makeDitherBayer8(pixels, width, height, threshold);
    imageData.data = pixels;
    createImageBitmap(imageData, {resizeQuality: 'pixelated', resizeWidth: width*2, resizeHeight: height*2})
        .then(r => ctx.drawImage(r, 0,0));
}

let BAYER_PATTERN_8X8 = [
    [	  0, 128,  32, 160,   8, 136,  40, 168	],
    [	192,  64, 224,  96, 200,  72, 232, 104	],
    [	 48, 176,  16, 144,  56, 184,  24, 152	],
    [	240, 112, 208,  80, 248, 120, 216,  88	],
    [	 12, 140,  44, 172,   4, 132,  36, 164	],
    [	204,  76, 236, 108, 196,  68, 228, 100	],
    [	 60, 188,  28, 156,  52, 180,  20, 148	],
    [	252, 124, 220,  92, 244, 116, 212,  84	]
];

function makeDitherBayer8(pixels, width, height, threshold=64) {
    let	col	= 0;
    let	row	= 0;
    let pointer = 0;
    let pixel = 0;

    for(let y = 0; y < height; y++ ) {
        row	= y & 7;		//	% 8;

        for(let x = 0; x < width; x++ ) {
            col	= x & 7;	//	% 8;

            const red = pixels[pointer + x*4 + 0];
            const green	= pixels[pointer + x*4 + 1];
            const blue = pixels[pointer + x*4 + 2];

            let color	= ((red + green + blue)/3 < 1/64*BAYER_PATTERN_8X8[col][row]*threshold ? 0 : 255);

            pixels[pointer + x*4 + 0]	= color;	//	blue
            pixels[pointer + x*4 + 1]	= color;	//	green
            pixels[pointer + x*4 + 2]	= color;	//	red

            if(color === 255){
                pixels[pointer + x*4 + 0]	= 255;	//	blue
                pixels[pointer + x*4 + 1]	= 180;	//	green
                pixels[pointer + x*4 + 2]	= 174;	//	red
            } else {
                pixels[pointer + x*4 + 0]	= 10;	//	blue
                pixels[pointer + x*4 + 1]	= 49;	//	green
                pixels[pointer + x*4 + 2]	= 0;	//	red
            }
        }

        pointer += width*4;
    }
}
