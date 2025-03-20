import { query } from "./../lib/database"
import { getTable } from "./../cococore/cocopage"
import { getNotionData, DataType } from "./../monad/notionData"
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
export async function test(req: any,res: any,route: any)
{
	let result:any = await getNotionData(DataType.PAGE, "https://candle-stoplight-544.notion.site/1-1b439cbfbab980e9b6ecef87870f30fb");
	
	result.Status = 200;
	
	return result;
}
