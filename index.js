
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

app.delete("/api/studios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerEmail } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid studio ID." });
    }

    if (!ownerEmail) {
      return res.status(400).send({ message: "Owner email is required." });
    }

    const result = await db.collection("studios").deleteOne({
      _id: new ObjectId(id),
      ownerEmail,
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Studio not found or you are not authorized to delete it.",
      });
    }

    res.send({ message: "Studio deleted successfully!" });
  } catch (error) {
    console.error("Delete studio error:", error);
    res.status(500).send({ message: "Failed to delete studio." });
  }
});


app.put("/api/studios/:id", async (req, res) => {
  try {
    const { id } = req.params;
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
      ownerEmail,
    } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid studio ID." });
    }

    if (
      !title ||
      !category ||
      !location ||
      !imageUrl ||
      !overview ||
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

    const result = await db.collection("studios").updateOne(
      {
        _id: new ObjectId(id),
        ownerEmail,
      },
      {
        $set: {
          title: title.trim(),
          category,
          hourlyRate: Number(hourlyRate),
          securityDeposit: Number(securityDeposit),
          maxCapacity: Number(maxCapacity),
          location: location.trim(),
          imageUrl: imageUrl.trim(),
          amenities,
          overview: overview.trim(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Studio not found or you are not authorized to edit it.",
      });
    }

    res.send({ message: "Studio updated successfully!" });
  } catch (error) {
    console.error("Update studio error:", error);

    res.status(500).send({
      message: "Failed to update studio.",
    });
  }
});


app.post("/api/bookings", async (req, res) => {
  try {
    const {
      studioId,
      bookingDate,
      startTime,
      endTime,
      customerName,
      customerEmail,
    } = req.body;

    if (
      !studioId ||
      !bookingDate ||
      !startTime ||
      !endTime ||
      !customerName ||
      !customerEmail
    ) {
      return res.status(400).send({
        message: "Please provide all booking information.",
      });
    }

    if (!ObjectId.isValid(studioId)) {
      return res.status(400).send({ message: "Invalid studio ID." });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(endTime)
    ) {
      return res.status(400).send({
        message: "Invalid booking date or time.",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).send({
        message: "End time must be later than start time.",
      });
    }

    const selectedDate = new Date(`${bookingDate}T${startTime}:00`);
    const now = new Date();

    if (Number.isNaN(selectedDate.getTime()) || selectedDate <= now) {
      return res.status(400).send({
        message: "Please select a future booking date and time.",
      });
    }

    const studio = await db.collection("studios").findOne({
      _id: new ObjectId(studioId),
    });

    if (!studio) {
      return res.status(404).send({ message: "Studio not found." });
    }

    const existingBooking = await db.collection("bookings").findOne({
      studioId,
      bookingDate,
      status: "Confirmed",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (existingBooking) {
      return res.status(409).send({
        message: "This time slot is already booked.",
      });
    }

    const duration =
      (new Date(`1970-01-01T${endTime}:00`).getTime() -
        new Date(`1970-01-01T${startTime}:00`).getTime()) /
      (1000 * 60 * 60);

    const totalAmount = duration * studio.hourlyRate;

    const newBooking = {
      studioId,
      studioTitle: studio.title,
      ownerName: studio.ownerName,
      ownerEmail: studio.ownerEmail,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      bookingDate,
      startTime,
      endTime,
      duration,
      hourlyRate: studio.hourlyRate,
      securityDeposit: studio.securityDeposit,
      totalAmount,
      status: "Pending",
      createdAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(newBooking);

    res.status(201).send({
      message: "Booking request submitted successfully!",
      bookingId: result.insertedId,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    res.status(500).send({
      message: "Failed to create booking.",
    });
  }
});


app.get("/api/my-bookings", async (req, res) => {
  try {
    const { customerEmail } = req.query;

    if (!customerEmail) {
      return res.status(400).send({
        message: "Customer email is required.",
      });
    }

    const bookings = await db
      .collection("bookings")
      .find({
        customerEmail: customerEmail.toLowerCase(),
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(bookings);
  } catch (error) {
    console.error("Get my bookings error:", error);

    res.status(500).send({
      message: "Failed to fetch bookings.",
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
