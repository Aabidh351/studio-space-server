import express from "express";
const app = express();
const PORT = 5000;

app.get('/', (req, res) =>{
    res.send({
        message: "Hello World!"
    })
})

app.listen(PORT, ()=>{
    console.log(`App listening to port ${PORT}...`);
})