require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

const port = process.env.PORT || 5000
const app = express()

app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'https://b9a11-server-side-adibkhan619.vercel.app',
            'https://restaurant-management-we-b1988.web.app',
            'https://restaurant-management-we-b1988.firebaseapp.com',
        ],
        credentials: true,
    }),
)
app.use(express.json())

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'unauthorized access' })
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: 'unauthorized access' })
            }

            req.user = decoded
            next()
        })
    }
}

const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASS }@cluster0.vfffbgl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
})


const dbConnect = async () => {
    try {
        // client.connect()
        console.log('DB Connected Successfully✅')
    } catch (error) {
        console.log(error.name, error.message)
    }
}
dbConnect()

const foodCollection = client.db('restaurant-management').collection('foods')
const orderCollection = client.db('restaurant-management').collection('orders')
const photoCollection = client.db('restaurant-management').collection('gallery')
const userCollection = client.db('restaurant-management').collection('users')



// default route
app.get('/', (req, res) => {
    res.send('Hello Bangladesh')
})

// JWT GENERATE
app.post('/jwt', async (req, res) => {
    const user = req.body
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
    })
    res
        .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
})

// Clear token on logout
app.get('/logout', (req, res) => {
    res
        .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
})

// ALL FOOD DATA
app.get('/foods', async (req, res) => {
    const result = await foodCollection.find().toArray()
    res.send(result)
})

// GET FOOD BY SEARCH
app.get('/all-foods', async (req, res) => {
    const search = req.query.search
    let query = {
        food_name: { $regex: search, $options: 'i' },
    }
    const result = await foodCollection.find(query).toArray()
    res.send(result)
})

// GET FOOD BY ID
app.get('/foods/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await foodCollection.findOne(query)
    res.send(result)
    console.log(result)
})

// ADD FOOD ITEM FORM USER
app.post('/foods', async (req, res) => {
    const newFood = req.body
    const result = await foodCollection.insertOne(newFood)
    res.send(result)
    console.log('added new food', result)
})

// GET FOOD ITEM ADDED BY USER
app.get('/food/:email', async (req, res) => {
    const email = req.params.email
    const query = { email: email }
    const result = await foodCollection.find(query).toArray()
    res.send(result)
})

// DELETE FOOD ITEM ADDED BY USER
app.delete('/foods/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await foodCollection.deleteOne(query)
    res.send(result)
})

//   UPDATE FOOD ITEM ADDED BY USER
app.put('/foods/:id', async (req, res) => {
    const id = req.params.id
    const foodData = req.body
    const query = { _id: new ObjectId(id) }
    const options = { upsert: true }
    const updateDoc = {
        $set: {
            ...foodData,
        },
    }
    const result = await foodCollection.updateOne(query, updateDoc, options)
    res.send(result)
})

// ADD ORDER FROM USER
app.post('/orders', async (req, res) => {
    const order = req.body
    const result = await orderCollection.insertOne(order)
    const updateOrderCount = await foodCollection.updateOne(
        { _id: order },
        { $inc: { order_count: 1 } },
    )
    console.log(updateOrderCount)
    res.send(result)
})

// GET ALL ORDER DATA
app.get('/orders', async (req, res) => {
    const result = await orderCollection
        .find()
        .sort({ orderQuantity: -1 })
        .toArray()
    res.send(result)
})

// FIND ORDER DATA WITH ID
app.get('/orders/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await orderCollection.findOne(query)
    res.send(result)
})

// DELETE ORDERED FOOD
app.delete('/order/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await orderCollection.deleteOne(query)
    res.send(result)
})

//   ADD PHOTO INTO GALLERY
app.post('/gallery', async (req, res) => {
    const photo = req.body
    const result = await photoCollection.insertOne(photo)
    res.send(result)
})

// GET GALLERY DATA
app.get('/gallery', async (req, res) => {
    const result = await photoCollection.find().toArray()
    res.send(result)
})

// GET FAKE USER DATA FOR REVIEW
app.get('/users', async (req, res) => {
    const result = await userCollection.find().toArray()
    res.send(result)
})



app.listen(port, () => console.log(`Server Running on PORT ${ port }`))
