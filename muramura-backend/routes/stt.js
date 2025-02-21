const express = require("express");
const axios = require("axios");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();

// 파일 업로드 설정 (uploads 폴더에 저장)
const upload = multer({ dest: "uploads/" });

// STT 변환 API
router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "❌ 파일이 없습니다." });
    }

    const filePath = req.file.path; // 업로드된 파일 경로
    const audioBytes = fs.readFileSync(filePath).toString("base64"); // 파일을 Base64로 변환

    // Google STT API 호출
    const response = await axios.post(
      `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_API_KEY}`,
      {
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "ko-KR",
        },
        audio: { content: audioBytes },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // 변환된 텍스트 가져오기
    const transcript = response.data.results[0]?.alternatives[0]?.transcript || "";

    // 결과 반환
    res.json({ message: "✅ 변환 완료!", text: transcript });
  } catch (error) {
    console.error("❌ STT 변환 실패:", error);
    res.status(500).json({ message: "❌ 변환 실패", error: error.message });
  }
});

module.exports = router;
