var neo4j = require('neo4j-driver');
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } from "./../config/config"
const { v4: uuidv4 } = require('uuid')

let driver:any = null;

export async function setupNeo4j() {
	driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
    const serverInfo = await driver.getServerInfo()
    console.log('Connection established')
    console.log(serverInfo)
}

// キーワードの取得
export async function getNode(typeName: string, keyName: string, keyString: string) {
	const session = driver.session();

	try {
		const result = await session.run(
		  `MATCH (n:${typeName} { ${keyName}: $keyString }) RETURN n`,
		  { keyString }
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
export async function getNodeWithRelations(typeName: string, keyName: string, keyString: string, depth: number = 0) {
	const session = driver.session();

	try {
		let query = "";
		if(depth <= 1){
			query = `MATCH monad = (n:${typeName} { ${keyName}: $keyString })-[]-(o) RETURN monad`;
		}else{
			query = `MATCH monad = (n:${typeName} { ${keyName}: $keyString })-[:RELATED*1..${depth}]-(o) RETURN monad`;
		}
		
		const result = await session.run(
		  query,
		  { keyString }
		);
		return result;
	} catch (error) {
		console.error('Error find node:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

export async function createNode(typeName: string, data: any) {
	const session = driver.session();

	try {
		data.Neo4jID = uuidv4();
		await session.run(
			`CREATE (n:${typeName} $data)`,
      		{ data }
		);
		console.log(`Node has been created.`);
		return data.Neo4jID;
	} catch (error) {
		console.error('Error creating node:', error);
	} finally {
		await session.close();
	}
	
	return null;
}

export async function createRelationship(baseId: string, targetId: string, relation: string) {
	const session = driver.session();
	try {
		// まずは、キーワードが存在するか確認しながら関連性を作成
		await session.run(
			`
			MATCH (a { Neo4jID: $baseId })
			MATCH (b { Neo4jID: $targetId })
			MERGE (a)-[r:RELEVANCY]->(b)
			SET r.relation = $relation
			`,
			{ baseId, targetId, relation }
	);
	console.log(`Relationship created between "${baseId}" and "${targetId}" with relation: ${relation}`);
	
	} catch (error) {
		console.error('Error creating relationship:', error);
	} finally {
		await session.close();
	}
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
