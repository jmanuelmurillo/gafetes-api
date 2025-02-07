const Konva = require('konva');
const { jsPDF } = require("jspdf");
const { Image } = require('canvas');
const https = require('https');
const puppeteer = require('puppeteer');

const buildNewBadge = async (gafete, tokens, upload, eventName, userIdentifier) => {
	var data, pdf;
	const tokenValues = buildTokens(tokens);

	if (gafete && Array.isArray(gafete) && gafete.length > 0) {
		for (let pdfPage of gafete) {
			if (pdfPage.hasOwnProperty('badge_data')) {
				data = JSON.parse(pdfPage.badge_data);
			}
			else if (pdfPage.hasOwnProperty('Badge_data')) {
				data = JSON.parse(pdfPage.Badge_data);
			}
			else {
				return {
					"status": "error",
					"message": "There is no badges data"
				}
			}

			const canvasData = data.canvasData;
			const imagesAdded = data.imgData;
			const richTextAdded = data.richTextData;

			stagePreview = Konva.Node.create(canvasData);

			//Load and replace text/token
			var textNodes = stagePreview.find('Text');
			for (const textNode of textNodes) {
				if (textNode.name() == 'token') {
					textNode.text(tokenValues[textNode.text()]);
				}
				else {
					var str = textNode.text();
					var strReplaced = searchAndReplaceTokens(str, tokenValues);
					textNode.text(strReplaced);
				}
			}

			//Load images
			var imageNodes = stagePreview.find('Image');
			for (const imageNode of imageNodes) {
				var imageId = imageNode.name();

				if (imageNode.name() == 'qr') {
					var imageQR = await loadImage(tokenValues['${qr}']);
					imageNode.image(imageQR);
				}
				else if (imageNode.name() == 'richText') {
					var rtId = imageNode.getId();

					if (richTextAdded[rtId]) {
						var content = richTextAdded[rtId];
						var contentReplaced = searchAndReplaceTokens(content, tokenValues);

						var attr = {
							width: imageNode.width() * imageNode.scaleX(),
							height: imageNode.height() * imageNode.scaleY()
						}

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
				}
				else {
					var image = await loadImage(imagesAdded[imageId]);
					imageNode.image(image);
				}
			}

			//Build PDF
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
		}
	}

	if (upload) {
		const base64Pdf = Buffer.from(pdf.output('arraybuffer')).toString('base64');
		const pdfUrl = await upload2GoogleCloud(base64Pdf, eventName, userIdentifier);
		return {
			"status": "success",
			"url": pdfUrl
		};
	}
	else {
		var base64Pdf = pdf.output('dataurlstring');
		return {
			"status": "success",
			"file": base64Pdf
		};
	}
}

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
}

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
}

const buildTokens = (arr) => {
	var tokens = {};
	var newArr = normalizeJSON(arr);

	for (const token of newArr) {
		tokens[token.key] = token.value ? token.value : " ";
	}
	return tokens;
}

const loadImage = (data) => {
	return new Promise((resolve) => {
		let img = new Image();
		img.onload = () => resolve(img)
		img.src = data
	});
}

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
			paddgin: 0;
		}

		ol, ul, dl {
			margin-right: 0px;
			padding: 0 20px;
		}
		</style>`;

	return new Promise(async (resolve) => {
		try {
            const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
            const page = await browser.newPage();
            await page.setViewport({
                height: Math.ceil(attr.width),
                width: Math.ceil(attr.height)
            });

            const htmlString = `<html><head>${styles}</head><body><div class="content">${content}</div></body></html>`;
            await page.setContent(htmlString);
			
            const imageBuffer = await page.screenshot({ encoding: "base64" });
            const srcData = imageBuffer.toString('base64');
            const base64Image = `data:image/png;base64,${srcData}`;
			
            let imag = new Image();
            imag.onload = () => {
                resolve(imag);
            };
            imag.onerror = (error) => {
                console.error('Error loading image:', error);
                reject(error);
            };
            imag.src = base64Image;
        } catch (error) {
            console.error('Error in buildImageFromHTML:', error);
            reject(error);
        }
	});
}

const upload2GoogleCloud = (fileBase64, eventName, userIdentifier) => {
	const cloudApiKey = 'VW1HWEx0K2lBUUVUZG96UzhUVkJiOFREYWs3Sm1Kamk4OVRLOWw2TkMwND0=';

	return new Promise((resolve, reject) => {
		let data = '';

		const options = {
			hostname: 'apigoogle.btcamericastech.com',
			path: '/GoogleCloudUploader/UploadFile',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'CloudApiKey': cloudApiKey
			}
		};
		const bodyData = {
			areaName: 1,
			systemName: 'badges',
			eventName: eventName,
			userIdentifier: userIdentifier,
			cacheControl: "public, max-age=0, no-transform",
			fileName: (new Date().getTime()).toString(36) + '-Gafete.pdf',
			fileType: 1,
			fileBytes: fileBase64
		};

		const request = https.request(options, (response) => {
			response.setEncoding('utf8');
			response.on('data', (chunk) => {
				data += chunk;
			});

			response.on('end', () => {
				const resp = JSON.parse(data);
				resolve(resp.fileCompleteURI);
			});
		});

		// Convertimos el body en un json y se envia.
		request.write(JSON.stringify(bodyData));

		// Si hay errores se muestra un consoleLog
		request.on('error', (error) => {
			reject(error);
		});

		// End request
		request.end();
	});
};

module.exports = {
	buildNewBadge,
	buildImageFromHTML
}