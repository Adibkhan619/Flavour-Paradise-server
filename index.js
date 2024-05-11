const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vfffbgl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // Document collection
        const foodCollection = client
            .db("restaurant-management")
            .collection("foods");
        const orderCollection = client
            .db("restaurant-management")
            .collection("orders");

        // ALL FOOD DATA
        app.get("/foods", async (req, res) => {
            const result = await foodCollection.find().toArray();
            res.send(result);
        });

        // GET FOOD BY ID
        app.get("/foods/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodCollection.findOne(query);
            res.send(result);
            console.log(result);
        });

        // ADD FOOD ITEM FORM USER
        app.post("/foods", async(req, res) => {
            const newFood = req.body;
            const result = await foodCollection.insertOne(newFood)
            res.send(result);
            console.log("added new food", result);
        })

        // ADD ORDER FROM USER
        app.post("/orders", async(req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            const updateOrder = {
                $inc: { order_count: 1}
            }
            const orderQuery = { _id: new ObjectId(order.id)}
            const updateOrderCount = await foodCollection.updateOne( orderQuery, updateOrder)
            console.log(updateOrderCount);
            res.send(result);
        })

        // GET ALL ORDER DATA
        app.get("/orders", async(req, res) => {
            const result = await orderCollection.find().toArray();
            res.send(result);
        })

        


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello Bangladesh");
});
app.listen(port, () => console.log(`Server Running on PORT ${port}`));
