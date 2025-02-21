const express = require("express");
const { generateComment } = require("../services/claudeService");

const router = express.Router();

router.post("/generate-comment", async (req, res) => {
    try {
        const { text, emotion } = req.body;

        if (!text || !emotion) {
            return res.status(400).json({ error: "텍스트와 감정 데이터가 필요합니다." });
        }

        const comment = await generateComment(text, emotion);
        res.json({ comment });
    } catch (error) {
        console.error("❌ 코멘트 생성 API 오류:", error);
        res.status(500).json({ error: "서버 오류 발생" });
    }
});

module.exports = router;
