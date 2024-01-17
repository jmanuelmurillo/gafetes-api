const Konva = require('konva');
const { jsPDF } = require("jspdf");
const { Image } = require('canvas');
const nodeHtmlToImage = require('node-html-to-image');
const puppeteer = require('puppeteer');

const buildNewBadge = async (gafete, tokens) => {
	var data, pdf;
	const tokenValues = buildTokens(tokens);
	console.log("start");

	if (gafete && Array.isArray(gafete) && gafete.length > 0) {
		console.log("is array");

		for (let pdfPage of gafete) {
			console.log("page", pdfPage);

			data = JSON.parse(pdfPage.Badge_data);

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

						const image = await loadRichText(contentReplaced, attr);
						imageNode.image(image);
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
		data = JSON.parse(gafete.Badge_data);

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

				const image = await loadRichText(contentReplaced, attr);
				imageNode.image(image);
			}
		}
		else {
			var image = await loadImage(imagesAdded[imageId]);
			imageNode.image(image);
		}

		//Build PDF
		var pageWidth = Number(stagePreview.width());
		var pageHeigth = Number(stagePreview.height());
		var ratio = 0.75;
		var pageOrientation = pageWidth > pageHeigth ? 'l' : 'p';

		pdf = new jsPDF(pageOrientation, 'px', [pageWidth, pageHeigth]);

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
	return pdf.output('dataurlstring');
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

const buildTokens = (arr) => {
	var tokens = {};

	for (const token of arr) {
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

const loadRichText = async (content, attr) => {
	const styles = `<style>
		body{
			font-family: Arial, sans-serif;
			font-size: 12px;
			color: #000000;
			line-height: 1.2;
			margin: 0;
			padding: 0;
		}

		.content{ 
			zoom: 3;
		} 

		p {
			margin: 0;
		}

		ol, ul, dl {
			margin-right: 0px;
			padding: 0 20px;
		}
		</style>`;
	return new Promise(async (resolve) => {
		var srcData = await nodeHtmlToImage({
			html: `<html>${styles}<body style="width:${attr.width * 3}px; height: ${attr.height * 3}px;"><div class="content" style="width:${attr.width}px; height: ${attr.height}px;">${content}</div></body></html>`,
			encoding: 'base64',
			transparent: true,
		});

		let img = new Image();
		img.onload = () => resolve(img)
		img.src = 'data:image/png;base64,' + srcData
	});
}

const log = (gafete, tokens) => {
	var data, pdf;
	var log = 'init service';
	const tokenValues = buildTokens(tokens);
	log += " start";

	if (gafete && Array.isArray(gafete) && gafete.length > 0) {
		log += " enter if array";

		for (let pdfPage of gafete) {
			log += " enter array";

			data = JSON.parse(pdfPage.Badge_data);

			const canvasData = data.canvasData;
			const imagesAdded = data.imgData;
			const richTextAdded = data.richTextData;

			/*
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

						const image = await loadRichText(contentReplaced, attr);
						imageNode.image(image);
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
			*/
		}
	}

	log += " finish";

	return log;
}

const buildImage = async () => {

	const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
	const page = await browser.newPage();
	await page.setViewport({
		height: 500,
		width: 500
	});

	const htmlString = `<html><body style="font-size: 16px; font-family: sans-serif; color: red;"><div class="content" style="text-aling: center;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tellus nisi, aliquam eu odio sodales, tincidunt maximus ex. Quisque ac nisi ipsum. Nulla eleifend sed nunc eget consequat. In volutpat leo magna, et rutrum augue imperdiet quis. Aenean laoreet lorem ac justo tempus condimentum. Proin faucibus tortor id sem convallis, interdum commodo risus accumsan. Etiam cursus posuere diam, et rhoncus metus aliquet sit amet. Pellentesque et mi in nisl sagittis efficitur volutpat et metus. Sed leo sem, mattis suscipit condimentum id, tristique non tellus.</div></body></html>`;

	//if your HTML is in memory (as a string), you load it like this:
	page.setContent(htmlString);

	const imageBuffer = await page.screenshot({});
	// convert to base64 string if you want to:
	return imageBuffer.toString('base64');
}

module.exports = {
	buildNewBadge,
	log,
	buildImage
}