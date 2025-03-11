import { chat, chatWithModel } from "./../lib/chatgpt"
import { getAIRule } from "./../lib/masterDataCache"
import { createNode, getKeywords, createRelationship, deepSearch, deepSearchKeywordOnly, getKeywordsAny } from "./../lib/neo4j"
import { query } from "./../lib/database"
import { internalEvent } from "../gameserver/server"


function prettyInfo(key: string, dbRecord: any) {
	let result:any = {};
	let info = dbRecord.get(key);
	if(!info) return result;
	if(info.start && info.end) {
		info = info.end;
	}
	
	result.Word = info.properties.Word;
	result.Category = info.properties.Category;
	result.Summary = info.properties.Summary;
	result.Result = info.properties.Result;
	result.Relations = info.properties.RelationWords;
			
	return result;
}

async function diggingDeep(result: any, depth: number = 0) {
	for(let i=0; i<result.Relations.length; ++i) {
		await digWords(result.Relations[i], result.Category, depth, result.Word);
		
		//DGSにイベントリレー
		internalEvent({
			API: "digWordDeep",
			WordInfo: result
		});
	}
}

export async function diggingKeyword(word: string, depth: number) {
	let result:any = {
		Success: false,
	};
	
	try {
		let baseWord = await getKeywordsAny(word);
		if(baseWord.records.length == 0) return result;
		
		let relay = await deepSearchKeywordOnly(word, depth);
		result.baseWord = prettyInfo("k", baseWord.records[0]);
		result.RelayWords = [];
		for(let r of relay.records) {
			result.RelayWords.push(prettyInfo("kw", r));
		}
		result.Success = true;
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}

export async function searchFromAI(word: string, category: string, depth: number) {
	let result:any = {
		Success: false,
	};
	
	try {
		console.log(word)
		console.log(category)
		let baseWord = await getKeywords(word, category);
		if(baseWord.records.length == 0) return result;
		
		let relay = await deepSearch(word, category, depth);
		result.baseWord = prettyInfo("k", baseWord.records[0]);
		result.RelayWords = [];
		for(let r of relay.records) {
			result.RelayWords.push(prettyInfo("kw", r));
		}
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}

async function digWords(word: string, category: string, depth: number = 0, fromKeyword: string = "") {
	try {
		let result:any = {};
		
		let dbData = await getKeywords(word, category);
		if(dbData.records.length > 0) {
			result = prettyInfo("k", dbData.records[0]);
			result.Success = true;
			
			//fromKeywordがある場合リレーションを作る
			if(fromKeyword != "") {
				await createRelationship(fromKeyword, word, 'keyword');
			}
			
			//深堀調査
			if(depth > 0) {
				diggingDeep(result, depth-1);
			}
			return result;
		}
		
		
		let prompt = `
入力された単語について、わかりやすい形でどういうものか詳細に教えてください。500～2000字あるとよいと思います。
その後、内容を50～200文字程度に要約してください。
出力は全てmarkdownテキストでお願いします。

# 入力値
単語：${word}
カテゴリ: ${category}

# 出力値(JSON)
{
	"Summary": "要約(markdown)",
	"Result": "説明(markdown)",
}`;

		let qs:any = await chatWithModel("o3-mini", prompt);
		let qsResult = qs.content;
		let baseJson = JSON.parse(qsResult);
		
		prompt = `
# 指示
あなたが当該の単語や関連情報をを知らない初心者だとして、入力された情報から、さらに詳細な説明が欲しい単語を「キーワード」としてリストアップし、配列にして出力してください。
以下のルールを守ってください。

# キーワード抽出のルール
- 一般的な単語は避けてください。
- 抽象的な単語は避けてください。
- 技術にまつわる具体的な単語のみ抽出してください。

# 説明
${baseJson.Result}

# 出力(JSON)
{
	"Keywords": [キーワードの配列],
}`;
		
		let wres:any = await chatWithModel("gpt-4o-mini", prompt);
		let wresResult = wres.content;
		
		let kJson = JSON.parse(wresResult);
		
		result.Word = word;
		result.Category = category;
		result.Summary = baseJson.Summary;
		result.Result = baseJson.Result;
		result.Relations = kJson.Keywords;
		
		await createNode(word, {
			Word: word,
			Category: category,
			Summary: baseJson.Summary,
			Result: baseJson.Result,
			RelationWords: kJson.Keywords
		});
		
		//fromKeywordがある場合リレーションを作る
		if(fromKeyword != "") {
			await createRelationship(fromKeyword, word, 'keyword');
		}
		
		//DGSにイベントリレー
		internalEvent({
			API: "digWord",
			WordInfo: result
		});
		
		//深堀調査
		if(depth > 0) {
			diggingDeep(result, depth-1);
		}
	} catch(ex) {
		console.log(ex);
	}
}

export async function registerFromAI(word: string, category: string, depth: number = 0, fromKeyword: string = "") {
	let result:any = {
		Success: false,
	};
	
	try {
		console.log(word)
		console.log(category)
		let dbData = await getKeywords(word, category);
		if(dbData.records.length > 0) {
			result = prettyInfo("k", dbData.records[0]);
			result.Success = true;
			return result;
		}
		
		result.Success = true;
		result.Word = word;
		result.Category = category;
		
		digWords(word, category, depth, fromKeyword);
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}
