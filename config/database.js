const mongoose = require("mongoose");


const connectDatabase = ()=>{
    mongoose.connect(process.env.MONGO_URI).then((con)=>{
        console.log("Connected to database : " , con.connection.host)
    }).catch((e)=>{console.log(e)});
};

module.exports= connectDatabase;