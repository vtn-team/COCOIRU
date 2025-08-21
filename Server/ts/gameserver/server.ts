import { GraphEventContainer } from "./graph"
import { getElasticIP } from "./../elasticip"
import { WebSocket, WebSocketServer } from 'ws'
import { randomUUID } from 'crypto'
import { UserSession, VCBridgeSession, CMD, TARGET, createMessage, InternalEvent } from "./session"

//サーバキャッシュ
let gServer:Server|null = null;

//サーバ本体
//NOTE: ここは特にいじる必要はない部分
//NOTE: 必要なコンテンツを増やす時はここから増やす
class Server {
	protected sessions: any;			//各接続のセッション
	protected server: any;				//WebSocketサーバ本体
	protected roomCheck: any;			//ルーム監視用のタイマー
	protected sendStatsTimer:any;		//スタッツ送信用タイマー
	
	protected graph: GraphEventContainer;	//グラフイベントコンテナ(深堀り君)
	
	protected lastActiveNum: number;	//現在のアクティブ人数キャッシュ
	protected port: number;				//接続するポート
	protected isMaintenance: boolean;	//メンテナンス情報
	

	//データ送信
	broadcast(data: any) {
		let msg = JSON.stringify(data);
		
		for(var k in this.sessions) {
			let us = this.sessions[k];
			if(!us.chkTarget(data)) {
				continue;
			}
			
			us.sendMessage(msg);
		}
	};
	
	//コンストラクタ
	constructor(port: number) {
		this.sessions = {};
		this.port = port;
		this.isMaintenance = false;
		this.server = new WebSocketServer({ port });
		
		this.graph = new GraphEventContainer((data: any)=>{ this.broadcast(data); });
		
		this.lastActiveNum = 0;
		this.server.on ('connection', (ws: any) => {
			let uuid = randomUUID();
			this.sessions[uuid] = new UserSession(uuid, ws);
			
			ws.on('pong', () => {
				this.pong(uuid);
			});

			ws.on('message', async (message: string) => {
				console.log(' Received: %s', message);
				try
				{
					let data = JSON.parse(message);
					let sessionId = data["SessionId"];
					
					if(this.isMaintenance) return;
					
					if(this.sessions[sessionId]) {
						await this.message(data);
					}else{
						console.error("session not found.")
					}
				}
				catch(ex)
				{
					console.error(ex);
				}
			});

			ws.on('close', (code:number, reason: any)=> {
				this.removeSession(uuid);
			});

			//Joinをもらうためのエコーバック
			let echoback = createMessage(-1, CMD.WELCOME, TARGET.SELF, { SessionId: uuid });
			let payload = JSON.stringify(echoback);
			ws.send(payload);
		});
		
		this.server.on('close', () => {
			clearInterval(this.roomCheck);
		});
		
		this.roomCheck = setInterval(() => {
			this.activeCheck();
		}, 10000);
		
		this.sendStatsTimer = setInterval(() => {
			this.sendGameStatus();
		}, 5000);
		
		console.log("server launch port on :" + port);
	}
	
	async message(data: any) {
		//重要なメッセージはここでさばく
		switch(data["Command"])
		{
		case CMD.SEND_JOIN:
			this.join(data);
			break;
			
		case CMD.SEND_EVENT:
			
		default:
			break;
		}
	}
	
	join(data: any) {
		let sessionId = data["SessionId"];
		this.sessions[sessionId]?.setUserInfo(data);
	}
	
	removeSession(uuid: string) {
		delete this.sessions[uuid];
		console.log("delete session :" + uuid);
	}

	pong(sessionId: string) {
		if (this.sessions[sessionId]) {
			this.sessions[sessionId].pong();
		}
	}
	
	activeCheck() {
		let count = 0;
		for(var k in this.sessions) {
			let us = this.sessions[k];
			if (!us.isAlive()) return us.term();

			us.ping();
			count++;
		}
		this.lastActiveNum = count;
		//console.log("active session count:" + count);
	}
	
	sendGameStatus() {
		let stats = {
			IsMaintenance: this.isMaintenance,
		}
		this.broadcast(createMessage(-1, CMD.STAT, TARGET.ALL, stats));
	}

	public updateMaintenance(isMaintenance: boolean) {
		this.isMaintenance = isMaintenance;
	}
	
	public internalEvent(data: InternalEvent) {
		this.graph.internalEvent(data);
	}
	
	public getPort() {
		return this.port;
	}
	
	//アクティブ人数を返す
	public getActiveSessionNum() {
		return this.lastActiveNum;
	}
}


//(公開関数)サーバを起動する
export function launchDGS(port: number) {
	if(gServer != null) return;
	
	gServer = new Server(port);
	//gServer.setupGameConnect();
}

//(公開関数)アクティブなゲーム数を返す
export function updateMaintenance(isMaintenance: boolean) {
	if(gServer == null) return 0;
	
	return gServer.updateMaintenance(isMaintenance);
}

//(公開関数)WebSocketに接続するホストアドレスとポートを返す
export function getConnectionAddress() {
	if(gServer == null) return null;
	
	return { host: getElasticIP(), port: gServer.getPort() };
}

//(公開関数)接続中のユーザ数を返す
export function getActiveSessionNum() {
	if(gServer == null) return 0;
	
	return gServer.getActiveSessionNum();
}

//(公開関数)APIの処理結果などをイベントとして配信する
export function internalEvent(data: InternalEvent) {
	if(gServer == null) return;
	
	gServer.internalEvent(data);
}
