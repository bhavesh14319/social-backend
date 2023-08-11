const User = require("../models/User")
const Post = require("../models/Post")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {sendEmail} = require("../middleware/sendEmail")
const cloudinary = require("cloudinary")

const Formidable = require("formidable")


const getResetPasswordToken = ()=>{
    const resetToken = crypto.randomBytes(20).toString("hex");

    return resetToken;


}


const matchPassword = async function (password, encPassword) {
    return await bcrypt.compare(password, encPassword);
}

const generateToken = async function (id) {
    return jwt.sign({ id: id }, process.env.JWT_SECRET)
}
const registerUser = async (req, res) => {
    try {
        const { name, email, password} = req.body;

        console.log(req.body)
        const avatar = req.body.image



        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        const mycloud = await cloudinary.v2.uploader.upload(avatar,{
            folder:"avatars"
        })

        console.log(mycloud.secure_url);

        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: mycloud.public_id,
                url: mycloud.secure_url
            },
        })

        const token = await generateToken();
        res.status(200).cookie("token", token, {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        }).json(
            {
                success: "true",
                user,
                token
            }
        )


    } catch (e) {
        console.log("error")
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}





const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password").populate("posts followers following");

        if (!user) {
            return res.status(400).json({
                success: "false",
                message: "User does not exist"
            })
        }

        const isMatch = await matchPassword(password, user.password);
        console.log(isMatch)
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Password",
            })
        }

        const token = await generateToken(user._id);       
        res.status(200).cookie("token", token, {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            
        }).json(
            {
                success: "true",
                user,
                token
            }
        )
    } catch (e) {

        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const logoutUser = async (req, res) => {
    try {

        res.status(200).cookie("token", null, { expires: new Date(Date.now()), httpOnly: true }).json({
            success: true,
            message: "Logged Out"
        })

    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const followUser = async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);

        const loggedInUser = await User.findById(req.user._id);


        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        if (loggedInUser.following.includes(userToFollow._id)) {

            let index = loggedInUser.following.indexOf(userToFollow._id);

            loggedInUser.following.splice(index, 1);

            index = userToFollow.followers.indexOf(loggedInUser._id);

            userToFollow.followers.splice(index, 1);

            await loggedInUser.save();

            await userToFollow.save();

            res.status(200).json({
                succeess: true,
                message: "User unfollowed"
            })


        } else {
            loggedInUser.following.push(userToFollow._id);
            userToFollow.followers.push(loggedInUser._id);

            await loggedInUser.save();

            await userToFollow.save();

            res.status(200).json({
                success: true,
                message: "User followed"
            })
        }





    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                succeess: false,
                message: "please provide old and new password"
            })
        }

        

        const isMatch = await matchPassword(oldPassword, user.password);
        console.log(isMatch);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect old password"
            })
        }

        user.password = newPassword;

        await user.save();


        res.status(200).json({
            succeess: true,
            message: "password updated"
        })

    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const updateProfile = async (req, res) => {
    try {

        const user = await User.findById(req.user._id);

        const { name, email } = req.body;

        const avatar = req.body.image


        if (name) {
            user.name = name;
        }

        if (email) {
            user.email = email;
        }

        if(avatar){
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);

            const mycloud = await cloudinary.v2.uploader.upload(avatar,{
                folder:"avatars"
            });

            user.avatar.public_id=mycloud.public_id;
            user.avatar.url=mycloud.secure_url;
            }

        await user.save();

        res.status(200).json({
            succeess: true,
            message: "user updated"
        })


    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}



