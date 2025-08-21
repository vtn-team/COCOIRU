const { v4: uuidv4 } = require('uuid')
import { query } from "./../lib/database"
import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } from '../config/config'
import { setCache } from '../lib/userCache'

// Google OAuth2クライアントの初期化
const oauth2Client = new OAuth2Client(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_CALLBACK_URL
);

//デフォルト関数
export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

// Google OAuth開始エンドポイント
export async function googleLogin(req: any, res: any, route: any) {
	const scopes = [
		'https://www.googleapis.com/auth/userinfo.email',
		'https://www.googleapis.com/auth/userinfo.profile'
	];

	const authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: scopes,
		include_granted_scopes: true,
	});

	res.writeHead(302, {
		'Location': authUrl
	});
	res.end();

	return {
		isSkipWrite: true
	};
}

// Google OAuthコールバックエンドポイント
export async function googleCallback(req: any, res: any, route: any) {
	const { code } = route.query;
	
	if (!code) {
		res.writeHead(400, {'Content-Type': 'application/json'});
		res.write(JSON.stringify({ error: 'Authorization code not found' }));
		res.end();
		return { isSkipWrite: true };
	}

	try {
		// 認証コードをトークンに交換
		const { tokens } = await oauth2Client.getToken(code);
		oauth2Client.setCredentials(tokens);

		// ユーザー情報を取得
		const ticket = await oauth2Client.verifyIdToken({
			idToken: tokens.id_token!,
			audience: GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();
		if (!payload) {
			throw new Error('Invalid token payload');
		}

		// データベースでユーザーを確認/作成
		let userData: any = {};
		let user: any = await query("SELECT * FROM User WHERE IdentityType = ? AND Identity = ?", [1, payload.sub]);
		
		if (user.length > 0) {
			userData = user[0];
			// ユーザー情報を更新
			await query("UPDATE User SET Mail = ?, Name = ? WHERE IdentityType = ? AND Identity = ?", 
				[payload.email, payload.name, 1, payload.sub]);
		} else {
			// 新しいユーザーを作成
			await query("INSERT INTO User (IdentityType, Identity, Mail, Name) VALUES (?, ?, ?, ?)", 
				[1, payload.sub, payload.email, payload.name]);
			user = await query("SELECT * FROM User WHERE IdentityType = ? AND Identity = ?", [1, payload.sub]);
			userData = user[0];
		}

		// セッションを作成
		let sessionId = uuidv4();
		
		// セッションをキャッシュに保存
		await setCache(sessionId, "userId", userData.Id);
		await setCache(sessionId, "email", payload.email);
		await setCache(sessionId, "name", payload.name);
		await setCache(sessionId, "picture", payload.picture);
		await setCache(sessionId, "token", uuidv4());

		// セッションクッキーを設定してリダイレクト
		res.writeHead(302, {
			'Set-Cookie': `session_id=${sessionId}; Domain=.vtn-game.com; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600`,
			'Location': 'http://www.vtn-game.com/vc'
		});
		res.end();

		return {
			isSkipWrite: true
		};

	} catch (error) {
		console.error('Google OAuth callback error:', error);
		res.writeHead(500, {'Content-Type': 'application/json'});
		res.write(JSON.stringify({ error: 'Authentication failed' }));
		res.end();
		return { isSkipWrite: true };
	}
}

// 既存のgoogleAuth関数（IDトークン検証用）
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

// ログアウト機能
export async function logout(req: any, res: any, route: any) {
	const sessionId = route.query.session;
	
	if (sessionId) {
		// セッションをキャッシュから削除
		await setCache(sessionId, "userId", "");
		await setCache(sessionId, "email", "");
		await setCache(sessionId, "name", "");
		await setCache(sessionId, "picture", "");
		await setCache(sessionId, "token", "");
	}

	// クッキーを削除
	res.writeHead(302, {
		'Set-Cookie': `session_id=; Domain=.vtn-game.com; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`,
		'Location': '/'
	});
	res.end();

	return {
		isSkipWrite: true
	};
}

// 現在のユーザー情報を取得
export async function me(req: any, res: any, route: any) {
	if (!route.session) {
		return {
			statusCode: 401,
			error: 'Not authenticated'
		};
	}

	return {
		user: {
			id: route.session.userId,
			email: route.session.email,
			name: route.session.name,
			picture: route.session.picture
		}
	};
}

// ログインページを表示
export async function loginPage(req: any, res: any, route: any) {
	const fs = require('fs');
	const path = require('path');
	
	try {
		const htmlPath = path.join(__dirname, '../../view/login.html');
		const html = fs.readFileSync(htmlPath, 'utf8');
		
		return {
			html: html,
			statusCode: 200,
			type: 'text/html'
		};
	} catch (error) {
		console.error('Error loading login page:', error);
		return {
			statusCode: 500,
			error: 'Failed to load login page'
		};
	}
}
