import { getConnectionAddress, getActiveSessionNum, updateMaintenance } from "./../gameserver/server";
import { query } from "./../lib/database";
import { getUniqueUsers, createUserWithAI, getUserFromId, getUserFromHash, getUserHistory, getUserMessages, getUserFriends, gameAskAndReward } from "./../vclogic/vcuser";
import { uploadToS3 } from "./../lib/s3"
const { v4: uuidv4 } = require('uuid')

//デフォルト関数
export async function index(req: any, res: any, route: any) {
  console.log(route);
  return null;
}

//接続アドレスの取得
export async function getaddr(req: any, res: any, route: any) {
  let addrInfo = getConnectionAddress();
  if (addrInfo == null) {
    return {
      status: 200,
      address: "",
    };
  }

  let ret = `ws://${addrInfo.host}:${addrInfo.port}`;

  return {
    Status: 200,
    Address: ret,
  };
}

//メンテナンス
export async function maintenance(req: any, res: any, route: any) {
  updateMaintenance(route.query.MaintenanceFlag);

  return {
    Status: 200,
    MaintenanceFlag: route.query.MaintenanceFlag,
  };
}

//接続人数などを取得する
export async function stat(req: any, res: any, route: any) {
  return {
    Status: 200,
    IsServerAlive: getConnectionAddress() != null,
    ActiveNum: getActiveSessionNum(),
  };
}

//ユーザーを取得する
export async function getUser(req: any, res: any, route: any) {
  let result = null;

  if (route.query.id) {
    result = await getUserFromId(route.query.id);
  } else {
    result = await getUserFromHash(route.query.hash);
  }

  if (route.query.withLog) {
    let history = await getUserHistory(route.query.id);
    result.History = history.History;
    result.HistoryCount = history.Count;
  }

  if (route.query.withMessage) {
    let message = await getUserMessages(route.query.id);
    result.Messages = message.Messages;
    result.MessageCount = message.Count;
  }

  if (route.query.withFriends) {
    let message = await getUserFriends(route.query.id);
    result.Friends = message.Friends;
    result.FriendCount = message.Count;
  }

  return {
    Status: 200,
    UserData: result,
  };
}
/*
//冒険の記録を取得する
export async function gameHistory(req: any, res: any, route: any) {
  let result: any = await getGameHistory(route.query.id);

  result.Status = 200;

  return result;
}

//冒険の記録を取得する
export async function userHistory(req: any, res: any, route: any) {
  let result: any = await getUserHistory(route.query.id, route.query.page);

  result.Status = 200;

  return result;
}

//応援の記録を取得する
export async function userMessage(req: any, res: any, route: any) {
  let result: any = await getUserMessages(route.query.id, route.query.page);

  result.Status = 200;

  return result;
}

//出会いの記録を取得する
export async function friendList(req: any, res: any, route: any) {
  let friends = await getUserFriends(route.query.id, route.query.page);
  let messages = await getUserMessages(route.query.id);

  return {
    Status: 200,
    Friends: friends,
    Messages: messages,
  };
}
*/

//ユーザーを作成する
export async function createUser(req: any, res: any, route: any) {
  let result = await createUserWithAI(route.query);

  return {
    Status: 200,
    Success: result.success,
    UserData: result.result,
  };
}

//ゲームアンケート
export async function gameAsk(req: any, res: any, route: any) {
  let result: any = await gameAskAndReward(route.query);

  return result;
}

// プッシュ通知登録
export async function subscribe(req: any, res: any, route: any) {
  let PushNotification = require("./../gameserver/pushNotification");
  let pushSubscription = {
    endpoint: route.query.subscription.endpoint,
    keys: {
      auth: route.query.subscription.keys.auth,
      p256dh: route.query.subscription.keys.p256dh,
    },
  };

  let result = await PushNotification.savePushSubscription(route.query.UserId, pushSubscription);
}

// プッシュ通知送信
export async function send(req: any, res: any, route: any) {
  let PushNotification = require("./../gameserver/pushNotification");
  let result = await PushNotification.sendPushNotification(route.query.UserId);
}
