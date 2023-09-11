const mongoose= require('mongoose');
require('dotenv').config();
mongoose.set("strictQuery", false);
const mongoURI=process.env.DB_CONN

const connectToMongo =()=>{
    mongoose.connect(mongoURI,()=>{
        console.log("hello connected to mongo successfully !!!")

    })
}
module.exports=connectToMongo