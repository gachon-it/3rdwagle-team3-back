require("dotenv").config();
const axios = require("axios");

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"; // Claude API 엔드포인트
const API_KEY = process.env.CLAUDE_API_KEY; // 환경변수에서 API 키 불러오기

console.log("Claude API Key:", API_KEY ? "✅ Loaded" : "❌ Not Found");

async function testClaudeAPI() {
    try {
        const response = await axios.post(
            CLAUDE_API_URL,
            {
                model: "claude-3-haiku-20240307",
                max_tokens: 100,
                messages: [
                    {
                        role: "user",
                        content: "안녕하세요! 오늘 하루 어떠셨나요?"
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "X-API-Key": API_KEY,  // 추가 헤더 설정
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                }
            }
        );

        console.log("✅ Claude API 응답:", response.data);
    } catch (error) {
        console.error("❌ Claude API 호출 오류:", error.response ? error.response.data : error.message);
    }
}

console.log("✅ API Key:", `"${API_KEY}"`);


// API 테스트 실행
testClaudeAPI();
