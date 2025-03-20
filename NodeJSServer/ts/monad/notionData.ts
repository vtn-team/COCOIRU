import { DataType, PagePropertyScheme, WordPropertyScheme, NotePropertyScheme, NotionDBInfo, TableInfo } from "./dataScheme"
import { createPage, getPageProperties, getDatabase, getContents, prettyPageProperty, convertToMarkdown } from "./../lib/notion"
const { v4: uuidv4 } = require('uuid')

//対象のNotionのデータを返す
export async function getNotionData(type: DataType, dataKey: string) {
	let result = null;
	
	console.log("getNotionData");
	
	try {
		let info = TableInfo[type];
		let data:any = await getRelatedNotionData(type, info.DataKey, info.DataType, { "contains": dataKey }, info.UseContents);
		if(data.length > 0){
			result = data[0];
		}
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

//対象のNotionのデータを返す
export async function getRelatedNotionData(type: DataType, fkeyName: string, fKeyType: string, fKeyValue: any, useContents: boolean) {
	let result = null;
	
	console.log("getRelatedNotionData");
	
	try {
		let info = TableInfo[type];
		let filter:any = {
			"property": fkeyName
		};
		filter[fKeyType] = fKeyValue;
		
		console.log(filter)
		
		let prop:any = await getDatabase(info.DatabaseId, filter);
		if(prop.length > 0){
			result = [];
			for(let d of prop) {
				let data = prettyPageProperty(d);
				if(useContents) {
					let contents:any = await getContents(d.id);
					data.Contents = contents;
				}
				result.push(data);
			}
		}
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

//対象のNotionのデータを返す
export async function getChildNotionData(childIds: Array<string>) {
	let result = [];
	
	console.log("getChildNotionData");
	
	try {
		for(let id of childIds) {
			let prop:any = await getDatabase(id);
			let contents = await getContents(id);
			if(!contents) continue;
			if(contents.length == 0) continue;
			
			prop.Contents = contents;
			result.push(prop);
		}
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

export async function createNotionData(type: DataType, data: any) {
	let result = null;
	
	console.log("createNotionData");
	try {
		let info = TableInfo[type];
		
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
		result = prettyPageProperty(page);
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

export async function updateData(uuid: string, data: any) {
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