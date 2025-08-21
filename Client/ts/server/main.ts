const { v4: uuidv4 } = require('uuid')
import { query } from "./../lib/database"
import { getCache, setCache, updateData } from "../lib/userCache"
const fs = require('fs');
const path = require('path');

// メインページ表示
export async function index(req: any, res: any, route: any) {
    try {
        const htmlPath = path.join(__dirname, '../../../Web/Main.html');
        const html = fs.readFileSync(htmlPath, 'utf8');
        
        return {
            html: html,
            statusCode: 200,
            type: 'text/html'
        };
    } catch (error) {
        console.error('Error loading main page:', error);
        return {
            statusCode: 500,
            error: 'Failed to load main page'
        };
    }
}

// メンバー一覧取得
export async function getMembers(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        // データベースからアクティブなユーザーを取得
        const users = await query(`
            SELECT u.Id, u.Name, u.Mail, u.Picture, us.Location, us.Status, us.LastUpdate, us.CurrentActivity
            FROM User u
            LEFT JOIN UserStatus us ON u.Id = us.UserId
            WHERE u.Id != ? AND us.LastUpdate > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ORDER BY us.LastUpdate DESC
        `, [route.session.userId]);

        const members = users.map((user: any) => ({
            id: user.Id,
            name: user.Name || user.Mail?.split('@')[0] || 'Unknown',
            email: user.Mail,
            picture: user.Picture,
            location: user.Location || '不明',
            status: user.Status || 'offline',
            lastUpdate: user.LastUpdate ? new Date(user.LastUpdate).toLocaleString('ja-JP') : '不明',
            currentActivity: user.CurrentActivity || '作業中'
        }));

        return { members };
    } catch (error) {
        console.error('Error fetching members:', error);
        return {
            statusCode: 500,
            error: 'Failed to fetch members'
        };
    }
}

// タスク一覧取得
export async function getTasks(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        // ユーザーの今日のタスクを取得
        const tasks = await query(`
            SELECT t.Id, t.Name, t.Description, t.ScheduledTime, t.Status, t.Priority
            FROM Task t
            WHERE t.UserId = ? AND DATE(t.ScheduledTime) = CURDATE()
            ORDER BY t.ScheduledTime ASC
        `, [route.session.userId]);

        const formattedTasks = tasks.map((task: any) => ({
            id: task.Id,
            name: task.Name,
            description: task.Description,
            time: new Date(task.ScheduledTime).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            status: task.Status || 'pending',
            priority: task.Priority || 'medium'
        }));

        return { tasks: formattedTasks };
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return {
            statusCode: 500,
            error: 'Failed to fetch tasks'
        };
    }
}

// ユーザーのステータス更新
export async function updateStatus(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const { location, status, currentActivity } = route.query;
        const userId = route.session.userId;

        // UserStatusテーブルを更新（存在しない場合は作成）
        await query(`
            INSERT INTO UserStatus (UserId, Location, Status, CurrentActivity, LastUpdate)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            Location = VALUES(Location),
            Status = VALUES(Status),
            CurrentActivity = VALUES(CurrentActivity),
            LastUpdate = NOW()
        `, [userId, location, status, currentActivity]);

        // セッションキャッシュも更新
        await setCache(route.query.session, "location", location);
        await setCache(route.query.session, "status", status);
        await setCache(route.query.session, "currentActivity", currentActivity);

        return { success: true, message: 'Status updated successfully' };
    } catch (error) {
        console.error('Error updating status:', error);
        return {
            statusCode: 500,
            error: 'Failed to update status'
        };
    }
}

// ヘルプ要請
export async function requestHelp(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const { message } = route.query;
        const userId = route.session.userId;
        const userName = route.session.name;

        // ヘルプ要請をデータベースに記録
        await query(`
            INSERT INTO HelpRequest (UserId, Message, RequestTime, Status)
            VALUES (?, ?, NOW(), 'active')
        `, [userId, message || 'ヘルプが必要です！']);

        // 他のアクティブなユーザーに通知を送信（WebSocket経由）
        const helpNotification = {
            type: 'help_request',
            from: userName,
            fromId: userId,
            message: message || 'ヘルプが必要です！',
            timestamp: new Date().toISOString()
        };

        // WebSocket経由で他のユーザーに通知
        // (WebSocketサーバーの実装が必要)
        broadcastToActiveUsers(helpNotification, userId);

        return { success: true, message: 'Help request sent successfully' };
    } catch (error) {
        console.error('Error sending help request:', error);
        return {
            statusCode: 500,
            error: 'Failed to send help request'
        };
    }
}

