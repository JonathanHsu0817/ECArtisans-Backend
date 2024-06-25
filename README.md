# ECArtisans 商店買家購物平台後端系統

![start](https://img.shields.io/github/stars/JonathanHsu0817/ECArtisans-Backend.svg)｜
![forks](https://img.shields.io/github/forks/JonathanHsu0817/ECArtisans-Backend.svg)｜
![issues-pr](https://img.shields.io/github/issues-pr/JonathanHsu0817/ECArtisans-Backend.svg)｜
![issues](https://img.shields.io/github/issues/JonathanHsu0817/ECArtisans-Backend.svg)

## 關於專案

ECArtisans 是一個專為商店買家設計的購物平台後端系統，提供了豐富的 API 以支援商品管理、訂單處理、折價券、活動等功能。

## API 串接示範

```js
fetch('http://localhost:3000/products', { method: 'GET' })
	.then((response) => response.json())
	.then((res) => {
		// { status: 'true', result: [{...}] }
		console.log(res);
	});
```

### 安裝

Node.js 版本建議為：`20.12` 以上

### 取得專案

```bash
git clone https://github.com/JonathanHsu0817/ECArtisans-Backend.git
```

### 移動到專案內

```bash
cd ECArtisans-Backend
```

### 安裝套件

```bash
npm install
```

### 環境變數設定

請在終端機輸入 `cp .env.example .env` 來複製 .env.example 檔案，並依據 `.env` 內容調整相關欄位。

### 環境變數範例與說明

> 底下皆為假的資料，請依照自己的資料來設定

```bash
# 環境變數，區分開發環境或正式環境(dev、prod)
NODE_ENV = dev

# MongoDB 連結
DATABASE = mongodb connection string

# JTW Token 密鑰
JWT_SECRET = this is my jwt token
JWT_EXPIRES_DAY = this is my expire day

# Firebase 密鑰
FIREBASE_TYPE =
FIREBASE_PROJECT_ID =
FIREBASE_PRIVATE_KEY_ID =
FIREBASE_PRIVATE_KEY =
FIREBASE_CLIENT_EMAIL =
FIREBASE_CLIENT_ID =
FIREBASE_AUTH_URI =
FIREBASE_TOKEN_URI =
FIREBASE_AUTH_PROVIDER_X509_CERT_URL =
FIREBASE_CLIENT_X509_CERT_URL =

# 藍新金流相關資訊
MerchantID=
HASHKEY=
HASHIV=
Version= # 串接程式版本，2023 年版本為 2.0
ReturnUrl=
NotifyUrl=
PayGateWay= # 測試機、正式機 API 路徑
```

### 運行專案

```bash
npm run start
```

### 開啟專案

在瀏覽器網址列輸入以下即可看到畫面

```bash
http://127.0.0.1:3005/
```

## 資料夾說明

```txt
newswave-backend
├─ public                   // 靜態資源放置處
├─ app.js                  // 入口點
├─ controllers              // 控制器
├─ middlewares              // 中間件
├─ models                   // 資料庫模型
├─ routes                   // 路由
├─ service                  // 工具
├─ views                    //畫面
├─ .env.example             // 環境變數範例
├─ .gitignore               // Git 忽略檔案
├─ package-lock.json
└─ package.json
```

## 專案技術

- node.js v20.12.2
- express v4.19.2
- mongoose v8.3.1
- jsonwebtoken v9.0.2

## 專案指令列表

```bash
# 開發指令 : 適用於開發環境
npm run dev

# 啟動指令 : 使用 node 來啟動專案，適用於正式環境
npm run start
```

## CI/CD

此專案有使用 Render 服務部屬，當專案 merge 到 master 時會自動執行以下動作：

- 建立 Node.js 環境
- 安裝相依套件
- 編譯程式碼
- 部署到 render

## 開發團隊

- [JonathanHsu0817](https://github.com/JonathanHsu0817)
- [theallisonlai](https://github.com/laijiayu)
- [abigailkuo0406](https://github.com/abigailkuo0406)
