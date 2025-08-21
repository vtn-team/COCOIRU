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
			"/" : "classroom#main#    授業ページ"
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
		},
		"/auth" : {
			"/google" : "auth#googleLogin#       Google OAuth開始",
			"/google/callback" : "auth#googleCallback# Google OAuthコールバック",
			"/logout" : "auth#logout#            ログアウト",
			"/me" : "auth#me#                   現在のユーザー情報"
		},
		"/login" : "auth#loginPage#             ログインページ",
		"/main" : "main#index#                 メインページ",
		"/api" : {
			"/members" : "main#getMembers#        メンバー一覧取得",
			"/tasks" : "main#getTasks#            タスク一覧取得",
			"/status" : "main#getMyStatus#        自分のステータス取得",
			"/location" : {
				"/" : "location#index#           位置検出サービス情報",
				"/ip-location" : "location#ipLocation# IPから位置検出",
				"/history" : "location#getLocationHistory# 位置履歴取得",
				"/wifi-locations" : "location#manageWiFiLocations# WiFi位置管理"
			}
		}
	},
	POST: {
		"/login" : "user#login",
		"/callback" : "auth#googleAuth",
		"/maintain" : "vc#maintenance#             メンテナンス",
		"/tools" : {
			"/ephemeralkey" : "ai#ephemeralkey#     エフェメラルキーを取得"
		},
		"/classroom" : {
			"/user" : {
				"/create" : "classroom#usercreate#    授業ページ",
			}
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
		},
		"/api" : {
			"/status" : "main#updateStatus#       ステータス更新",
			"/help" : "main#requestHelp#          ヘルプ要請",
			"/activity" : "main#updateActivity#    アクティビティ更新",
			"/location" : "main#updateLocation#    位置情報更新",
			"/tasks" : {
				"@id%d" : {
					"/postpone" : "main#postponeTask#    タスク後回し"
				}
			},
			"/location-api" : {
				"/wifi-match" : "location#wifiMatch#   WiFi位置マッチング",
				"/guess" : "location#guessLocation#   ネットワーク品質位置推測",
				"/reverse-geocode" : "location#reverseGeocode# GPS座標位置変換",
				"/learn" : "location#learnLocation#   位置情報学習"
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
