const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
// const fileupload = require("express-fileupload")
const multer = require("multer");

// const bodyParser = require("body-parser");

// const upload = multer({dest:"uploads/"})


dotenv.config();
app.use(require("cookie-parser")())
//using middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({limit:"50mb",extended:true }));

//import routes
const userRoutes = require("./Routes/User");
const postRoutes = require("./Routes/Post");


app.use("/api/v1", userRoutes)
app.use("/api/v1", postRoutes)

module.exports = app;