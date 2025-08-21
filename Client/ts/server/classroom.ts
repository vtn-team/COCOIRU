import { query } from "./../lib/database"
import { getTable } from "./../cococore/cocopage"
import { searchFromAI, registerFromAI, diggingKeyword } from "./../vclogic/vcSearch"
import { createPage, getPageProperties, getDatabase, getContents, prettyPageProperty, convertToMarkdown } from "./../lib/notion"
const { v4: uuidv4 } = require('uuid')
const fs = require('fs').promises;
const markdown = require('markdown-it');

//デフォルト関数
export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

export async function main(req: any,res: any,route: any)
{
	const text = await fs.readFile(__dirname+"/../../view/classroom.html");
	return {
		statusCode: 200,
		type: 'text/html',
		html: text.toString()
	}
}

//
export async function usercreate(req: any,res: any,route: any)
{
	let name = route.query.UserName;
	let className = route.query.ClassName;
	let weekTime = route.query.WeekTime;
	let githubLink = route.query.GithubLink;
	
	let result = {
		url: ""
	};
	try {
		let props: any = {};
		let page:any = await createPage({
			"parent": {
				"database_id": "19739cbfbab980058532cdce9a051ea8"
			},
			"properties": {
				"タイトル": { "title": [{ "text": { "content": "ゲーム制作授業用ページ" } }] },
				"名前": { "rich_text": [{ "text": { "content": name } }] },
				"週に動ける時間": { "rich_text": [{ "text": { "content": weekTime } }] },
				"クラス": { select: { name: className } },
				"Githubのリンク": { url: githubLink },
			}
		});
		
		console.log(page);
		result.url = page.url;
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}
