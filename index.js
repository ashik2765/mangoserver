require("dotenv").config();
const express = require('express')
const jwt = require("jsonwebtoken");
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 4000

//midleware
app.use(cors());
app.use(express.json());

//jwt
function createToken(user) {
    const token = jwt.sign(
        {
            email: user.email,
        },
        "secret",
        { expiresIn: "7d" }
    );
    return token;
}

//mongodb config
const uri = process.env.DATABASE_URL;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        await client.connect();
        //create mongodb collection
        const mangoDB = client.db("mangoDB");
        const mangoCollection = mangoDB.collection("mangoCollection");
        const mangoUserCollection = mangoDB.collection("mangoUserCollection");



        //routers
        app.post('/mangos', async (req, res) => {
            const mangosData = req.body;
            const result = await mangoCollection.insertOne(mangosData);
            res.send(result);
        });
        app.get('/mangos', async (req, res) => {
            const mangosData = mangoCollection.find();
            const result = await mangosData.toArray();
            res.send(result);
        });
        app.get('/mangos/:id', async (req, res) => {
            const id = req.params.id;
            const mangoData = await mangoCollection.findOne({ _id: new ObjectId(id) })
            res.send(mangoData);
        });
        app.patch('/mangos/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const result = await mangoCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData },
                { upsert: true }
            )
            res.send(result);
        });
        app.delete("/mangos/:id", async (req, res) => {
            const id = req.params.id;
            const result = await mangoCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result);
        });

        //user route will be here
        app.post("/user", async (req, res) => {
            const user = req.body;
            const token = createToken(user)
            const isUserExist = await mangoUserCollection.findOne({ email: user?.email })

            if (isUserExist?._id) {
                return res.send({ token })
            }
            await mangoUserCollection.insertOne(user)
            res.send({ token });
        });
        app.get("/user/get/:id", async (req, res) => {
            const id = req.params.id;
            const result = await mangoUserCollection.findOne({ _id: new ObjectId(id) })
            res.send(result);
        });
        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            const result = await mangoUserCollection.findOne({ email })
            res.send(result);

        });
        app.patch("/user/:id", async (req, res) => {
            const id = req.params.id;
            const userInfo = req.body;
            const result = await mangoUserCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: userInfo },
                { upsert: true }
            )
            res.send(result)
        });


        console.log("Mongodb is connected");
    } finally {

        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})