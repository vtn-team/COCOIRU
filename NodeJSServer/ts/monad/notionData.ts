import { chatWithSession } from "./../lib/chatgpt"
import { getMaster, getLevel, getGameInfo, getAIRule } from "./../lib/masterDataCache"
import { internalEvent } from "../gameserver/server"
import { query } from "./../lib/database"
import { createPage, getPageProperties, getDatabase, prettyPage } from "./../lib/notion"
const { v4: uuidv4 } = require('uuid')

export enum DataType {
	PAGE = "PAGE",
	WORD = "WORD",
	NOTE = "NOTE"
}

const PagePropertyScheme:any = [
	{ Name: "Title", Style: "title", Type: "text" },
	{ Name: "Origin", Style: "rich_text", Type: "text" },
	{ Name: "Path", Style: "rich_text", Type: "text" }
];

const WordPropertyScheme:any = [
	{ Name: "Word", Style: "title", Type: "text" },
];

const NotePropertyScheme:any = [
	{ Name: "Title", Style: "title", Type: "text" },
];

type NotionDBInfo = {
	DatabaseId: string;
	KeyName: string;
	UseContents: boolean;
};

let tableInfo:any = {
	PAGE: {
		DatabaseId : "1b839cbfbab980b49498f62844cb12b9",
		DataKey: "URI",
		DataType: "rich_text",
		UseContents: true,
		Scheme: PagePropertyScheme,
	},
	WORD: {
		DatabaseId : "1ba39cbfbab980adaf6bc97edae68811",
		DataKey: "Word",
		DataType: "title",
		UseContents: false,
		Scheme: WordPropertyScheme,
	},
	NOTE: {
		DatabaseId : "ROOT",
		DataKey: "Title",
		DataType: "title",
		UseContents: true,
		Scheme: NotePropertyScheme,
	},
};

//対象のNotionのデータを返す
export async function getNotionData(type: DataType, dataKey: string) {
	let result = null;
	
	console.log("getNotionData");
	
	try {
		let info = tableInfo[type];
		let filter:any = {
			"property": info.DataKey
		};
		filter[info.DataType] = {
			"contains": dataKey
		};
		
		let prop:any = await getDatabase(info.DatabaseId, filter);
		
	console.log(prop);
		if(prop.length > 0){
			result = prettyPage(prop[0]);
		}
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

async function createNotionData(type: DataType, data: any) {
	let result = null;
	
	console.log("createNotionData");
	try {
		let info = tableInfo[type];
		
		let props: any = {};
		for(let d of info.Scheme) {
			props[d.Name] = {};
			props[d.Name][d.Style] = [{}];
			props[d.Name][d.Style][0][d.Type] = { "content" : data[d.Name] };
		}
		
		let page:any = await createPage({
			"parent": {
				"database_id": info.DatabaseId
			},
			"properties": props
		});
		
		console.log(page);
		result = prettyPage(page);
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

async function updateData(uuid: string, data: any) {
	let result = null;
	
	console.log("createExtendInfo");
	
	try {
		//tbd
		//console.log(page);
		//result = prettyPage(page);
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}