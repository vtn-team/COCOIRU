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


let wordTableId = "1ba39cbfbab980adaf6bc97edae68811";
let pageCache:any = [];

export async function diggingWord(word: string) {
	
}

