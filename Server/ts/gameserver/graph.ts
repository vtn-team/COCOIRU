import { chat, chatWithSession } from "./../lib/chatgpt"
import { getMaster, getGameInfo, getGameEvent } from "./../lib/masterDataCache"
import { MessagePacket, checkMessageAndWrite, recordFriendShip } from "./../vclogic/vcmessage"
import { getUserFromId, getUserFromHash } from "./../vclogic/vcuser"
import { UserSession, VCUserSession, VCBridgeSession, CMD, TARGET, createMessage, createGameMessage, parsePayload, InternalEvent } from "./session"
const markdown = require('markdown-it');

interface GraphSearch {
	word: string;
	category: string;
};


//グラフイベントコンテナ
//NOTE: 深堀君の動きをユーザに通知する
export class GraphEventContainer {
	queue: Array<GraphSearch>;
	broadcast: any;

	constructor(bc: any) {
		this.queue = [];
		this.broadcast = bc;
	}

	public execMessage(data: any) {
		let payload = parsePayload(data["Payload"]);
		
		switch(data["Command"])
		{
		case CMD.SEND_EVENT:
		{
		}
		break;
		
		case CMD.ERROR:
		{
			//console.log(data)
			this.broadcast(createMessage(data.UserId, CMD.ERROR, TARGET.SELF, data));
		}
		break;
		}
	}
	
	public internalEvent(data: InternalEvent) {
		switch(data.API) {
		case "digWord":
		case "digWordDeep":
			{
				const md = markdown();
				data.Result = md.render(data.Result);
				for(let kw of data.Relations) {
					data.Result = data.Result.replaceAll(kw, `<a href="#" class="keyword-link" data-action="${kw}")>${kw}</a>`)
					data.Result = data.Result.replaceAll("\n", "<br />")
				}
				data.Result = encodeURIComponent(data.Result)
				this.broadcast(createMessage(-1, CMD.EVENT, TARGET.ALL, data));
			}
			break;
		}
	}
};
