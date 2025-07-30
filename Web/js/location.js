// Location Detection Module
class LocationDetector {
    constructor() {
        this.isDetecting = false;
        this.currentLocation = null;
        this.lastUpdate = null;
        this.updateInterval = null;
        this.callbacks = [];
    }

    // 位置検出を開始
    async startDetection() {
        if (this.isDetecting) return;
        
        this.isDetecting = true;
        console.log('位置検出を開始しました');
        
        // 初回検出
        await this.detectLocation();
        
        // 定期的に位置を更新（5分間隔）
        this.updateInterval = setInterval(async () => {
            await this.detectLocation();
        }, 5 * 60 * 1000);
    }

    // 位置検出を停止
    stopDetection() {
        if (!this.isDetecting) return;
        
        this.isDetecting = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('位置検出を停止しました');
    }

    // 位置を検出
    async detectLocation() {
        try {
            let location = await this.detectLocationFromMultipleSources();
            
            if (location && location !== this.currentLocation) {
                this.currentLocation = location;
                this.lastUpdate = new Date();
                
                // サーバーに位置情報を送信
                await this.updateLocationOnServer(location);
                
                // コールバック実行
                this.notifyCallbacks(location);
                
                console.log(`位置が更新されました: ${location}`);
            }
        } catch (error) {
            console.error('位置検出エラー:', error);
        }
    }

    // 複数のソースから位置を検出
    async detectLocationFromMultipleSources() {
        // 1. WiFi情報から検出
        let wifiLocation = await this.detectFromWiFi();
        if (wifiLocation) return wifiLocation;

        // 2. ブラウザの位置情報APIから検出
        let gpsLocation = await this.detectFromGPS();
        if (gpsLocation) return gpsLocation;

        // 3. IPアドレスから検出
        let ipLocation = await this.detectFromIP();
        if (ipLocation) return ipLocation;

        // 4. 手動設定された位置
        let manualLocation = this.getManualLocation();
        if (manualLocation) return manualLocation;

        return '不明';
    }

    // WiFi情報から位置を検出
    async detectFromWiFi() {
        try {
            // Navigator.connection APIを使用（対応ブラウザのみ）
            if ('connection' in navigator) {
                const connection = navigator.connection;
                if (connection && connection.effectiveType) {
                    // WiFi接続の場合はネットワーク情報を取得
                    if (connection.type === 'wifi' || connection.effectiveType === '4g') {
                        return await this.getWiFiNetworkInfo();
                    }
                }
            }

            // Web API経由でWiFi情報を取得（制限あり）
            return await this.getWiFiFromWebAPI();
        } catch (error) {
            console.warn('WiFi検出エラー:', error);
            return null;
        }
    }

    // WiFiネットワーク情報を取得
    async getWiFiNetworkInfo() {
        try {
            // 実際のブラウザではセキュリティ制限により直接WiFi情報は取得できないため、
            // 代替手段としてネットワーク品質から推測
            const connection = navigator.connection;
            
            if (connection) {
                const effectiveType = connection.effectiveType;
                const downlink = connection.downlink;
                
                // ネットワーク品質から場所を推測
                if (effectiveType === '4g' && downlink > 10) {
                    // 高速な4G/WiFi接続 → 学校または家の可能性
                    return await this.guessLocationFromNetworkQuality(downlink, effectiveType);
                }
            }
            
            return null;
        } catch (error) {
            console.warn('WiFiネットワーク情報取得エラー:', error);
            return null;
        }
    }

    // ネットワーク品質から位置を推測
    async guessLocationFromNetworkQuality(downlink, effectiveType) {
        try {
            // サーバーのネットワーク品質データベースと照合
            const response = await fetch('/api/location/guess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    downlink: downlink,
                    effectiveType: effectiveType,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.location;
            }
            
            return null;
        } catch (error) {
            console.warn('ネットワーク品質位置推測エラー:', error);
            return null;
        }
    }

