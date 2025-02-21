const mongoose = require("mongoose");

const SttSchema = new mongoose.Schema({
    date: { type: String, required: true }, // 날짜 (예: "2025-01-01")
    entries: [
        {
            content: String,   // STT 변환된 문장
            emotion: String,   // 감정 데이터
            comment: String    // AI가 생성한 코멘트
        }
    ]
});

module.exports = mongoose.model("SttModel", SttSchema);

