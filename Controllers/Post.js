const Post = require("../models/Post")
const User = require("../models/User")
const cloudinary = require("cloudinary");

const createPost = async (req,res)=>{
    try{
        const mycloud = await cloudinary.v2.uploader.upload(req.body.image,{
            folder:"posts"
        })
       
        console.log(mycloud.secure_url);
        const newPostData = {
            caption : req.body.caption,
            image :{
                public_id : mycloud.public_id,
                url : mycloud.secure_url,
            },
            owner:req.user._id
        };

      const newPost = await Post.create(newPostData);
     
      const user = await User.findById(req.user._id);

      user.posts.unshift(newPost._id);

      await user.save();

      res.status(201).json({success:true,post:newPost,message:"post created"});



    }catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        })
    }
}


const likeUnlikePost = async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                message: "post not found"
            })
        }
        
        if(post.likes.includes(req.user._id)){
            const index = post.likes.indexOf(req.user._id);

            post.likes.splice(index,1);

            await post.save();

            res.status(200).json({
                success:true,
                message:"Post Unliked"
            })
        }else{
            post.likes.push(req.user._id);
            await post.save();

            res.status(200).json({
                success:true,
                message:"Post Liked"
            })

        }


    }catch(e){
        res.status(500).json({
            success:false,
            message:e.message
        })
    }
}


const deletePost = async (req,res)=>{
    try{
       
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(400).json({
                success:false,
                message:"Post not found"
            })
        }

        console.log(post);

        if(post.owner.toString() !== req.user._id.toString()){
            return res.status(401).json({
                success:false,
                message:"Unauthorized"
            })
        }

        await cloudinary.v2.uploader.destroy(post.image.public_id);
        
       await Post.deleteOne( { _id : req.params.id } )

        const user = await User.findById(req.user._id);

        const index = user.posts.indexOf(req.params.id);

        user.posts.splice(index,1);
        
        await user.save();

        res.status(200).json({
            success:true,
            message:"Post deleted"
        })
        

    }catch(e){
        res.status(500).json({
            success:false,
            message:e.message
        })
    }
}


const getFollowingPosts = async (req,res)=>{
    try{   

        const user = await User.findById(req.user._id);


        const posts = await Post.find({
            owner : {
                $in : user.following
            }
        }).populate("owner likes comments.user")

    
        

        res.status(200).json({
            success:true,
            posts:posts.reverse(),
            
        })


    }catch(e){
        res.status(500).json({
            success:false,
            message:e.message
        })
    }
}


const updateCaption =  async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success:false,
                message:"post not found"
            })
        }

        if(post.owner.toString() !== req.user._id.toString()){
            return res.status(401).json({
                success:false,
                message:"Unauthorized"
            })
        }

        post.caption=req.body.caption;

        await post.save();

        res.status(200).json({
            success:true,
            message: "Caption Updated"
        })

    }catch(e){
        res.status(500).json({
            success:false,
            message:e.message
        })
    }
}



const addComment = async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success:true,
                message:"post not found"
            })
        }

      

        let commIndex = -1;

        post.comments.forEach((comment,index)=>{
            if(comment.user.toString()===req.user._id.toString()){
                commIndex=index;
            }
        })

        if(commIndex!==-1){

            let commentData =  {
                user : req.user._id,
                comment : req.body.comment
            }
            post.comments[commIndex] = commentData;

            await post.save();
            return res.status(200).json({
                success:true,
                message : "comment updated"
            })

        }else{
            let commentdata = {
                user : req.user._id,
                comment : req.body.comment
            }
            post.comments.push(commentdata);
            await post.save();

            return res.status(200).json({
                success:true,
                message : "comment added"
            })
        }

    }catch(e){
        res.status(500).json({
            success:false,
            message:e.message
        })
    }
}


const deleteComment = async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
  
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }
  
      // Checking If owner wants to delete
  
      if (post.owner.toString() === req.user._id.toString()) {
        if (req.body.commentId === undefined) {
          return res.status(400).json({
            success: false,
            message: "Comment Id is required",
          });
        }
  
        post.comments.forEach((item, index) => {
          if (item._id.toString() === req.body.commentId.toString()) {
            return post.comments.splice(index, 1);
          }
        });
  
        await post.save();
  
        return res.status(200).json({
          success: true,
          message: "Selected Comment has deleted",
        });
      } else {
        post.comments.forEach((item, index) => {
          if (item.user.toString() === req.user._id.toString()) {
            return post.comments.splice(index, 1);
          }
        });
  
        await post.save();
  
        return res.status(200).json({
          success: true,
          message: "Your Comment has deleted",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

module.exports = {createPost,likeUnlikePost,deletePost , getFollowingPosts ,updateCaption , addComment, deleteComment}