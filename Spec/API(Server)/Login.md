ログイン

# エンドポイント
- ルート： `/login`
- メソッド： POST

## 入力パラメータ
- アプリバージョン
- キャッシュされたデータバージョン(ない場合は0)
- 前回のログイン
- ユーザID

# 処理
- OAuth2のGoogle Login処理を行い、コールバックで戻ってくる
	- scopeは以下
		- userinfo.email
		- userinfo.profile
		- openid
	- ※コールバック後の処理もこの仕様書に含むこととする
- openidの該当ユーザがいない場合は新規ユーザとして登録、もらってきたプロフィールから名前等を書き込む
	- [[UserModel]]

# 返却値
- Master: 以下のマスタデータの辞書。更新されている場合のみ。
	- WiFiList
	- TimeTable
- User: [[UserModel]]の情報