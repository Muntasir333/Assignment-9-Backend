const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
app.use(cors());
app.use(express.json());
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

const uri = process.env.MONGODB_URI;
const port = process.env.PORT;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);
const verifyToken = async (req, res, next) => {
  const header = req.headers['authorization'];

  if (!header) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = header.split(" ")[1]; 

    const { payload } = await jwtVerify(token, JWKS);

    console.log("PAYLOAD:", payload);

    req.user = payload; 

    next();
  } catch (error) {
    console.log("JWT ERROR:", error.message);
    return res.status(401).json({ message: 'Forbidden' });
  }
};

async function run() {
  try {
    // await client.connect();
    const db = client.db("Sportnest");
    const collection = db.collection("facility");
    const bookingCollection = db.collection("booking");

app.get('/add-facility', async (req, res) => {
  try {
    const search = req.query.search || '';
    const sort = req.query.sort || '';
    const query = {
      facilityName: {
        $regex: search,
        $options: 'i',
      },
    };
    let sortOption = {};

    if (sort === 'name_asc') {
      sortOption = { facilityName: 1 };
    } else if (sort === 'name_desc') {
      sortOption = { facilityName: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }
    const facilities = await collection
      .find(query)
      .sort(sortOption)
      .toArray();

    res.json(facilities);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/add-facility', verifyToken, async (req, res) => {
    const facility = req.body;
    facility.createdAt = new Date();
    const result = await collection.insertOne(facility);
    res.json(result);
});

app.get('/my-facilities/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const facilities = await collection
      .find({ ownerEmail: email })
      .toArray();

    res.json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/facility/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Facility not found" });
    }

    res.json({
      success: true,
      message: "Facility deleted successfully",
      result
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

    app.get('/add-facility/:id', async (req, res) => {
        const id = req.params.id;
        const result = await collection.findOne({ _id: new ObjectId(id) });
        res.json(result);
    });
    app.delete('/add-facility/:id', verifyToken, async (req, res) => {
    const id = req.params.id;

    const result = await collection.deleteOne({
        _id: new ObjectId(id)
    });

    res.send(result);
});
app.put('/add-facility/:id', verifyToken, async (req, res) => {

    const id = req.params.id;
    const updatedData = req.body;

    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {$set: updatedData}
    );

    res.send(result);
});

app.post ('/booking', verifyToken, async (req, res) => {
    const booking = req.body;
    const result = await bookingCollection.insertOne(booking);
    res.json(result);
});
app.get ('/booking/:userId', verifyToken, async (req, res) => {
    const userId = req.params.userId;
    const bookings = await bookingCollection.find({ userId: userId }).toArray();
    res.json(bookings);
});

app.delete ('/booking/:bookingId', verifyToken, async (req, res) => {
    const bookingId = req.params.bookingId;
    const result = await bookingCollection.deleteOne({ _id: new ObjectId(bookingId) });
    res.json(result);
});

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});