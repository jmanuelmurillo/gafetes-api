const Konva = require('konva');
const { jsPDF } = require("jspdf");
const { Image, registerFont } = require('canvas');
const https = require('https');
const puppeteer = require('puppeteer');

registerFont('./src/fonts/arial.ttf', { family: 'Arial' });
registerFont('./src/fonts/cour.ttf', { family: 'Courier New' });
registerFont('./src/fonts/comic.ttf', { family: 'Comic Sans MS' });
registerFont('./src/fonts/GARA.TTF', { family: 'Garamond' });
registerFont('./src/fonts/georgia.ttf', { family: 'Georgia' });
registerFont('./src/fonts/l_10646.ttf', { family: 'Lucida Sans Unicode' });
registerFont('./src/fonts/tahoma.ttf', { family: 'Tahoma' });
registerFont('./src/fonts/times.ttf', { family: 'Times New Roman' });
registerFont('./src/fonts/trebuc.ttf', { family: 'Trebuchet MS' });
registerFont('./src/fonts/verdana.ttf', { family: 'Verdana' });
registerFont('./src/fonts/BRUSHSCI.TTF', { family: 'Brush Script MT' });

const buildNewBadge = async (gafete, tokens, upload, eventId, participantId, environment) => {
    try {
        var data, pdf;
        const tokenValues = buildTokens(tokens);

        if (gafete && Array.isArray(gafete) && gafete.length > 0) {
            for (let pdfPage of gafete) {
                if (pdfPage.hasOwnProperty('badge_data')) {
                    data = JSON.parse(pdfPage.badge_data);
                } else if (pdfPage.hasOwnProperty('Badge_data')) {
                    data = JSON.parse(pdfPage.Badge_data);
                } else {
                    return {
                        "status": "error",
                        "message": "There is no badges data"
                    };
                }
                const canvasData = removeQuotesFromDimensions(data.canvasData);
                const imagesAdded = data.imgData;
                const richTextAdded = data.richTextData;

                stagePreview = Konva.Node.create(canvasData);

                // Load and replace text/token
                var textNodes = stagePreview.find('Text');
                for (const textNode of textNodes) {
                    if (textNode.name() == 'token') {
                        textNode.text(tokenValues[textNode.text()]);
                    } else {
                        var str = textNode.text();
                        var strReplaced = searchAndReplaceTokens(str, tokenValues);
                        textNode.text(strReplaced);
                    }
                }

                // Load images
                var imageNodes = stagePreview.find('Image');
                for (const imageNode of imageNodes) {
                    var imageId = imageNode.name();

                    if (imageNode.name() == 'qr') {
                        var imageQR = await loadImage(tokenValues['${qr}']);
                        imageNode.image(imageQR);
                    } else if (imageNode.name() == 'richText') {
                        var rtId = imageNode.getId();

                        if (richTextAdded[rtId]) {
                            var content = richTextAdded[rtId];
                            var contentReplaced = searchAndReplaceTokens(content, tokenValues);

                            var attr = {
                                width: imageNode.width() * imageNode.scaleY(),
                                height: imageNode.height() * imageNode.scaleX()
                            };

                            try {
                                const image = await buildImageFromHTML(contentReplaced, attr);
                                imageNode.image(image);
                            } catch (error) {
                                console.error('Error building image from HTML:', error);
                                return {
                                    "status": "error",
                                    "message": "Error building image from HTML"
                                };
                            }
                        }
                    } else {
                        var image = await loadImage(imagesAdded[imageId]);
                        imageNode.image(image);
                    }
                }

                // Build PDF
                var pageWidth = Number(stagePreview.width());
                var pageHeigth = Number(stagePreview.height());
                var ratio = 1;
                var pageOrientation = pageWidth > pageHeigth ? 'l' : 'p';

                if (!pdf) {
                    pdf = new jsPDF(pageOrientation, 'px', [pageWidth, pageHeigth]);
                } else {
                    pdf.addPage([pageWidth, pageHeigth], pageOrientation);
                }

                // then put image on top of texts (so texts are not visible)
                pdf.addImage(
                    stagePreview.toDataURL({ pixelRatio: 2 }),
                    'png',
                    0,
                    0,
                    pageWidth * ratio,
                    pageHeigth * ratio
                );
            }
        } else {
            return {
                "status": "error",
                "message": "There is no badges data"
            };
        }

        if (upload) {
            const base64Pdf = Buffer.from(pdf.output('arraybuffer')).toString('base64');
            const pdfUrl = await upload2GoogleCloud(base64Pdf, eventId, participantId, environment);
            return {
                "status": "success",
                "url": pdfUrl
            };
        } else {
            var base64Pdf = pdf.output('dataurlstring');
            return {
                "status": "success",
                "file": base64Pdf
            };
        }
    } catch (error) {
        console.error('Error in buildNewBadge:', error);
        return {
            "status": "error",
            "message": "An error occurred while building the badge"
        };
    }
};

