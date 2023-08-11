const express = require("express");

const {registerUser,loginUser,followUser, logoutUser,updatePassword, updateProfile, deleteUser, myProfile, getUserProfile, getAllUsers, forgotPassword, resetPassword, getPosts, getUserPosts } = require("../Controllers/User")

const router = express.Router();

const {isAuthenticated} = require("../middleware/auth")




router.post("/register" , registerUser);

router.post("/login", loginUser)

router.get("/follow/:id",isAuthenticated,followUser)

router.get("/logout",logoutUser)

router.put("/update/password",isAuthenticated,updatePassword);

router.put("/update/profile",isAuthenticated,updateProfile);

router.delete("/delete/me", isAuthenticated, deleteUser)

router.get("/user/",isAuthenticated,myProfile);

router.get("/user/posts", isAuthenticated, getPosts)

router.get("/user/posts/:id", isAuthenticated, getUserPosts)

router.get("/user/:id",isAuthenticated,getUserProfile);

router.get("/users/",isAuthenticated,getAllUsers)

router.post("/forgot/password",forgotPassword);

router.put("/password/reset/:token",resetPassword);

module.exports=router