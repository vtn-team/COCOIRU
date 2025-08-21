const { v4: uuidv4 } = require('uuid')
import { query } from "./../lib/database"
import { getCache, setCache } from "../lib/userCache"

// 位置検出の精度レベル
enum LocationAccuracy {
    HIGH = 'high',      // WiFi MAC + GPS
    MEDIUM = 'medium',  // WiFi SSID + Network
    LOW = 'low',        // IP + Time
    MANUAL = 'manual'   // 手動設定
}

// WiFi情報と位置をマッチング
export async function wifiMatch(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const { ssid, mac } = route.query;
        
        if (!ssid) {
            return {
                statusCode: 400,
                error: 'SSID is required'
            };
        }

        // データベースでWiFi情報と位置をマッチング
        let location = await matchWiFiToLocation(ssid, mac);
        let accuracy = LocationAccuracy.MEDIUM;

        if (!location) {
            // 新しいWiFiネットワークの場合、ユーザーに位置を推測させる
            location = await guessLocationFromSSID(ssid);
            accuracy = LocationAccuracy.LOW;
        } else if (mac) {
            accuracy = LocationAccuracy.HIGH;
        }

        // 位置情報をログに記録
        await logLocationDetection(route.session.userId, location, 'wifi', {
            ssid: ssid,
            mac: mac,
            accuracy: accuracy
        });

        return {
            location: location,
            accuracy: accuracy,
            source: 'wifi',
            confidence: getConfidenceScore(location, accuracy)
        };
    } catch (error) {
        console.error('WiFi位置マッチングエラー:', error);
        return {
            statusCode: 500,
            error: 'Failed to match WiFi location'
        };
    }
}

// ネットワーク品質から位置を推測
export async function guessLocation(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const { downlink, effectiveType, timestamp } = route.query;
        
        // 過去のネットワーク品質データと照合
        const location = await guessLocationFromNetworkQuality(
            route.session.userId, 
            downlink, 
            effectiveType
        );

        await logLocationDetection(route.session.userId, location, 'network', {
            downlink: downlink,
            effectiveType: effectiveType,
            timestamp: timestamp,
            accuracy: LocationAccuracy.LOW
        });

        return {
            location: location,
            accuracy: LocationAccuracy.LOW,
            source: 'network',
            confidence: getConfidenceScore(location, LocationAccuracy.LOW)
        };
    } catch (error) {
        console.error('ネットワーク位置推測エラー:', error);
        return {
            statusCode: 500,
            error: 'Failed to guess location from network'
        };
    }
}

// GPS座標を位置名に変換
export async function reverseGeocode(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const { latitude, longitude } = route.query;
        
        if (!latitude || !longitude) {
            return {
                statusCode: 400,
                error: 'Latitude and longitude are required'
            };
        }

        // 既知の場所の座標と照合
        const location = await reverseGeocodeCoordinates(
            parseFloat(latitude), 
            parseFloat(longitude)
        );

        await logLocationDetection(route.session.userId, location, 'gps', {
            latitude: latitude,
            longitude: longitude,
            accuracy: LocationAccuracy.HIGH
        });

        return {
            location: location,
            accuracy: LocationAccuracy.HIGH,
            source: 'gps',
            confidence: getConfidenceScore(location, LocationAccuracy.HIGH)
        };
    } catch (error) {
        console.error('逆ジオコーディングエラー:', error);
        return {
            statusCode: 500,
            error: 'Failed to reverse geocode'
        };
    }
}

// IPアドレスから位置を検出
export async function ipLocation(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const clientIP = getClientIP(req);
        const location = await getLocationFromIP(clientIP);

        await logLocationDetection(route.session.userId, location, 'ip', {
            ip: clientIP,
            accuracy: LocationAccuracy.LOW
        });

        return {
            location: location,
            accuracy: LocationAccuracy.LOW,
            source: 'ip',
            confidence: getConfidenceScore(location, LocationAccuracy.LOW)
        };
    } catch (error) {
        console.error('IP位置検出エラー:', error);
        return {
            statusCode: 500,
            error: 'Failed to detect location from IP'
        };
    }
}

// 位置情報の学習・更新
export async function learnLocation(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const { ssid, mac, location, latitude, longitude } = route.query;
        const userId = route.session.userId;

        // WiFi情報を学習
        if (ssid && location) {
            await learnWiFiLocation(ssid, mac, location, userId);
        }

        // GPS座標を学習
        if (latitude && longitude && location) {
            await learnGPSLocation(
                parseFloat(latitude), 
                parseFloat(longitude), 
                location, 
                userId
            );
        }

        return {
            success: true,
            message: 'Location learned successfully'
        };
    } catch (error) {
        console.error('位置学習エラー:', error);
        return {
            statusCode: 500,
            error: 'Failed to learn location'
        };
    }
}

