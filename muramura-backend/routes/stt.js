const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { SpeechClient } = require("@google-cloud/speech");
const { generateComment } = require("../services/claudeService"); //ai.js 이식하기

const router = express.Router();

// Google Cloud 서비스 계정 키 경로 설정
const keyFilePath = path.join(__dirname, "../key-polymer-451605-f2-5678117962df.json");
const client = new SpeechClient({ keyFilename: keyFilePath });

// 변환된 텍스트 저장 폴더 경로 (지금은 upload지만 flutter연동하면서 바뀔 수 있음)
const textSavePath = "uploads/texts/";

// 폴더가 없으면 생성(위와 동일)
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

        //ai.js의 기능도 추가
        //텍스트 claude한테 전달 -> claude가 변환한 텍스트 다시 저장 -> 한줄 평도 json형식으로 출력하기

        const emotion = req.body.emotion || "neutral"; // 기본값: "neutral"
        const comment = await generateComment(transcript, emotion);
        //const responce = await generateComment(transcript, emotion); //이게 claude에서 받은 풀 텍스트
        //transcript = ~;
        //const comment = ~;
        
        res.json({
            text: transcript,
            comment: comment
        });
       
    } catch (error) {
        console.error("❌ 변환 실패 상세 오류:", error); // 오류 로그 출력
        res.status(500).json({ message: "❌ 변환 실패", error: error.message });
    }
    
    
});

module.exports = router;