const deleteUser = async (req, res) => {
    try {

        const user = await User.findById(req.user._id);

        const posts = user.posts;


        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        //case temp followed temp1
        // temp ke following mein temp1 hai
        // temp1 ke followers mein temp hai
        // if deleting the temp to temp ke following me jake temp1 ke
        // followers me jake temp ka id udana hai

        const userFollowings = user.following;

        for(let i=0;i<userFollowings.length;i++){
            const followedUser = await User.findById(userFollowings[i]);

            //followedUser is temp1
            let followers = followedUser.followers;

            let index = followers.indexOf(user._id);

            followedUser.followers.splice(index,1);

            await followedUser.save();
        }

        // case temp1 followed temp
        // temp1 ke following mein temp
        // temp ke followers mein temp1
        // deleting temp
        // temp ke followers mein jake follower ke following se temp ko udana hai
        
        const userFollowers = user.followers;
        for(let i = 0; i<userFollowers.length;i++){
            const follower = await User.findById(userFollowers[i]);

            //follower here is temp1
            let following = follower.following;

            let index = following.indexOf(user._id);

            follower.following.splice(index,1);

            await follower.save();
            
        }

        // remove all posts associated with deleted user
        for (let i = 0; i < posts.length; i++) {
            const post =await Post.findById(posts[i]);
            await cloudinary.v2.uploader.destroy(post.image.public_id);
            await Post.deleteOne({ _id: posts[i] });
        }

        // await user.remove();
        await User.deleteOne({ _id: user._id })

        //after deletuing user clear cookies

        res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })


        //removing comments of user
        let allPosts = await Post.find();


        for(let j=0;j<allPosts.length;j++){
            let post = allPosts[j];
            for(let i=0;i<post.comments.length;i++){
           
                if(post.comments[i].user===req.user._id){
                    post.comments.splice(i,1);
                }
            }
            await post.save();
        }
       

         //removing likes of user

         for(let j=0;j<allPosts.length;j++){
             let post = allPosts[j];
             for(let i=0;i<post.likes.length;i++){
            
                 if(post.likes[i]===req.user._id){
                     post.likes.splice(i,1);
                 }
             }
             await post.save();
         }




        res.status(200).json({
            success: true,
            message: "User deleted"
        })

    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const myProfile = async (req, res) => {
    try {

        const user = await User.findById(req.user._id).populate("posts followers following");

        const token = await generateToken(user._id);       
        res.status(200).cookie("token", token, {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            
        }).json(
            {
                success: "true",
                user,
                token
            }

     )}catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}

const getUserProfile  = async (req,res) =>{
    try{
        const user = await User.findById(req.params.id).populate("posts followers following");;

        if(!user){
            res.status(404).json({
                succeess:false,
                message:"user not found"
            })
        }

        res.status(200).json({
            succeess:true,
            user
        })

    }catch(e){
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const getAllUsers = async(req,res)=>{
    try{

        const users = await User.find({
            name: { $regex: req.query.name, $options: "i" },
          });

        res.status(200).json({
            succeess:true,
            users
        })

    }catch(e){
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const forgotPassword = async(req,res)=>{
    try{
        const user = await User.findOne({email:req.body.email});

        if(!user){
            return res.status(404).json({
                succeess:false,
                message:"user not found"
            })
        }


        let resetToken = getResetPasswordToken();
        let resetPasswordToken = resetToken;
        resetPasswordToken = crypto.createHash("sha256").update(resetPasswordToken).digest('hex');
        console.log(resetPasswordToken);
        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpire = Date.now() + 10*60*1000;
        



        await user.save();

        const resetUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;


        const message = `Reset your password by clicking on link below: \n\n ${resetUrl}`;


        try{
            await sendEmail({email:user.email, subject:"Reset Password", message});

            res.status(200).json({
                success:true,
                message:`reset link sent to ${user.email}`
            })
        }catch(e){
            user.resetPasswordToken=undefined,
            user.resetPasswordExpire=undefined,
            await user.save();

            return res.status(500).json({
                succeess:false,
                message:e.message
            })
        }



    }catch(e){
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const resetPassword = async (req,res)=>{
    try{
        const resetToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        console.log("params " , req.params.token);

        console.log("hashed", resetToken)
        const user = await User.findOne({
            resetPasswordToken:resetToken,
            resetPasswordExpire:{$gt : Date.now()}
            }).select("+password")

        console.log(user);
        if(!user){
            return res.status(401).json({
                succeess:false,
                message:"Token invalid or has expired"
            })
        }

        user.password = req.body.password;

        user.resetPasswordToken=undefined;
        user.resetPasswordExpire=undefined;

        await user.save();


        return res.status(200).json({
            succeess:true,
            message:"password updated successfully"
        })



    }catch(e){
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}

const getPosts = async (req,res) =>{

    try{
    const user = await User.findById(req.user._id);

    const posts = [];

    for(let i=0;i<user.posts.length;i++){
        const post = await Post.findById(user.posts[i]).populate("likes comments.user owner");
        posts.push(post);
    }

    res.status(200).json({
        success:true,
        posts
    })
    }catch(e){
        res.status(500).json({
            success:false,
            message:e.message
        })
    }

}

const getUserPosts = async(req,res)=>{
    try{
        const user = await User.findById(req.params.id);

        const posts = [];
    
        for(let i=0;i<user.posts.length;i++){
            const post = await Post.findById(user.posts[i]).populate("likes comments.user owner");
            posts.push(post);
        }
    
        res.status(200).json({
            success:true,
            posts
        })
        
    }catch(e){
        res.status(500).json({
            success:false,
            message:e.message
        })
    }
}


module.exports = { registerUser, loginUser, followUser, logoutUser, updatePassword, updateProfile, deleteUser, myProfile ,getUserProfile,getAllUsers,forgotPassword, resetPassword ,getPosts , getUserPosts}