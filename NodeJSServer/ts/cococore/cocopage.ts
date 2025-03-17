import { chatWithSession } from "./../lib/chatgpt"
import { getMaster, getLevel, getGameInfo, getAIRule } from "./../lib/masterDataCache"
import { internalEvent } from "../gameserver/server"
import { query } from "./../lib/database"
import { createPage, getPageProperties, getDatabase, prettyPage } from "./../lib/notion"
const { v4: uuidv4 } = require('uuid')

const axios = require("axios");
const cheerio = require("cheerio");
const { convert } = require("html-to-text");
const jsonpath = require("jsonpath");
const xpath = require("xpath");
const { DOMParser } = require("xmldom");


let extTableId = "1b839cbfbab980b49498f62844cb12b9";
let pageCache:any = [];

function extractUri(url: string) {
	const regex = /https:\/\/(candle-stoplight-544\.notion\.site|www\.notion\.so)(\/[^\?]*)?(?=\?|$)/;
	const match = url.match(regex);
	return match ? match[0] : null;
}

function checkNotionOrigin(url: string, path: string) {
	let ret = false;
	ret ||= (url == "https://candle-stoplight-544.notion.site");
	return ret;
}

export async function getTable(uri: string) {
	const parsedUrl = new URL(uri);
	const origin = parsedUrl.origin;
	const path = parsedUrl.pathname;
	
	const originURI = origin + path;
	
	let table = await searchExtendInfo(originURI);
	if(!table) {
		table = await createExtendInfo(origin, path);
	}
	
	console.log(table);
	
	//まだページキャッシュがなかった時
	if(!pageCache[originURI]) {
		let mainPage = "";
		
		//ページの中身を拾ってくる
		if(checkNotionOrigin(origin, path)) {
			//Notion用の処理
			
		}else{
			
		}
	}
}

async function searchExtendInfo(uri: string) {
	let result = null;
	
	console.log("searchExtendInfo");
	try {
		let prop:any = await getDatabase(extTableId, {
			"property": "URI",
			"title": {
				"contains": uri
			}
		});
	console.log(prop);
		if(prop.length > 0){
			result = prettyPage(prop[0]);
		}
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

async function createExtendInfo(origin: string, path: string) {
	let result = null;
	
	const originURI = origin + path;
	
	console.log("createExtendInfo");
	try {
		let page:any = await createPage({
			"parent": {
				"database_id": extTableId
			},
			"properties": {
				"URI": {
					"title": [
						{
							"text": {
								"content": originURI
							}
						}
					]
				},
				"Origin": {
					"rich_text": [
						{
							"text": {
								"content": origin
							}
						}
					]
				},
				"Path": {
					"rich_text": [
						{
							"text": {
								"content": path
							}
						}
					]
				}
			}
		});
		
	console.log(page);
		result = prettyPage(page);
	}catch(ex){
		console.log(ex);
	}
	
	return result;
}

function getExtendInfo(uri: string) {
	let udid = extractUri(uri);
	if(udid) {
		let prop:any = getPageProperties(udid);
		
		//まだページキャッシュがなかった時
		if(!pageCache[udid]) {
			pageCache = {
				Property: prop
			}
		}
	}
}

//Notionのpageを取得
export function getNotionPage() {

}

//Webページを取得して解析する
export async function getWebPage(uri: string) {
	let result = {
		Title: "",
		Meta: "",
		Body: "",
		CSSList: [],
		JSList: []
	};
	
	try {
		// HTMLを取得
		const { data } = await axios.get(uri, { headers: { "User-Agent": "Mozilla/5.0" } });

		// cheerio で解析
		const $ = cheerio.load(data);

		// タイトル取得
		const title = $("title").text();

		// メタ情報取得
		const description = $('meta[name="description"]').attr("content") || "なし";

		// JSON-LD の解析
		const jsonLD = $("script[type='application/ld+json']").map((i, el) => $(el).html()).get();
		const structuredData = jsonLD.map(json => JSON.parse(json));

		// JSON-LD から特定のデータを抽出（例: @typeが"Article"のもの）
		const articles = jsonpath.query(structuredData, "$..[?(@.@type=='Article')]");

		// プレーンテキスト化
		const text = convert(data, { wordwrap: 130 });

		// XPath解析
		const doc = new DOMParser().parseFromString(data);
		const xTitle = xpath.select("//title/text()", doc).toString();

		// 画像URLの取得
		const images = $("img").map((i, el) => $(el).attr("src")).get();

		// CSS, JSの取得
		const stylesheets = $("link[rel='stylesheet']").map((i, el) => $(el).attr("href")).get();
		const scripts = $("script[src]").map((i, el) => $(el).attr("src")).get();

		// 結果表示
		console.log("タイトル:", title);
		console.log("メタ情報:", description);
		console.log("XPathタイトル:", xTitle);
		console.log("JSON-LD:", structuredData);
		console.log("記事データ:", articles);
		console.log("本文:", text.slice(0, 500), "..."); // 長いので一部だけ表示
		console.log("画像一覧:", images);
		console.log("CSS一覧:", stylesheets);
		console.log("JS一覧:", scripts);
	} catch (error) {
		console.error("エラー:", error.message);
	}
}
