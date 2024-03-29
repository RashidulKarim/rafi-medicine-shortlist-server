const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const cors = require("cors")
const ObjectId = require('mongodb').ObjectId
require('dotenv').config()

const port = process.env.PORT || 5000;
const whitelist = ["https://rafi-medicine.web.app"]
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
}
app.use(cors(corsOptions))
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wbvsa.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const run = async() =>{
  try {
    
    await client.connect()
    const database = client.db(process.env.DB_NAME)
    const collection = database.collection("products")
    const deletedProduct = database.collection("deletedProducts")
    console.log("Database connected");
    //get all product from DB
    app.get("/products", async(req, res)=>{
        const result = await collection.find({}).sort({"company": 1}).toArray()
        res.send(result) 
    })
    
    //post a product
    // app.post('/addProduct', async(req, res)=>{
    //     const product = req.body.productInfo
    //     const result = await collection.insertOne(product)
    //     console.log(result)
    //     res.send(result)
    // })
    //add many product
    app.post('/addProducts', async(req, res)=>{
        const product = req.body.productsCollection
        const result = await collection.insertMany(product)
        res.send(result)
    })
    
    //delete a product
    app.delete('/product/:id', async(req, res)=>{
        const query = req.params.id 
        const id = {_id: ObjectId(query)}        
        const result = await collection.deleteOne(id)
        res.send(result)
    })

    //delete many item product
    app.delete('/product', async(req, res)=>{
        const query = req.body 
        const data = query.map(pd =>{
            return ObjectId(pd._id)
        })
        
        const result = await collection.deleteMany({_id: {$in: data}})
        res.send(result)
    })


    //update many items
    app.put('/update', async(req, res)=>{
        const query = req.body 
        
        // make an array for bulk update
        const data = query.map(pd =>{
            return {
                updateOne: {
                    filter: {_id: ObjectId(pd._id)},
                    update: {$set: {status: pd.status}}
                }
            }
        })
        const result = await collection.bulkWrite(data)
        res.send(result)        
    })

    // find by sorting

    //update status
    app.put('/product/:id', async(req, res)=>{
        const params = req.params.id 
        const query = req.query.status
          
        const id = {_id: ObjectId(params)}
        const updateDoc = {
            $set: {
              status: query
            },
          };      
        const result = await collection.updateOne(id, updateDoc)
        res.send(result)
    })

    //update quantity status
    app.put('/productQuantity/:id', async(req, res)=>{
        const params = req.params.id 
        const query = req.query.quantity        
        const id = {_id: ObjectId(params)}
        const updateDoc = {
            $set: {
              quantity: query
            },
          };      
        const result = await collection.updateOne(id, updateDoc)
        res.send(result)
    })

    //find by company name
    app.get('/products/:company', async(req, res)=>{
        const query = req.params.company
        const company = {company: (query)}
        const result = await collection.find(company).sort({"name": 1}).toArray()
        res.send(result)
        
    })
  } catch (error) {
    console.log(error);
    process.exit(1)
  }
}

run().then(() => {
  console.log("Database connected");
  app.listen(port, ()=>{
    console.log("Listening from port", port)
    
  })
})

app.get('/', (req, res)=>{
    res.send("Welcome to Rafi Medicine center shortlist server")
})