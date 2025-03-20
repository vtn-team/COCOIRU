import { getNotionData, getRelatedNotionData, getChildNotionData, createNotionData } from "./notionData"
import { DataType, PagePropertyScheme, WordPropertyScheme, NotePropertyScheme, NotionDBInfo, TableInfo } from "./dataScheme"
import { createNode, createRelationship } from "./../lib/neo4j"

import { getNode } from "./neo4jCache"


//NOTE: neo4jのほうにだけデータがあるという状態は想定しない
export async function openPage(URI: string) {
	//neo4jを検索
	let result = await getNode(DataType.PAGE, URI);
	
	//なかったらnotionを検索
	if(!result) {
		let page = await getNotionData(DataType.PAGE, URI);
		if(page) {
			console.log(page);
			let words = await getRelatedNotionData(DataType.WORD, "RefID", "number", { "equals" : page.ID }, true);
			let notes = await getChildNotionData(page.Child);
			
			result = {
				Page: page,
				Words: words,
				Notes: notes,
			}
		}
	}
	
	//なかったら終了
	if(!result) {
		return result;
	}
	
	//neo4jに登録する
	//NOTE: 裏で登録する
	setTimeout(() => {
		registerNodes(result);
	}, 2000);
	
	return result;
}

async function registerNodes(result: any) {
	let basePage = result.Page;
	basePage.Child = JSON.stringify(basePage.Child);
	basePage.Contents = JSON.stringify(basePage.Contents);
	let baseId = await createNode(DataType.PAGE, basePage);
	
	for(let w of result.Words) {
		w.Link = JSON.stringify(w.Link);
		w.LastEditedBy = JSON.stringify(w.LastEditedBy);
		w.Contents = JSON.stringify(w.Contents);
		let nodeId = await createNode(DataType.WORD, w);
		await createRelationship(baseId, nodeId, DataType.WORD);
	}
	
	for(let n of result.Notes) {
		delete n.URI;
		delete n.Origin;
		delete n.Path;
		n.Contents = JSON.stringify(n.Contents);
		let nodeId = await createNode(DataType.NOTE, n);
		await createRelationship(baseId, nodeId, DataType.NOTE);
	}
}