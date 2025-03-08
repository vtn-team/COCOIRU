var neo4j = require('neo4j-driver');
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } from "./../config/config"

let driver:any = null;

export async function setupNeo4j() {
	driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
    const serverInfo = await driver.getServerInfo()
    console.log('Connection established')
    console.log(serverInfo)
}

// キーワードの取得
export async function getKeywordsAny(keyword: string) {
	const session = driver.session();

	try {
		const result = await session.run(
		  'MATCH (k:Keyword { Word: $keyword }) RETURN k',
		  { keyword }
		);
		return result;
	} catch (error) {
		console.error('Error find keyword:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

// キーワードの取得
export async function getKeywords(keyword: string, category: string) {
	const session = driver.session();

	try {
		const result = await session.run(
		  'MATCH (k:Keyword { Word: $keyword, Category: $category }) RETURN k',
		  { keyword, category }
		);
		return result;
	} catch (error) {
		console.error('Error find keyword:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

// キーワードとリレーションの取得
export async function deepSearchKeywordOnly(keyword: string, depth: number) {
	const session = driver.session();

	try {
		let query = "";
		if(depth <= 1){
			query = `MATCH kw = (k:Keyword { Word: $keyword })-[]-(other:Keyword) RETURN kw`;
		}else{
			query = `MATCH kw = (k:Keyword { Word: $keyword })-[:RELATED*1..${depth}]-(other:Keyword) RETURN kw`;
		}
		const result = await session.run(
		  query,
		  { keyword }
		);
		return result;
	} catch (error) {
		console.error('Error find keyword:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

// キーワードとリレーションの取得
export async function deepSearch(keyword: string, category: string, depth: number) {
	const session = driver.session();

	try {
		let query = "";
		if(depth <= 1){
			query = `MATCH kw = (k:Keyword { Word: $keyword, Category: $category })-[]-(other:Keyword) RETURN kw`;
		}else{
			query = `MATCH kw = (k:Keyword { Word: $keyword, Category: $category })-[:RELATED*1..${depth}]-(other:Keyword) RETURN kw`;
		}
		const result = await session.run(
		  query,
		  { keyword, category }
		);
		return result;
	} catch (error) {
		console.error('Error find keyword:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

export async function createNode(keyword: string, data: any) {
	const session = driver.session();

	try {
		await session.run(
			'CREATE (k:Keyword $data)',
      		{ data }
		);
		console.log(`Keyword "${keyword}" has been created.`);
	} catch (error) {
		console.error('Error creating keyword:', error);
	} finally {
		await session.close();
	}
}

export async function createRelationship(keyword1: string, keyword2: string, relation: string) {
	const session = driver.session();
	try {
		// まずは、キーワードが存在するか確認しながら関連性を作成
		await session.run(
			`
			MATCH (a:Keyword {Word: $keyword1})
			MATCH (b:Keyword {Word: $keyword2})
			MERGE (a)-[r:RELEVANCY]->(b)
			SET r.relation = $relation
			`,
			{ keyword1, keyword2, relation }
	);
	console.log(`Relationship created between "${keyword1}" and "${keyword2}" with relation: ${relation}`);
	
	} catch (error) {
		console.error('Error creating relationship:', error);
	} finally {
		await session.close();
	}
}