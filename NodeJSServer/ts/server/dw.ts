import { query } from "./../lib/database"
import { searchFromAI, registerFromAI, diggingKeyword } from "./../vclogic/vcSearch"
const { v4: uuidv4 } = require('uuid')
const fs = require('fs').promises;

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
	
	console.log(result);
	if(result.Success == false) {
		await registerFromAI(decodeURIComponent(route.query.word), decodeURIComponent(route.query.category), route.query.depth);
		return result;
	}
	
	result.Status = 200;
	
	let nodes:Array<any> = [];
	let edges:Array<any> = [];
	for(let w of result.RelayWords) {
		if(w.Word == result.baseWord.Word) continue;
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