const searchAndReplaceTokens = (str, tokenValues) => {
    const tokenRegEx = /\$\{\w+\}/g;
    const matches = str.match(tokenRegEx);

    if (matches) {
        matches.forEach((tkn) => {
            if (tokenValues[tkn]) {
                str = str.replaceAll(tkn, tokenValues[tkn]);
            }
        });
    }

    return str;
};

const normalizeJSON = (jsonObj) => {
    if (typeof jsonObj === 'object') {
        if (Array.isArray(jsonObj)) {
            return jsonObj.map(elemento => normalizeJSON(elemento));
        } else {
            const newObj = {};
            for (const clave in jsonObj) {
                if (jsonObj.hasOwnProperty(clave)) {
                    const newKey = clave.toLowerCase();
                    const newValue = normalizeJSON(jsonObj[clave]);
                    newObj[newKey] = newValue;
                }
            }
            return newObj;
        }
    } else {
        return jsonObj;
    }
};

const buildTokens = (arr) => {
    var tokens = {};
    var newArr = normalizeJSON(arr);

    for (const token of newArr) {
        tokens[token.key] = token.value ? token.value : " ";
    }
    return tokens;
};

const loadImage = (data) => {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (error) => {
            console.error('Error loading image:', error);
            reject(error);
        };
        img.src = data;
    });
};

const buildImageFromHTML = async (content, attr) => {
    const styles = `<style>
        body{
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000000;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }

        p {
            margin: 0;
            padding: 0;
        }

        ol, ul, dl {
            margin-right: 0px;
            padding: 0 20px;
        }

        .content{
            overflow: hidden;
        }
        </style>`;

    return new Promise(async (resolve, reject) => {
        let browser;
        try {
            console.log('Launching Puppeteer...');
            browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
            console.log('Puppeteer launched.');

            const page = await browser.newPage();

            await page.setViewport({
                height: Math.ceil(attr.width),
                width: Math.ceil(attr.height),
                deviceScaleFactor: 2
            });

            const htmlString = `<html><head>${styles}</head><body><div class="content">${content}</div></body></html>`;
            await page.setContent(htmlString);
            console.log('Content set.');

            const imageBuffer = await page.screenshot({ encoding: 'base64', omitBackground: true, captureBeyondViewport: false });
            console.log('Screenshot taken.');

            const srcData = imageBuffer.toString('base64');
            const base64Image = `data:image/png;base64,${srcData}`;

            let img = new Image();
            img.onload = async () => {
                await browser.close();
                console.log('Image loaded & Puppeteer browser closed.');
                resolve(img);
            };
            img.onerror = async (error) => {
                console.error('Error loading image:', error);
                await browser.close();
                console.log('Error & Puppeteer browser closed.');
                reject(error);
            };
            img.src = base64Image;
        } catch (error) {
            console.error('Error in buildImageFromHTML:', error);
            if (browser) {
                await browser.close();
                console.log('Puppeteer browser closed.');
            }
            reject(error);
        }
    });
};

const upload2GoogleCloud = (fileBase64, eventId, participantId, environment) => {
    const CLOUDAPIKEY = process.env.CloudApiKey || '';

    return new Promise((resolve, reject) => {
        let data = '';
        var filename = eventId + '-' + participantId + '-' + (new Date().getTime()).toString(36) + '.pdf';

        const options = {
            hostname: 'apigoogle.btcamericastech.com',
            path: '/GoogleCloudUploader/UploadFile',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CloudApiKey': CLOUDAPIKEY
            }
        };
        const bodyData = {
            areaName: 1,
            systemName: 'badges',
            eventName: environment,
            userIdentifier: eventId,
            cacheControl: "public, max-age=0, no-transform",
            fileName: filename,
            fileType: 1,
            fileBytes: fileBase64
        };

        const request = https.request(options, (response) => {
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const resp = JSON.parse(data);
                    resolve(resp.fileCompleteURI);
                } catch (error) {
                    console.error('Error parsing response from Google Cloud:', error);
                    reject(error);
                }
            });
        });

        // Convertimos el body en un json y se envia.
        request.write(JSON.stringify(bodyData));

        // Si hay errores se muestra un consoleLog
        request.on('error', (error) => {
            console.error('Error in upload2GoogleCloud:', error);
            reject(error);
        });

        // End request
        request.end();
    });
};

const removeQuotesFromDimensions = (jsonString) => {
    return jsonString.replace(/"width":"(\d+(\.\d+)?)"/g, '"width":$1')
                     .replace(/"height":"(\d+(\.\d+)?)"/g, '"height":$1');
};

module.exports = {
    buildNewBadge,
    buildImageFromHTML
};