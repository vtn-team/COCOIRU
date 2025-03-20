import { DataType, PagePropertyScheme, WordPropertyScheme, NotePropertyScheme, NotionDBInfo, TableInfo } from "./dataScheme"
import { getNodeWithRelations } from "./../lib/neo4j"

//対象のNeo4jのデータを返す
export async function getNode(type: DataType, dataKey: string) {
	let info = TableInfo[type];
	let result = await getNodeWithRelations(DataType.PAGE, info.DataKey, dataKey);
	
	if(!result) return null;
	if(result.records.length == 0) return null;
	
	let data = [];
	for(let md of result.records) {
		let db = md.get("monad");
		data.push(db.end);
	}
	
	console.log(data);
	
	return result;
}
