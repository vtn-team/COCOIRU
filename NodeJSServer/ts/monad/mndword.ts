import { DataType, PagePropertyScheme, WordPropertyScheme, NotePropertyScheme, NotionDBInfo, TableInfo } from "./dataScheme"
import { getNotionData, createNotionData } from "./notionData"
const { v4: uuidv4 } = require('uuid')


//NOTE: neo4jのほうにだけデータがあるという状態は想定しない
export async function openPage(URI: string) {
	//let result = getNode(DataType.PAGE, "URI", URI);
	
	
}