// 位置検出履歴を取得
export async function getLocationHistory(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const userId = route.session.userId;
        const limit = route.query.limit || 50;

        const history = await query(`
            SELECT Location, DetectionMethod, DetectionData, Confidence, DetectedAt
            FROM LocationHistory
            WHERE UserId = ?
            ORDER BY DetectedAt DESC
            LIMIT ?
        `, [userId, limit]);

        const formattedHistory = history.map((item: any) => ({
            location: item.Location,
            method: item.DetectionMethod,
            data: JSON.parse(item.DetectionData || '{}'),
            confidence: item.Confidence,
            detectedAt: item.DetectedAt
        }));

        return {
            history: formattedHistory
        };
    } catch (error) {
        console.error('位置履歴取得エラー:', error);
        return {
            statusCode: 500,
            error: 'Failed to get location history'
        };
    }
}

// WiFi位置情報管理
export async function manageWiFiLocations(req: any, res: any, route: any) {
    if (!route.session) {
        return {
            statusCode: 401,
            error: 'Not authenticated'
        };
    }

    try {
        const wifiLocations = await query(`
            SELECT w.*, COUNT(lh.Id) as UsageCount
            FROM WifiLocation w
            LEFT JOIN LocationHistory lh ON JSON_EXTRACT(lh.DetectionData, '$.ssid') = w.SSID
            GROUP BY w.Id
            ORDER BY UsageCount DESC, w.CreatedAt DESC
        `, []);

        return {
            wifiLocations: wifiLocations
        };
    } catch (error) {
        console.error('WiFi位置情報管理エラー:', error);
        return {
            statusCode: 500,
            error: 'Failed to manage WiFi locations'
        };
    }
}

// === ヘルパー関数 ===

// WiFi情報を位置にマッチング
async function matchWiFiToLocation(ssid: string, mac?: string): Promise<string | null> {
    try {
        let whereClause = 'SSID = ?';
        let params = [ssid];

        if (mac) {
            whereClause += ' AND (MAC = ? OR MAC IS NULL)';
            params.push(mac);
        }

        const results = await query(`
            SELECT LocationName FROM WifiLocation 
            WHERE ${whereClause}
            ORDER BY MAC DESC LIMIT 1
        `, params);

        return results.length > 0 ? results[0].LocationName : null;
    } catch (error) {
        console.error('WiFi位置マッチングエラー:', error);
        return null;
    }
}

// SSIDから位置を推測
async function guessLocationFromSSID(ssid: string): Promise<string> {
    // SSID名からパターンマッチングで位置を推測
    const ssidLower = ssid.toLowerCase();
    
    if (ssidLower.includes('vantan') || ssidLower.includes('school') || ssidLower.includes('edu')) {
        return '学校';
    } else if (ssidLower.includes('home') || ssidLower.includes('house') || ssidLower.includes('家')) {
        return '家';
    } else if (ssidLower.includes('cafe') || ssidLower.includes('coffee') || ssidLower.includes('starbucks')) {
        return 'カフェ';
    } else if (ssidLower.includes('library') || ssidLower.includes('図書館')) {
        return '図書館';
    } else if (ssidLower.includes('office') || ssidLower.includes('work') || ssidLower.includes('company')) {
        return 'オフィス';
    }
    
    return '外出先';
}

// ネットワーク品質から位置を推測
async function guessLocationFromNetworkQuality(userId: number, downlink: number, effectiveType: string): Promise<string> {
    try {
        // 過去の同様のネットワーク品質での位置を検索
        const similarNetworks = await query(`
            SELECT Location, COUNT(*) as Count
            FROM LocationHistory
            WHERE UserId = ? 
            AND DetectionMethod = 'network'
            AND JSON_EXTRACT(DetectionData, '$.downlink') BETWEEN ? AND ?
            AND JSON_EXTRACT(DetectionData, '$.effectiveType') = ?
            AND DetectedAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY Location
            ORDER BY Count DESC
            LIMIT 1
        `, [userId, downlink - 2, downlink + 2, effectiveType]);

        if (similarNetworks.length > 0) {
            return similarNetworks[0].Location;
        }

        // デフォルトの推測ロジック
        if (downlink > 10 && effectiveType === '4g') {
            return '学校'; // 高速回線は学校の可能性が高い
        } else if (downlink > 5) {
            return '家';
        } else {
            return '外出先';
        }
    } catch (error) {
        console.error('ネットワーク品質位置推測エラー:', error);
        return '不明';
    }
}

