
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
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

app.post("/api/studios", async (req, res) => {
  try {
    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      imageUrl,
      amenities,
      overview,
      ownerName,
      ownerEmail,
    } = req.body;

    if (
      !title ||
      !category ||
      !hourlyRate ||
      securityDeposit === undefined ||
      !maxCapacity ||
      !location ||
      !imageUrl ||
      !overview ||
      !ownerName ||
      !ownerEmail ||
      !Array.isArray(amenities) ||
      amenities.length === 0
    ) {
      return res.status(400).send({
        message: "Please provide all required studio information.",
      });
    }

    if (
      Number(hourlyRate) <= 0 ||
      Number(securityDeposit) < 0 ||
      Number(maxCapacity) <= 0
    ) {
      return res.status(400).send({
        message: "Please provide valid rate, deposit, and capacity values.",
      });
    }

    const newStudio = {
      title: title.trim(),
      category,
      hourlyRate: Number(hourlyRate),
      securityDeposit: Number(securityDeposit),
      maxCapacity: Number(maxCapacity),
      location: location.trim(),
      imageUrl: imageUrl.trim(),
      amenities,
      overview: overview.trim(),
      ownerName,
      ownerEmail,
      createdAt: new Date(),
    };

    const result = await db.collection("studios").insertOne(newStudio);

    res.status(201).send({
      message: "Studio created successfully!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Add studio error:", error);

    res.status(500).send({
      message: "Failed to create studio.",
    });
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

app.get("/api/studios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid studio ID",
      });
    }

    const studio = await db.collection("studios").findOne({
      _id: new ObjectId(id),
    });

    if (!studio) {
      return res.status(404).send({
        message: "Studio not found",
      });
    }

    res.send(studio);
  } catch (error) {
    console.error("Get studio error:", error);

    res.status(500).send({
      message: "Failed to fetch studio",
    });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await db
      .collection("categories")
      .find()
      .sort({ order: 1 })
      .toArray();

    res.send(categories);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch categories" });
  }
});

app.get("/api/steps", async (req, res) => {
  try {
    const steps = await db
      .collection("steps")
      .find()
      .sort({ number: 1 })
      .toArray();

    res.send(steps);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch steps" });
  }
});

app.get("/api/my-listings", async (req, res) => {
  try {
    const { ownerEmail } = req.query;

    if (!ownerEmail) {
      return res.status(400).send({
        message: "Owner email is required.",
      });
    }

    const studios = await db
      .collection("studios")
      .find({ ownerEmail })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(studios);
  } catch (error) {
    console.error("My listings error:", error);

    res.status(500).send({
      message: "Failed to fetch your listings.",
    });
  }
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
