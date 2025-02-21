const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { SpeechClient } = require("@google-cloud/speech");

const router = express.Router();

// Google Cloud 서비스 계정 키 경로 설정
const keyFilePath = path.join(__dirname, "../key-polymer-451605-f2-5678117962df.json");
const client = new SpeechClient({ keyFilename: keyFilePath });

// 변환된 텍스트 저장 폴더 경로
const textSavePath = "uploads/texts/";

// 폴더가 없으면 생성
if (!fs.existsSync(textSavePath)) {
    fs.mkdirSync(textSavePath, { recursive: true });
}

// 파일 업로드 설정 (메모리 저장, 서버에 파일 남기지 않음)
const upload = multer({ storage: multer.memoryStorage() });

// STT 변환 API (Google Cloud Speech-to-Text 사용)
router.post("/stt", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "❌ 파일이 없습니다." });
        }

        // 원본 파일명 가져오기
        const originalFileName = req.file.originalname.split(".")[0]; // 확장자 제거
        const textFilePath = path.join(textSavePath, `${originalFileName}.txt`); // 변환된 텍스트 저장 경로

        // 오디오 데이터 Base64 변환
        const audioBytes = req.file.buffer.toString("base64"); // 메모리에서 직접 변환

        // Google STT API 요청
        const request = {
            audio: { content: audioBytes },
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: 44100, // 기존 16000 → 44100으로 변경
                languageCode: "ko-KR",
            },
        };

        const [response] = await client.recognize(request);
        const transcript = response.results.map(result => result.alternatives[0].transcript).join("\n");

        // 변환된 텍스트를 파일로 저장
        fs.writeFileSync(textFilePath, transcript, "utf8");

        res.json({
            message: "✅ 변환 완료!",
            text: transcript,
            filePath: textFilePath // 클라이언트가 저장된 텍스트 파일 경로를 알 수 있도록 반환
        });

    } catch (error) {
        console.error("❌ STT 변환 실패:", error);
        res.status(500).json({ message: "❌ 변환 실패", error: error.message });
    }
});

module.exports = router;