// GPS座標を位置名に変換
async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<string> {
    try {
        // 既知の場所の座標データベースと照合
        const knownLocations = await query(`
            SELECT LocationName, 
                   (6371 * acos(cos(radians(?)) * cos(radians(Latitude)) * 
                   cos(radians(Longitude) - radians(?)) + sin(radians(?)) * 
                   sin(radians(Latitude)))) AS Distance
            FROM GPSLocation
            HAVING Distance < 0.5
            ORDER BY Distance
            LIMIT 1
        `, [lat, lng, lat]);

        if (knownLocations.length > 0) {
            return knownLocations[0].LocationName;
        }

        // 簡易的な地域判定（実際のプロダクションでは外部APIを使用）
        return '外出先';
    } catch (error) {
        console.error('座標位置変換エラー:', error);
        return '不明';
    }
}

// IPアドレスから位置を取得
async function getLocationFromIP(ip: string): Promise<string> {
    try {
        // ローカルIPの場合
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return '家'; // ローカルネットワーク
        }

        // IPアドレスの地域判定（簡易版）
        // 実際のプロダクションでは外部のGeoIP APIを使用
        return '外出先';
    } catch (error) {
        console.error('IP位置取得エラー:', error);
        return '不明';
    }
}

// 位置検出をログに記録
async function logLocationDetection(userId: number, location: string, method: string, data: any): Promise<void> {
    try {
        const confidence = getConfidenceScore(location, data.accuracy || LocationAccuracy.LOW);
        
        await query(`
            INSERT INTO LocationHistory (UserId, Location, DetectionMethod, DetectionData, Confidence, DetectedAt)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [userId, location, method, JSON.stringify(data), confidence]);
    } catch (error) {
        console.error('位置検出ログエラー:', error);
    }
}

// WiFi位置を学習
async function learnWiFiLocation(ssid: string, mac: string | undefined, location: string, userId: number): Promise<void> {
    try {
        await query(`
            INSERT INTO WifiLocation (SSID, MAC, LocationName, LearnedBy, CreatedAt)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            LocationName = VALUES(LocationName),
            LearnedBy = VALUES(LearnedBy),
            UpdatedAt = NOW()
        `, [ssid, mac, location, userId]);
    } catch (error) {
        console.error('WiFi位置学習エラー:', error);
    }
}

// GPS位置を学習
async function learnGPSLocation(lat: number, lng: number, location: string, userId: number): Promise<void> {
    try {
        await query(`
            INSERT INTO GPSLocation (Latitude, Longitude, LocationName, LearnedBy, CreatedAt)
            VALUES (?, ?, ?, ?, NOW())
        `, [lat, lng, location, userId]);
    } catch (error) {
        console.error('GPS位置学習エラー:', error);
    }
}

// 信頼度スコアを計算
function getConfidenceScore(location: string, accuracy: LocationAccuracy): number {
    let baseScore = 50;
    
    switch (accuracy) {
        case LocationAccuracy.MANUAL:
            baseScore = 100;
            break;
        case LocationAccuracy.HIGH:
            baseScore = 85;
            break;
        case LocationAccuracy.MEDIUM:
            baseScore = 70;
            break;
        case LocationAccuracy.LOW:
            baseScore = 40;
            break;
    }
    
    // 位置が「不明」の場合は信頼度を下げる
    if (location === '不明') {
        baseScore = Math.min(baseScore, 20);
    }
    
    return baseScore;
}

// クライアントIPアドレスを取得
function getClientIP(req: any): string {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
}

// デフォルト関数
export async function index(req: any, res: any, route: any) {
    return {
        message: 'Location detection service is running',
        endpoints: {
            'POST /api/location/wifi-match': 'WiFi情報から位置を検出',
            'POST /api/location/guess': 'ネットワーク品質から位置を推測',
            'POST /api/location/reverse-geocode': 'GPS座標を位置名に変換',
            'GET /api/location/ip-location': 'IPアドレスから位置を検出',
            'POST /api/location/learn': '位置情報を学習',
            'GET /api/location/history': '位置検出履歴を取得',
            'GET /api/location/wifi-locations': 'WiFi位置情報を管理'
        }
    };
}