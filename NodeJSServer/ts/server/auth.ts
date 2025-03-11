const { v4: uuidv4 } = require('uuid')
import { query } from "./../lib/database"


//デフォルト関数
export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

const GOOGLE_CLIENT_ID = "1068671679978-dugepmfh0rql497e4lcj8pimtc2lad7v.apps.googleusercontent.com";

//
export async function googleAuth(req: any,res: any,route: any)
{
	// フロント側で credential という名前でIDトークンが送られる
	const idToken = route.query.credential;
	if (!idToken) {
		return res.status(400).json({ error: 'No credential received' });
	}

	try {
		// トークンを検証する（Googleのtokeninfoエンドポイントを呼び出し）
		const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
		const data = await resp.json();

		// aud が自分のクライアントIDかどうか確認
		if (data.aud !== GOOGLE_CLIENT_ID) {
			return { error: 'Invalid token' }
		}
		
		console.log(data);
		
		//ユーザを引っ張る
		let userData = {};
		let user:any = await query("SELECT * FROM User WHERE IdentityType = ? AND Identity = ?", [1, data.sub]);
		if(user.length > 0) {
			userData = user[0];
		} else {
			await query("INSERT INTO User (IdentityType, Identity, Mail) VALUES (?, ?, ?)", [1, data.sub, data.email]);
			user = await query("SELECT * FROM User WHERE IdentityType = ? AND Identity = ?", [1, data.sub]);
			
			userData = user[0];
		}
		
		//セッションを作る(ローカルキャッシュで良い)
		let sessionId = uuidv4();
		
		res.writeHead(302, {
			'Set-Cookie': `session_id=${sessionId}; Domain=.vtn-game.com; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600`, 
			'Location': 'http://www.vtn-game.com/vc' // 
		});
		res.end();
		
		return {
			isSkipWrite: true
		};
	} catch (error) {
		console.error('Error verifying token:', error);
		return {
			error: 'Internal server error'
		};
	}
}
