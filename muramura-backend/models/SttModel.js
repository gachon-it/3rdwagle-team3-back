const mongoose = require("mongoose");

const SttSchema = new mongoose.Schema({
    originalFileName: String, // 원본 파일 이름
    transcript: String,       // STT 변환된 텍스트
    aiText: String,           // Claude가 수정한 문어체 텍스트
    aiComment: String,        // AI가 생성한 코멘트
    emotion: String,          // 감정 데이터 (Flutter에서 전송)
    createdAt: { type: Date, default: Date.now } // 저장된 시간
});

const SttModel = mongoose.model("STTRecord", SttSchema);

module.exports = SttModel;
