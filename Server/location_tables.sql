-- 位置検出機能用追加テーブル

-- 位置検出履歴テーブル
CREATE TABLE IF NOT EXISTS LocationHistory (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    Location VARCHAR(100) NOT NULL,
    DetectionMethod ENUM('wifi', 'gps', 'network', 'ip', 'manual') NOT NULL,
    DetectionData JSON,
    Confidence INT DEFAULT 50, -- 信頼度 (0-100)
    DetectedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES User(Id) ON DELETE CASCADE,
    INDEX idx_user_location_time (UserId, DetectedAt),
    INDEX idx_location_method (Location, DetectionMethod)
);

-- GPS位置情報テーブル
CREATE TABLE IF NOT EXISTS GPSLocation (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Latitude DECIMAL(10, 8) NOT NULL,
    Longitude DECIMAL(11, 8) NOT NULL,
    LocationName VARCHAR(100) NOT NULL,
    Accuracy DECIMAL(8, 2) DEFAULT 0, -- GPS精度（メートル）
    LearnedBy INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (LearnedBy) REFERENCES User(Id) ON DELETE SET NULL,
    INDEX idx_coordinates (Latitude, Longitude),
    INDEX idx_location_name (LocationName)
);

-- WiFi位置情報テーブル（既存のWifiLocationを拡張）
ALTER TABLE WifiLocation 
ADD COLUMN IF NOT EXISTS Accuracy INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS LearnedBy INT,
ADD COLUMN IF NOT EXISTS UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD FOREIGN KEY (LearnedBy) REFERENCES User(Id) ON DELETE SET NULL;

-- ネットワーク品質履歴テーブル
CREATE TABLE IF NOT EXISTS NetworkQualityHistory (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    Location VARCHAR(100),
    ConnectionType VARCHAR(50),
    EffectiveType VARCHAR(20),
    Downlink DECIMAL(10, 2),
    RTT INT,
    SaveData BOOLEAN DEFAULT FALSE,
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES User(Id) ON DELETE CASCADE,
    INDEX idx_user_time (UserId, Timestamp),
    INDEX idx_network_quality (EffectiveType, Downlink)
);

-- 位置学習統計テーブル
CREATE TABLE IF NOT EXISTS LocationLearningStats (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    Location VARCHAR(100) NOT NULL,
    DetectionMethod ENUM('wifi', 'gps', 'network', 'ip', 'manual') NOT NULL,
    SuccessCount INT DEFAULT 0,
    FailureCount INT DEFAULT 0,
    AverageConfidence DECIMAL(5, 2) DEFAULT 0,
    LastUsed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES User(Id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_location_method (UserId, Location, DetectionMethod),
    INDEX idx_user_location (UserId, Location)
);

-- 基本的なGPS位置データを追加（サンプル）
INSERT IGNORE INTO GPSLocation (Latitude, Longitude, LocationName, Accuracy) VALUES
(35.6762, 139.6503, '東京駅', 10.0),
(35.6895, 139.6917, '東京スカイツリー', 15.0),
(35.6584, 139.7016, '皇居', 20.0),
(35.6751, 139.7648, '秋葉原', 12.0),
(35.6598, 139.7006, '銀座', 10.0);

-- WiFi位置情報を拡張（既存データの更新）
UPDATE WifiLocation SET Accuracy = 90 WHERE SSID LIKE '%VANTAN%';
UPDATE WifiLocation SET Accuracy = 80 WHERE LocationName = '学校';
UPDATE WifiLocation SET Accuracy = 85 WHERE LocationName = '家';

-- 位置検出設定テーブル
CREATE TABLE IF NOT EXISTS LocationDetectionSettings (
    UserId INT PRIMARY KEY,
    AutoDetection BOOLEAN DEFAULT TRUE,
    PreferredMethod ENUM('wifi', 'gps', 'network', 'ip', 'manual') DEFAULT 'wifi',
    UpdateInterval INT DEFAULT 300, -- 秒
    MinConfidence INT DEFAULT 50,
    EnableLearning BOOLEAN DEFAULT TRUE,
    NotifyOnLocationChange BOOLEAN DEFAULT TRUE,
    PrivacyLevel ENUM('public', 'friends', 'private') DEFAULT 'friends',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES User(Id) ON DELETE CASCADE
);

-- インデックス追加（パフォーマンス向上）
CREATE INDEX idx_locationhistory_user_time ON LocationHistory(UserId, DetectedAt DESC);
CREATE INDEX idx_locationhistory_location ON LocationHistory(Location, DetectedAt DESC);
CREATE INDEX idx_gpslocation_coordinates ON GPSLocation(Latitude, Longitude);
CREATE INDEX idx_wifilocation_ssid_mac ON WifiLocation(SSID, MAC);
CREATE INDEX idx_networkquality_user_time ON NetworkQualityHistory(UserId, Timestamp DESC);

-- 位置検出統計ビュー
CREATE OR REPLACE VIEW LocationDetectionStats AS
SELECT 
    u.Id as UserId,
    u.Name as UserName,
    us.Location as CurrentLocation,
    us.LastUpdate as LastLocationUpdate,
    COUNT(lh.Id) as TotalDetections,
    AVG(lh.Confidence) as AverageConfidence,
    MAX(lh.DetectedAt) as LastDetection,
    COUNT(DISTINCT lh.Location) as UniqueLocations
FROM User u
LEFT JOIN UserStatus us ON u.Id = us.UserId
LEFT JOIN LocationHistory lh ON u.Id = lh.UserId
WHERE lh.DetectedAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.Id, u.Name, us.Location, us.LastUpdate;

-- 人気のWiFiスポットビュー
CREATE OR REPLACE VIEW PopularWiFiSpots AS
SELECT 
    w.SSID,
    w.LocationName,
    w.Accuracy,
    COUNT(lh.Id) as UsageCount,
    COUNT(DISTINCT lh.UserId) as UniqueUsers,
    AVG(lh.Confidence) as AverageConfidence,
    MAX(lh.DetectedAt) as LastUsed
FROM WifiLocation w
LEFT JOIN LocationHistory lh ON JSON_EXTRACT(lh.DetectionData, '$.ssid') = w.SSID
WHERE lh.DetectedAt > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY w.SSID, w.LocationName, w.Accuracy
ORDER BY UsageCount DESC;

-- サンプル位置検出設定データ
INSERT IGNORE INTO LocationDetectionSettings (UserId, AutoDetection, PreferredMethod, UpdateInterval, MinConfidence) 
SELECT Id, TRUE, 'wifi', 300, 60 FROM User LIMIT 10;

-- データクリーンアップ用ストアドプロシージャ
DELIMITER //
CREATE PROCEDURE CleanupOldLocationData()
BEGIN
    -- 90日以上古い位置履歴を削除
    DELETE FROM LocationHistory WHERE DetectedAt < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- 30日以上古いネットワーク品質履歴を削除
    DELETE FROM NetworkQualityHistory WHERE Timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- 使用されていないWiFi位置情報を削除
    DELETE w FROM WifiLocation w
    LEFT JOIN LocationHistory lh ON JSON_EXTRACT(lh.DetectionData, '$.ssid') = w.SSID
    WHERE w.CreatedAt < DATE_SUB(NOW(), INTERVAL 180 DAY)
    AND lh.Id IS NULL;
END //
DELIMITER ;

-- 定期実行イベント（MySQLのイベントスケジューラー）
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS cleanup_location_data
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO CALL CleanupOldLocationData();