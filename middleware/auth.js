
const User = require("../models/User")
const jwt = require("jsonwebtoken")

const isAuthenticated = async (req,res,next)=>{
    try{
        console.log("entry");
        
        const token = req.headers?.authorization?.split(" ")[1] || req.cookies.token;
        console.log(token);

            if(!token){
                return res.status(401).json({
                    success:false,
                    message:"please login first"
                })
            }
        
            const decoded = await jwt.verify(token,process.env.JWT_SECRET);
    
    
        
            req.user = await User.findById(decoded.id);
            
            next();

        
    }catch(e){
        res.status(500).json({
            success:false,
            message:e.message
        })
    }
    

}

module.exports={isAuthenticated};