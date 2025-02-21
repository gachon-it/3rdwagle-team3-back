require("dotenv").config();
const axios = require("axios");

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"; // Claude API 엔드포인트
const API_KEY = process.env.CLAUDE_API_KEY; // 환경변수에서 API 키 불러오기

console.log("Claude API Key:", process.env.CLAUDE_API_KEY ? "✅ Loaded" : "❌ Not Found");


async function generateComment(text, emotion) {
    try {
        const prompt = `
        [일기 내용]: "${text}"
        [감정]: "${emotion}"

        위 내용을 기반으로 공감할 수 있는 AI 코멘트를 작성해 주세요.  
        - 감정에 맞게 위로 또는 응원을 담아주세요.  
        - 너무 길지 않게 2~3문장 정도로 작성해 주세요.  
        - 사용자 친화적인 말투로 자연스럽게 작성하세요.
        `;

        const response = await axios.post(
            CLAUDE_API_URL,
            {
                model: "claude-3.5-haiku",  // 사용할 Claude 모델
                prompt: prompt,
                max_tokens: 100  // 적절한 길이 제한
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.CLAUDE_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error("❌ Claude API 호출 오류:", error.response ? error.response.data : error.message);
        return "AI 코멘트를 생성하는 중 오류가 발생했습니다.";
    }
}

module.exports = { generateComment };
