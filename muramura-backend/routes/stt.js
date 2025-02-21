const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { SpeechClient } = require("@google-cloud/speech");
const { generateComment } = require("../services/claudeService");  // AI 연동

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

//Claude 응답을 파싱하는 함수 추가
function parseClaudeResponse(response) {
    try {
        if (!response || !response.content || !response.content[0] || !response.content[0].text) {
            return { text: "변환된 텍스트 없음", comment: "AI 코멘트 없음" };
        }

        const responseText = response.content[0].text;

        const textMatch = responseText.match(/-바뀐 텍스트\s*:\s*(.*)/s);
        const text = textMatch ? textMatch[1].split("\n")[0].trim() : "변환된 텍스트 없음";

        const commentMatch = responseText.match(/-코멘트\s*:\s*(.*)/s);
        const comment = commentMatch ? commentMatch[1].trim() : "AI 코멘트 없음";

        return { text, comment };
    } catch (error) {
        console.error("Claude 응답 파싱 오류:", error);
        return { text: "변환된 텍스트 없음", comment: "AI 코멘트 없음" };
    }
}

// STT + AI 변환 API
router.post("/stt", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "파일이 없습니다." });
        }

        console.log("오디오 파일 업로드 완료");

        // STT 변환
        const originalFileName = req.file.originalname.split(".")[0];
        const textFilePath = path.join(textSavePath, `${originalFileName}.txt`);
        const audioBytes = req.file.buffer.toString("base64");

        const request = {
            audio: { content: audioBytes },
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: 44100,
                languageCode: "ko-KR",
            },
        };

        console.log("Google STT API 요청 시작...");
        const [response] = await client.recognize(request);
        const transcript = response.results.map(result => result.alternatives[0].transcript).join("\n");

        console.log("STT 변환 완료:", transcript);
        fs.writeFileSync(textFilePath, transcript, "utf8");

        // 요청 바디에서 emotion 값을 가져오기 (Flutter에서 보냄)
        const emotion = req.body.emotion || "neutral"; // 기본값: "neutral"
        console.log(` 감정 데이터 수신: ${emotion}`);

        // AI 변환 요청
        const aiResponse = await generateComment(transcript, emotion);
        console.log("Claude API 응답 수신 완료");

        // Claude 응답을 파싱하여 변환된 텍스트 & 코멘트 분리
        const parsedResponse = parseClaudeResponse(aiResponse);


        res.json({
            text: parsedResponse.text,   // 변환된 문어체 일기
            comment: parsedResponse.comment  // AI 코멘트
        });

        //log 추가
        console.log("API 정상 작동 완료");

    } catch (error) {
        console.error("변환 실패 상세 오류:", error);
        res.status(500).json({ message: "변환 실패", error: error.message });
    }
});

module.exports = router;
