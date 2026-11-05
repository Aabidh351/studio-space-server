
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());


const client = new MongoClient(process.env.MONGO_URI);
let db;

const connectDB = async () => {
  try {
    await client.connect();
    db = client.db("studiospace");
    console.log("MongoDB connected!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};


app.get("/", (req, res) => {
  res.send({ message: "StudioSpace API is running!" });
});


app.get("/api/studios", async (req, res) => {
  try {
    const studios = await db
      .collection("studios")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.send(studios);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studios" });
  }
});


app.get("/api/studios/featured", async (req, res) => {
  try {
    const studios = await db
      .collection("studios")
      .find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.send(studios);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch featured studios" });
  }
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
