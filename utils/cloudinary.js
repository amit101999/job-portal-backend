const cloudinary = require("cloudinary")
const dotenv = require('dotenv').config()


try {
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_API_KEY,
        api_secret: process.env.CLOUD_API_SECRET,
    })
    console.log("Cloudinary connected")
} catch (err) {
    console.log("Error in cloudinary connection", err)
}

module.exports = cloudinary