exports.Routes = {
	GET: {
		"/"				: "index#index#トップページ",
		"/route"		: "index#route#APIリスト羅列",
		"/favicon.ico"	: "resource#favicon#favicon",
		"/manifest.json" : "debug#manifest#Webテスト",
		"/serviceworker.js" : "debug#serviceworker#Webテスト",
		"/bg.jpg" : "debug#bg#Webテスト",
		"/anime.min.js" : "debug#animejs#Webテスト",
		"/uuid" : "debug#uuid# uuid生成",
		"/stat" : {
			"/" : "stat#check#状態確認"
		},
		"/vc" : {
			"/" : "debug#web#                      Webテスト",
			"/debug" : "debug#webDev#              Webテスト(開発)",
			"/bg.gif" : "debug#bg#                 Webテスト",
			"/anime.min.js" : "debug#animejs#      Webテスト",
			"/stat" : "vc#stat#                    ゲームの状況確認",
			"/getaddr" : "vc#getaddr#              ゲームサーバ接続情報取得",
			"/user" : {
				"@id%d" : "vc#getUser#             ユーザ取得",
				"@hash%s" : "vc#getUser#           ユーザ取得",
			},
			"/games" : {
				"@id%d" : "vc#gameHistory#         冒険の記録を取得",
			},
			"/history" : {
				"@id%d" : "vc#userHistory#         冒険の記録を取得",
			},
			"/messages" : {
				"@id%d" : "vc#userMessage#         もらったメッセージを取得",
			},
			"/friend" : {
				"@id%d" : "vc#friendList#          トモダチを取得",
			},
			"/gameusers" : {
				"/" : "vc#getGameUsers#       ゲーム参加ユーザの取得",
				"/active" : "vc#getGameUsers#       ゲーム参加ユーザの取得",
			},
			
			"/epictest" : "vc#epictest#             冒険の書を作る",
		},
		"/digw" : "dw#web#                          Web",
		"/searchCy" : {
			"@word%s" : {
				"@category%s" : {
					"@depth%d" : "dw#getCytoscapeData#           キーワードサーチ"
				}
			}
		},
		"/search" : {
			"@word%s" : {
				"@category%s" : {
					"@depth%d" : "dw#searchWord#           キーワードサーチ"
				}
			}
		},
		"/tools" : {
			"/getmaster" : {
				"@name%s" : "tools#getmaster#   マスタデータ更新",
			},
			"/masterupdate" : "tools#masterupdate#   マスタデータ更新",
			"/modelist" : "ai#modelist#            モデルリスト"
		},
		"/ai" : {
			"/modelist" : "ai#modelist#            モデルリスト"
		}
	},
	POST: {
		"/login" : "user#login",
		"/callback" : "auth#googleAuth",
		"/maintain" : "vc#maintenance#             メンテナンス",
		"/vc" : {
			"/gamelink" : "vc#glink#               ゲームリンク",
			"/usercreate" : "vc#createUser#        ユーザ生成(テスト用)",
			"/gamestart" : "vc#gameStart#          ゲーム開始",
			"/gameend" : "vc#gameEnd#              ゲーム終了",
			"/handover" : "vc#handOver#            ゲーム交代",
			"/ai" :{
				"/gamestart" : "vc#gameStartAI#    ゲーム開始",
				"/gameend" : "vc#gameEndAI#        ゲーム終了",
			},
			"/cheer" : "vc#cheer#                  おうえん(API経由)",
			"/gameask" : "vc#gameAsk#              アンケート",
			"/subscribe" : "vc#subscribe#          プッシュ通知登録",
			"/send" : "vc#send#                    プッシュ通知送信",
		},
		"/tools" : {
			"/ephemeralkey" : "ai#ephemeralkey#     エフェメラルキーを取得"
		},
		"/ai" : {
			"/all" : {
				"/eval" : "ai#chateval#          チャット比較"
			},
			"/openai" : {
				"/chat" : "ai#chatToOpenAIWithModel#          チャット"
			},
			"/anthropic" : {
				"/chat" : "ai#chatToClaudeWithModel#          チャット"
			},
			"/google" : {
				"/chat" : "ai#chatToGeminiWithModel#          チャット"
			}
		}
	}
}

exports.Auth = {
	UseSessionAuth: false,
	PassThroughRoute: {
		GET: [],
		POST: []
	}
};
