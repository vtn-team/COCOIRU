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
	let result:any = await searchFromAI(decodeURIComponent(route.query.word), decodeURIComponent(route.query.category), route.query.depth);
	
	result.Status = 200;
	
	return result;
}

//
export async function registerWord(req: any,res: any,route: any)
{
	let result:any = await registerFromAI(decodeURIComponent(route.query.word), decodeURIComponent(route.query.category), route.query.depth);
	
	result.Status = 200;
	
	return result;
}

//
export async function getCytoscapeData(req: any,res: any,route: any)
{
	let result:any = await diggingKeyword(decodeURIComponent(route.query.word), route.query.depth);
	
	result.Status = 200;
	
	let nodes:Array<any> = [];
	let edges:Array<any> = [];
	nodes.push({ data: result.baseWord });
	for(let w of result.RelayWords) {
		if(w.Word == result.baseWord.Word) continue;
		nodes.push({ data: w });
	}
	
	for(let w of result.RelayWords) {
		if(w.Word == result.baseWord.Word) continue;
		
		edges.push({ data: {
			weight: 1,
			source: result.baseWord.Word, 
			target: w.Word
		}
		});
	}
	
	return {
		elements: {
			nodes: nodes,
			edges: edges
		}
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

/*
  elements: {
      nodes: [
        { data: { id: 'a' } },
        { data: { id: 'b' } },
        { data: { id: 'c' } },
        { data: { id: 'd' } },
        { data: { id: 'e' } }
      ],
      edges: [
        { data: { id: 'a"e', weight: 1, source: 'a', target: 'e' } },
        { data: { id: 'ab', weight: 3, source: 'a', target: 'b' } },
        { data: { id: 'be', weight: 4, source: 'b', target: 'e' } },
        { data: { id: 'bc', weight: 5, source: 'b', target: 'c' } },
        { data: { id: 'ce', weight: 6, source: 'c', target: 'e' } },
        { data: { id: 'cd', weight: 2, source: 'c', target: 'd' } },
        { data: { id: 'de', weight: 7, source: 'd', target: 'e' } }
      ]
    },
*/