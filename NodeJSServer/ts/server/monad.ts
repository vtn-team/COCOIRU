import { query } from "./../lib/database"
import { getTable } from "./../cococore/cocopage"
import { openPage } from "./../monad/monad"
import { convertToMarkdown } from "./../lib/notion"
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
	let page:any = await openPage("https://candle-stoplight-544.notion.site/1-1b439cbfbab980e9b6ecef87870f30fb");
	
	if(page) {
	 	let md = markdown();
		page.Page.Contents = convertToMarkdown(page.Page.Contents);
	 	page.Page.Contents = encodeURIComponent(md.render(page.Page.Contents));
		return {
			Status: 200,
			Page: page,
		}
	}
	else
	{
		return {
			Status: 404,
			Message: "Page Not Found."
		}

	}
}
