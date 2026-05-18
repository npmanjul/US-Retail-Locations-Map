import express from "express";
import cors from "cors";
import router from "./routes/index.ts";
import { seedDatabase } from "./startup/seedDatabase.ts";
import CONFIG from "./constants/index.ts";

const app = express();

app.use(
  cors({
    origin: CONFIG.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/v1", router);

seedDatabase()
  .then(() => {
    app.listen(CONFIG.PORT, () => {
      console.log(
        `========================== Server running on ${CONFIG.PORT} ===========================`,
      );
    });
  })
  .catch((error) => {
    console.log(error);
  });
