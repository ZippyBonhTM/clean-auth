import process from "process";
import app from "@/main/config/app.js";
import { config } from 'dotenv';
config();

const PORT = process.env.APPLICATION_PORT;

if (!PORT) {
  throw new Error('.env have not been configured/PORT')
}

app.listen(PORT, () => {
  console.log(`Example app listening port ${PORT}`);
})