    // Web API経由でWiFi情報を取得（制限付き）
    async getWiFiFromWebAPI() {
        try {
            // PCアプリケーション経由でWiFi情報を取得
            if (window.electronAPI) {
                return await window.electronAPI.getWiFiInfo();
            }
            
            // ローカルストレージから以前に保存されたWiFi情報を取得
            const savedWiFi = localStorage.getItem('lastKnownWiFi');
            if (savedWiFi) {
                const wifiData = JSON.parse(savedWiFi);
                // 24時間以内のデータのみ使用
                if (new Date() - new Date(wifiData.timestamp) < 24 * 60 * 60 * 1000) {
                    return await this.matchWiFiToLocation(wifiData.ssid, wifiData.mac);
                }
            }
            
            return null;
        } catch (error) {
            console.warn('Web API WiFi取得エラー:', error);
            return null;
        }
    }

    // WiFi情報を位置にマッチング
    async matchWiFiToLocation(ssid, mac) {
        try {
            const response = await fetch('/api/location/wifi-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ssid, mac })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.location;
            }
            
            return null;
        } catch (error) {
            console.warn('WiFi位置マッチングエラー:', error);
            return null;
        }
    }

    // GPS位置情報から検出
    async detectFromGPS() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const location = await this.reverseGeocode(latitude, longitude);
                        resolve(location);
                    } catch (error) {
                        console.warn('GPS位置変換エラー:', error);
                        resolve(null);
                    }
                },
                () => resolve(null),
                { timeout: 10000, enableHighAccuracy: false }
            );
        });
    }

    // 座標を場所名に変換
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch('/api/location/reverse-geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lng })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.location;
            }
            
            return null;
        } catch (error) {
            console.warn('逆ジオコーディングエラー:', error);
            return null;
        }
    }

    // IPアドレスから位置を検出
    async detectFromIP() {
        try {
            const response = await fetch('/api/location/ip-location');
            if (response.ok) {
                const result = await response.json();
                return result.location;
            }
            return null;
        } catch (error) {
            console.warn('IP位置検出エラー:', error);
            return null;
        }
    }

    // 手動設定された位置を取得
    getManualLocation() {
        return localStorage.getItem('manualLocation');
    }

    // 手動で位置を設定
    setManualLocation(location) {
        localStorage.setItem('manualLocation', location);
        this.currentLocation = location;
        this.lastUpdate = new Date();
        this.updateLocationOnServer(location);
        this.notifyCallbacks(location);
    }

    // サーバーに位置情報を更新
    async updateLocationOnServer(location) {
        try {
            const response = await fetch('/api/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: location,
                    timestamp: new Date().toISOString(),
                    source: 'auto_detection'
                })
            });
            
            if (!response.ok) {
                console.warn('位置情報サーバー更新に失敗:', response.statusText);
            }
        } catch (error) {
            console.error('位置情報サーバー更新エラー:', error);
        }
    }

    // WiFi情報を保存（PCアプリから受信）
    saveWiFiInfo(ssid, mac) {
        const wifiData = {
            ssid: ssid,
            mac: mac,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('lastKnownWiFi', JSON.stringify(wifiData));
        
        // 即座に位置を再検出
        this.detectLocation();
    }

    // 位置変更コールバックを追加
    addLocationCallback(callback) {
        this.callbacks.push(callback);
    }

    // 位置変更コールバックを削除
    removeLocationCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }

    // コールバックに通知
    notifyCallbacks(location) {
        this.callbacks.forEach(callback => {
            try {
                callback(location, this.lastUpdate);
            } catch (error) {
                console.error('位置変更コールバックエラー:', error);
            }
        });
    }

    // 現在の位置を取得
    getCurrentLocation() {
        return {
            location: this.currentLocation,
            lastUpdate: this.lastUpdate,
            isDetecting: this.isDetecting
        };
    }

    // 利用可能な位置のリストを取得
    getAvailableLocations() {
        return ['学校', '家', '図書館', 'カフェ', '外出先', '不明'];
    }
}

// グローバルインスタンス
window.locationDetector = new LocationDetector();

// PCアプリからのメッセージを受信
window.addEventListener('message', (event) => {
    if (event.data.type === 'wifi-info') {
        window.locationDetector.saveWiFiInfo(event.data.ssid, event.data.mac);
    }
});

// ページロード時に位置検出を開始
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.locationDetector.startDetection();
    }, 1000);
});

// ページ離脱時に位置検出を停止
window.addEventListener('beforeunload', () => {
    window.locationDetector.stopDetection();
});