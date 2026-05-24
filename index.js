
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const port = process.env.PORT;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("Sportnest");
    const collection = db.collection("facility");

    app.get('/add-facility', async (req, res) => {
        const facilities = await collection.find({}).toArray();
        res.json(facilities);
    });
    app.post('/add-facility', async (req, res) => {
        const facility = req.body;
        console.log(facility);
        const result = await collection.insertOne(facility);
        res.json(result);
    });

    app.get('/add-facility/:id', async (req, res) => {
        const id = req.params.id;
        const result = await collection.findOne({ _id: new ObjectId(id) });
        res.json(result);
    });
    app.delete('/add-facility/:id', async (req, res) => {
    const id = req.params.id;

    const result = await collection.deleteOne({
        _id: new ObjectId(id)
    });

    res.send(result);
});
app.put('/add-facility/:id', async (req, res) => {

    const id = req.params.id;
    const updatedData = req.body;

    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {$set: updatedData}
    );

    res.send(result);
});
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});