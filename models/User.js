const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const userSchema = new mongoose.Schema({

    name :{
        type:String,
        required:[true, "Please Add Your Name"]
    },

    email:{
        type:String,
        required:[true,"Please add your email"],
        unique:[true,"Email already exists"]
    },

    password :{
        type:String,
        required:[true,"Please add password"],
        minlength:[6,"Password must be atleast of 6 characters"],
        select:false,
    },

    avatar:{
        public_id:String,
        url:String,
    },

    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Post",
        }
    ],

    followers : [{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }],

    following : [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
        }
    ],

    resetPasswordToken : String,
    resetPasswordExpire :Date




})


userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }
  next()
})



module.exports= mongoose.model("User",userSchema)
