const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid')

export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

export async function web(req: any,res: any,route: any)
{
	const text = await fs.readFile(__dirname+"/../../../Web/index.html");
	return {
		statusCode: 200,
		type: 'text/html',
		html: text.toString()
	}
}

export async function webDev(req: any,res: any,route: any)
{
	const text = await fs.readFile(__dirname+"/../../../Web/debug.html");
	return {
		statusCode: 200,
		type: 'text/html',
		html: text.toString()
	}
}

export async function manifest(req: any,res: any,route: any)
{
	const text = await fs.readFile(__dirname+"/../../../Web/manifest.json");
	return {
		statusCode: 200,
		type: 'application/json',
		html: text.toString()
	}
}

export async function serviceworker(req: any,res: any,route: any)
{
	const text = await fs.readFile(__dirname+"/../../../Web/serviceworker.js");
	return {
		statusCode: 200,
		type: 'text/javascript',
		html: text.toString()
	}
}

export async function animejs(req: any,res: any,route: any)
{
	const text = await fs.readFile(__dirname+"/../../../Web/anime.min.js");
	return {
		statusCode: 200,
		type: 'text/javascript',
		html: text.toString()
	}
}

export async function bg(req: any,res: any,route: any)
{
	const image = await fs.readFile(__dirname+"/../../../Web/bg.jpg");
	return {
		statusCode: 200,
		type: 'image/jpeg',
		html: image
	}
}

export async function uuid(req: any,res: any,route: any)
{
	return {
		statusCode: 200,
		text: uuidv4()
	}
}

