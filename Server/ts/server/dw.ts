import { query } from "./../lib/database"
import { getTable } from "./../cococore/cocopage"
import { searchFromAI, registerFromAI, diggingKeyword } from "./../vclogic/vcSearch"
const { v4: uuidv4 } = require('uuid')
const fs = require('fs').promises;
const markdown = require('markdown-it');

//デフォルト関数
export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

//
export async function searchWord(req: any,res: any,route: any)
{
	let result:any = await registerFromAI(decodeURIComponent(route.query.word), decodeURIComponent(route.query.category), route.query.depth);
	
	result.Status = 200;
	
	return result;
}

//
export async function getCytoscapeData(req: any,res: any,route: any)
{
	let result:any = await diggingKeyword(decodeURIComponent(route.query.word), route.query.depth);
	let md = markdown();
	
	if(result.Success == false) {
		await registerFromAI(decodeURIComponent(route.query.word), decodeURIComponent(route.query.category), route.query.depth);
		return result;
	}
	
	result.Status = 200;
	result.baseWord.Result = md.render(result.baseWord.Result);
	for(let kw of result.baseWord.Relations) {
		result.baseWord.Result = result.baseWord.Result.replaceAll(kw, `<a href="#" class="keyword-link" data-action="${kw}")>${kw}</a>`)
		result.baseWord.Result = result.baseWord.Result.replaceAll("\n", "<br />")
	}
	result.baseWord.Result = encodeURIComponent(result.baseWord.Result)
	
	let nodes:Array<any> = [];
	let edges:Array<any> = [];
	for(let w of result.RelayWords) {
		if(w.Word == result.baseWord.Word) continue;
		
		w.Result = md.render(w.Result);
		for(let kw of w.Relations) {
			w.Result = w.Result.replaceAll(kw, `<a href="#" class="keyword-link" data-action="${kw}")>${kw}</a>`)
			w.Result = w.Result.replaceAll("\n", "<br />")
		}
		w.Result = encodeURIComponent(w.Result)
		nodes.push(w);
	}
	
	return {
		center: result.baseWord,
		nodes: nodes
	}
}

export async function web(req: any,res: any,route: any)
{
	const text = await fs.readFile(__dirname+"/../../../Web/graph.html");
	return {
		statusCode: 200,
		type: 'text/html',
		html: text.toString()
	}
}

export async function web2(req: any,res: any,route: any)
{
	const URI = decodeURIComponent(route.query.URI);
	const text = await getTable(URI);
	return {
		statusCode: 200,
		URI: URI
	}
}
