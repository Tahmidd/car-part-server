const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, MongoRuntimeError, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uqgvh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const partCollection = client.db('car_part').collection('parts');
        const purchaseCollection = client.db('car_part').collection('purchase');
        const reviewCollection = client.db('car_part').collection('review');

        //getting all part info
        app.get('/part', async (req, res) => {
            const query = {};
            const cursor = partCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        });

        //posting purchase
        app.post('/purchase', async (req, res) => {
            const purchases = req.body;
            const query = { purchase: purchases.purchase, client: purchases.client }
            const exists = await purchaseCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, purchases: exists })
            }
            const result = await purchaseCollection.insertOne(purchases);
            return res.send({ success: true, result });
        });

        app.get('/purchase', async (req, res) => {
            const query = {};
            const cursor = purchaseCollection.find(query);
            const purchase = await cursor.toArray();
            res.send(purchase);
        });

        app.get('/purchase/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await purchaseCollection.findOne(query);
            res.send(product);
        });

        app.delete('/purchase/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await purchaseCollection.deleteOne(query);
            res.send(result);
        });

        //adding and getting review
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review);
        });



    }
    finally {

    }
}

run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello Mechanic!')
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})