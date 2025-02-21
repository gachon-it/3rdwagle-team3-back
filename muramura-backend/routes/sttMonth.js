const express = require("express");
const SttModel = require("../models/SttModel");
const router = express.Router();

// 🎯 특정 월의 STT 데이터를 가져오는 API (입력: YYYY-MM-DD → 검색 기준: YYYY-MM)
router.get("/sttmonth", async (req, res) => {
    try {
        const { month } = req.query;

        // 📌 month 값이 없는 경우 오류 반환
        if (!month) return res.status(400).json({ error: "날짜(`YYYY-MM-DD`)을 제공해야 합니다." });

        // 📌 "YYYY-MM"만 추출해서 월 기준으로 필터링
        const monthOnly = month.substring(0, 7); // "2025-02-22" → "2025-02"

        // 📌 해당 월(`YYYY-MM`)에 포함된 모든 데이터를 조회 (정규식 활용)
        const regex = new RegExp(`^${monthOnly}-\\d{2}$`); // "2025-02-XX" 형식과 매칭
        const sttDataList = await SttModel.find({ date: { $regex: regex } });

        // 📌 해당 월의 데이터가 없으면 404 반환
        if (sttDataList.length === 0) return res.status(404).json({ error: "해당 월의 데이터가 없습니다." });

        // 📌 데이터를 `{ "YYYY-MM-DD": entries }` 형태로 변환
        const responseData = {};
        sttDataList.forEach(stt => {
            responseData[stt.date] = stt.entries;
        });

        // ✅ 응답을 클라이언트에게 반환
        return res.status(200).json(responseData);
    } catch (error) {
        console.error("❌ 월별 데이터 조회 오류:", error);
        res.status(500).json({ error: "월별 데이터를 가져오는 중 오류가 발생했습니다." });
    }
});

// 📌 반드시 추가해야 API가 정상 작동!
module.exports = router;
