-- COCOIRU用データベーステーブル

-- ユーザーステータステーブル
CREATE TABLE IF NOT EXISTS UserStatus (
    UserId INT PRIMARY KEY,
    Location VARCHAR(100) DEFAULT '不明',
    Status ENUM('online', 'offline', 'away') DEFAULT 'offline',
    CurrentActivity VARCHAR(255),
    LastUpdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES User(Id) ON DELETE CASCADE
);

-- タスクテーブル
CREATE TABLE IF NOT EXISTS Task (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    ScheduledTime DATETIME NOT NULL,
    Status ENUM('pending', 'completed', 'postponed', 'cancelled') DEFAULT 'pending',
    Priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES User(Id) ON DELETE CASCADE
);

-- ヘルプ要請テーブル
CREATE TABLE IF NOT EXISTS HelpRequest (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    Message TEXT,
    RequestTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('active', 'resolved', 'cancelled') DEFAULT 'active',
    ResolvedBy INT,
    ResolvedAt TIMESTAMP NULL,
    FOREIGN KEY (UserId) REFERENCES User(Id) ON DELETE CASCADE,
    FOREIGN KEY (ResolvedBy) REFERENCES User(Id) ON DELETE SET NULL
);

-- アクティビティログテーブル
CREATE TABLE IF NOT EXISTS ActivityLog (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    WindowTitle VARCHAR(255),
    ApplicationName VARCHAR(255),
    Duration INT DEFAULT 0, -- 秒単位
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES User(Id) ON DELETE CASCADE
);

-- WiFi情報テーブル（位置判定用）
CREATE TABLE IF NOT EXISTS WifiLocation (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    SSID VARCHAR(255) NOT NULL,
    MAC VARCHAR(17),
    LocationName VARCHAR(100) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ssid_mac (SSID, MAC)
);

-- 基本的なWiFi位置情報を追加
INSERT IGNORE INTO WifiLocation (SSID, LocationName) VALUES
('VANTAN', '学校'),
('VANTAN-STAFF', '学校'),
('VANTAN-STUDENT', '学校'),
('SCHOOL-WIFI', '学校'),
('HOME-WIFI', '家'),
('HOME', '家');

-- サンプルタスクデータ（テスト用）
INSERT IGNORE INTO Task (UserId, Name, Description, ScheduledTime, Priority) VALUES
(1, '朝の勉強会', 'プログラミング基礎の復習', CONCAT(CURDATE(), ' 09:00:00'), 'high'),
(1, 'ランチタイム', '昼食を取る', CONCAT(CURDATE(), ' 12:00:00'), 'medium'),
(1, 'プロジェクト作業', 'Webアプリケーションの開発', CONCAT(CURDATE(), ' 14:00:00'), 'high'),
(1, '振り返り会議', '今日の作業内容を振り返る', CONCAT(CURDATE(), ' 17:00:00'), 'medium');

-- インデックス作成（パフォーマンス向上のため）
CREATE INDEX idx_userstatus_userid ON UserStatus(UserId);
CREATE INDEX idx_task_userid_date ON Task(UserId, ScheduledTime);
CREATE INDEX idx_helprequest_status ON HelpRequest(Status, RequestTime);
CREATE INDEX idx_activitylog_userid_timestamp ON ActivityLog(UserId, Timestamp);