// タスクの後回し
export async function postponeTask(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const taskId = route.query.id;
        const userId = route.session.userId;

        // タスクが自分のものかチェック
        const task = await query(`
            SELECT Id, ScheduledTime FROM Task 
            WHERE Id = ? AND UserId = ?
        `, [taskId, userId]);

        if (task.length === 0) {
            return {
                statusCode: 404,
                error: 'Task not found'
            };
        }

        // タスクを1時間後に延期
        await query(`
            UPDATE Task 
            SET ScheduledTime = DATE_ADD(ScheduledTime, INTERVAL 1 HOUR),
                Status = 'postponed'
            WHERE Id = ? AND UserId = ?
        `, [taskId, userId]);

        return { success: true, message: 'Task postponed successfully' };
    } catch (error) {
        console.error('Error postponing task:', error);
        return {
            statusCode: 500,
            error: 'Failed to postpone task'
        };
    }
}

// 現在のユーザーステータス取得
export async function getMyStatus(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const userId = route.session.userId;

        // ユーザーのステータス情報を取得
        const statusResult = await query(`
            SELECT Location, Status, CurrentActivity, LastUpdate
            FROM UserStatus
            WHERE UserId = ?
        `, [userId]);

        // 今日のタスク進捗を計算
        const taskProgress = await query(`
            SELECT 
                COUNT(*) as totalTasks,
                SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) as completedTasks
            FROM Task
            WHERE UserId = ? AND DATE(ScheduledTime) = CURDATE()
        `, [userId]);

        const status = statusResult.length > 0 ? statusResult[0] : {
            Location: '不明',
            Status: 'offline',
            CurrentActivity: '',
            LastUpdate: null
        };

        const progress = taskProgress.length > 0 && taskProgress[0].totalTasks > 0 
            ? Math.round((taskProgress[0].completedTasks / taskProgress[0].totalTasks) * 100)
            : 0;

        return {
            location: status.Location,
            status: status.Status,
            currentActivity: status.CurrentActivity,
            taskProgress: progress,
            lastUpdate: status.LastUpdate ? new Date(status.LastUpdate).toLocaleString('ja-JP') : null
        };
    } catch (error) {
        console.error('Error fetching user status:', error);
        return {
            statusCode: 500,
            error: 'Failed to fetch user status'
        };
    }
}

// アクティブウィンドウ情報を受信
export async function updateActivity(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const { windowTitle, applicationName, duration } = route.query;
        const userId = route.session.userId;

        // アクティビティログを記録
        await query(`
            INSERT INTO ActivityLog (UserId, WindowTitle, ApplicationName, Duration, Timestamp)
            VALUES (?, ?, ?, ?, NOW())
        `, [userId, windowTitle, applicationName, duration]);

        // 現在のアクティビティを更新
        await query(`
            UPDATE UserStatus 
            SET CurrentActivity = ?, LastUpdate = NOW() 
            WHERE UserId = ?
        `, [applicationName, userId]);

        return { success: true, message: 'Activity updated successfully' };
    } catch (error) {
        console.error('Error updating activity:', error);
        return {
            statusCode: 500,
            error: 'Failed to update activity'
        };
    }
}

// ユーザー位置情報を更新（WiFi情報から判定）
export async function updateLocation(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const { wifiSSID, wifiMAC } = route.query;
        const userId = route.session.userId;

        // WiFi情報から場所を判定
        let location = '不明';
        if (wifiSSID) {
            // 学校のWiFi SSID判定ロジック
            if (wifiSSID.includes('VANTAN') || wifiSSID.includes('SCHOOL')) {
                location = '学校';
            } else if (wifiSSID.includes('HOME') || wifiSSID.includes('家')) {
                location = '家';
            } else {
                location = '外出先';
            }
        }

        // 位置情報を更新
        await updateStatus(req, res, {
            ...route,
            query: { ...route.query, location, status: 'online' }
        });

        return { success: true, location, message: 'Location updated successfully' };
    } catch (error) {
        console.error('Error updating location:', error);
        return {
            statusCode: 500,
            error: 'Failed to update location'
        };
    }
}

// WebSocket経由で他のユーザーに通知を送信（仮実装）
function broadcastToActiveUsers(message: any, excludeUserId: number) {
    // WebSocketサーバーの実装が必要
    // ここでは仮実装として console.log を使用
    console.log('Broadcasting message to active users:', message);
    console.log('Excluding user ID:', excludeUserId);
    
    // 実際の実装では、WebSocketクライアント一覧を管理し、
    // 各クライアントにメッセージを送信する必要がある
}

// デフォルト関数（未定義のルートアクセス時）
export async function run(req: any, res: any, route: any) {
    return index(req, res, route);
}