const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { SpeechClient } = require("@google-cloud/speech"); 
const { generateComment } = require("../services/claudeService");  
const SttModel = require("../models/SttModel");  // 모델 불러오기
const router = express.Router();

// Google Cloud STT 설정
const keyFilePath = path.join(__dirname, "../key-polymer-451605-f2-5678117962df.json");
const client = new SpeechClient({ keyFilename: keyFilePath });

// 변환된 텍스트 저장 폴더
const textSavePath = "uploads/texts/";
if (!fs.existsSync(textSavePath)) {
    fs.mkdirSync(textSavePath, { recursive: true });
}

// 파일 업로드 설정 (메모리 저장)
const upload = multer({ storage: multer.memoryStorage() });

// Claude API 응답을 파싱하는 함수
function parseClaudeResponse(response) {
    try {
        if (!response || !response.content || !response.content[0] || !response.content[0].text) {
            return { text: "변환된 텍스트 없음", comment: "AI 코멘트 없음" };
        }

        const responseText = response.content[0].text;
        const textMatch = responseText.match(/-바뀐 텍스트\s*:\s*([\s\S]+?)(?=\n-\s*코멘트|$)/);
        const text = textMatch ? textMatch[1].trim() : "변환된 텍스트 없음";

        const commentMatch = responseText.match(/-코멘트\s*:\s*([\s\S]+)/);
        const comment = commentMatch ? commentMatch[1].trim() : "AI 코멘트 없음";

        return { text, comment };
    } catch (error) {
        console.error("Claude 응답 파싱 오류:", error.message, "\nStack Trace:", error.stack);
        return { text: "변환된 텍스트 없음", comment: "AI 코멘트 없음" };
    }
}

// 🎯 날짜별로 `entries` 배열에 추가하는 API
router.post("/stt", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "파일이 없습니다." });
        }

        console.log("✅ 오디오 파일 업로드 완료");

        // 1️⃣ 날짜 데이터 생성 (YYYY-MM-DD 형식)
        const today = new Date();
        const dateString = today.toISOString().split("T")[0]; // "2025-02-21" 형식

        // 2️⃣ STT 변환
        const originalFileName = req.file.originalname.split(".")[0];
        const textFilePath = path.join(textSavePath, `${originalFileName}.txt`);
        const audioBytes = req.file.buffer.toString("base64");

        const request = {
            audio: { content: audioBytes },
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: 44100,
                languageCode: "ko-KR",
                speechContexts: [
                    {
                        phrases: ["해커톤", "친구", "행복"],
                        boost: 15.0
                    }
                ]
            },
        };

        console.log("📢 Google STT API 요청 시작...");
        const [response] = await client.recognize(request);
        const transcript = response.results.map(result => result.alternatives[0].transcript).join("\n");

        console.log("✅ STT 변환 완료:", transcript);
        fs.writeFileSync(textFilePath, transcript, "utf8");

        // 3️⃣ 감정 데이터 가져오기 (Flutter에서 전송)
        const emotion = req.body.emotion || "neutral"; // 기본값: "neutral"
        console.log(`📢 감정 데이터 수신: ${emotion}`);

        // 4️⃣ Claude API 호출 → AI 코멘트 생성
        const aiResponse = await generateComment(transcript, emotion);
        console.log("✅ Claude API 응답 수신 완료");

        // 5️⃣ Claude 응답을 파싱하여 변환된 텍스트 & 코멘트 분리
        const parsedResponse = parseClaudeResponse(aiResponse);

        // 6️⃣ MongoDB에서 해당 날짜의 문서를 찾음
        let sttData = await SttModel.findOne({ date: dateString });

        if (!sttData) {
            // 7️⃣ 해당 날짜의 문서가 없으면 새로 생성
            sttData = new SttModel({
                date: dateString,
                entries: [{ content: transcript, emotion, comment: parsedResponse.comment }]
            });
        } else {
            // 8️⃣ 기존 날짜 문서가 있다면 `entries` 배열에 새 데이터 추가
            sttData.entries.push({ content: transcript, emotion, comment: parsedResponse.comment });
        }

        await sttData.save(); // 9️⃣ MongoDB에 저장
        console.log("✅ MongoDB 저장 완료");

        res.json({
            text: parsedResponse.text,   // 변환된 문어체 일기
            comment: parsedResponse.comment  // AI 코멘트
        });

        console.log("🚀 API 정상 작동 완료");

    } catch (error) {
        console.error("❌ 변환 실패 상세 오류:", error);
        res.status(500).json({ message: "변환 실패", error: error.message });
    }
});

module.exports = router;
