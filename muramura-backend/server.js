require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sttRoutes = require("./routes/stt");
//const aiRoutes = require("./routes/ai");


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", sttRoutes);
//app.use("/api", aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));