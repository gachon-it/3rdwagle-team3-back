require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const sttRoutes = require("./routes/stt"); //api들
const sttMonthRoutes = require("./routes/sttMonth"); // ✅ 새로운 월별 데이터 라우트 추가

const app = express();
app.use(cors());
app.use(express.json());

// 1️.환경 변수에서 MongoDB URI 가져오기 (보안 강화)
const mongoURI = process.env.MONGO_URI;  
if (!mongoURI) {
    console.error("MongoDB URI가 설정되지 않았습니다. .env 파일을 확인하세요.");
    process.exit(1);
}

// 2️.MongoDB 연결 (예외 처리 추가)
async function connectDB() {
    try {
        await mongoose.connect(mongoURI);
        console.log("MongoDB 연결 성공!");
    } catch (error) {
        console.error("MongoDB 연결 실패:", error);
        process.exit(1); // 서버 종료
    }
}

connectDB();

// 3️.API 라우트 설정
app.use("/api", sttRoutes);
app.use("/api", sttMonthRoutes); // ✅ `sttMonthRoutes` 추가

// 4️.서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
