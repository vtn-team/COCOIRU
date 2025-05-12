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
		"/digw" : "dw#web#Web",
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
		"/classroom" : {
			"/" : "classroom#main#    授業ページ",
			"/user" : {
				"/create" : "classroom#usercreate#    授業ページ",
			}
		},
		"/monad" : {
			"/" : "monad#test#sss"
		},
		"/board" : {
			"@URI%s" : "dw#web2#Web",
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
