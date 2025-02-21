require("dotenv").config();
const axios = require("axios");

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = process.env.CLAUDE_API_KEY;

console.log("Claude API Key:", API_KEY ? "✅ Loaded" : "❌ Not Found");

async function generateComment(text, emotion) {
    try {
        if (!API_KEY) {
            throw new Error("❌ Claude API Key가 설정되지 않았습니다.");
        }

        const system_prompt = `
        [일기 내용]: "${text}"
        [감정]: "${emotion}"
        - 먼저 , 일기내용을 구어체에서 문어체로 바꿔주세요. 횡설수설하게 말해도 잘 정리해서 요점만 정리해서요.
        - 문맥이 자연스럽지 않다면 자연스럽게 수정해 주세요.단 , 개인적인 일기라는걸 생각해서요.
        - 공감할 수 있는 AI 코멘트를 2문장으로 작성해 주세요.
        - 감정에 맞게 위로나 응원을 담아 주세요.
        - 사용자 친화적인 말투로 작성해 주세요.

        출력 형태를 정확히 정해줄게요.
        "-바뀐 텍스트 : ~ / -코멘트: ~" 식으로 답해주세요.
        `;

        const response = await axios.post(
            CLAUDE_API_URL,
            {
                model: "claude-3-haiku-20240307",
                max_tokens: 100,
                system: "너는 친절한 AI 코멘트 생성기야.",  // 🔥 system 메시지를 개별 필드로 분리
                messages: [
                    { role: "user", content: system_prompt }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${String(API_KEY).trim()}`,  // 공백 제거
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"  // 필수 헤더 추가
                }
            }
        );

        console.log("Claude API 응답:", response.data);

        return response.data;

    } catch (error) {
        console.error("❌ Claude API 호출 오류:", error.response ? error.response.data : error.message);
        return "AI 코멘트를 생성하는 중 오류가 발생했습니다.";
    }
}

module.exports = { generateComment };
