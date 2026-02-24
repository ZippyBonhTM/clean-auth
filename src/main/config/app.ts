import express from "express";
import router from '../routes/routes.js';
import { errorHandler } from '../middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send("Example of the response");
});

app.use(router);
app.use(errorHandler);

export default app;