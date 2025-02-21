const express = require("express");
const router = express.Router();

// 감정 분석 API
router.post("/ai", async (req, res) => {
  try {
    const { text, emotion } = req.body;

    if (!text || !emotion) {
      return res.status(400).json({ message: "❌ 텍스트와 감정을 입력해주세요." });
    }

    // 간단한 AI 코멘트 생성 (이후 claude API로 확장 가능)
    const emotionComments = {
      happy: "오늘 정말 기분 좋은 하루였군요! 😊",
      sad: "조금 힘든 하루였나 보군요. 내일은 더 나아질 거예요! 💙",
      angry: "스트레스 받는 일이 있었군요. 심호흡을 해볼까요? 😤",
      neutral: "평온한 하루였군요. 꾸준한 기록은 큰 힘이 돼요! 🌿",
    };

    const aiComment = emotionComments[emotion] || "오늘 하루를 기록해주셔서 감사해요!";

    res.json({ message: "✅ AI 분석 완료!", ai_comment: aiComment });
  } catch (error) {
    console.error("❌ AI 분석 실패:", error);
    res.status(500).json({ message: "❌ 분석 실패", error: error.message });
  }
});

module.exports = router;
