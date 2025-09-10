const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const getDataUri = require("../utils/dataUri");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const axios = require("axios");
const pdf = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

exports.register = async (req, res) => {
  const { fullname, email, password, phoneNumber, role } = req.body;
  if (!fullname || !email || !password || !phoneNumber || !role) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }

  try {
    const file = req.file;
    const fileUri = getDataUri(file);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

    const user = await User.findOne({ email: email });
    // if user is alreday in exists
    if (user) {
      res.status(200).json({
        message: "User already exists",
        success: false,
      });
    }

    // if user not exists
    const hashPassword = await bcrypt.hash(password, 10);

    // user created
    await User.create({
      fullname,
      email,
      password: hashPassword,
      phoneNumber,
      role,
      profile: {
        profilePic: cloudResponse.secure_url,
      },
    });

    return res.status(200).json({
      message: "User registered successfully",
      success: true,
    });
  } catch (err) {
    console.error("error in registeration ", err);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }

  try {
    // find if user not exists or not
    let user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // check for password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }
    // check for role is correct or not
    if (user.role != role) {
      return res.status(403).json({
        message: "Unauthorized access",
        success: false,
      });
    }

    const tokenData = {
      userId: user._id,
    };

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      profile: user.profile,
      phoneNumber: user.phoneNumber,
    };

    // creating token
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1D",
    });

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "None",
        secure: true,
      })
      .json({
        message: "Login successful",
        success: true,
        user: user,
      });
  } catch (err) {
    console.log("error in login", err);
    return res.status(400).json({
      message: "server error",
      success: false,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (err) {
    console.error("error in logout", err);
    return res.status(500).json({
      message: "server error",
      success: false,
    });
  }
};

exports.updateUser = async (req, res) => {
  console.log("inside update user");
  const file = req.file;
  const { fullname, email, skills, bio, phoneNumber } = req.body;
  const fileUri = getDataUri(file);
  try {
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
    const useSkills = skills.split(",");
    console.log("URL: ", cloudResponse);
    const userId = req.user;
    let user = await User.findById(userId);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullname,
        email,
        phoneNumber,
        profile: {
          skills: useSkills,
          bio: bio,
        },
      },
      { new: true }
    );

    if (cloudResponse) {
      user.profile.resume = cloudResponse.secure_url;
      user.profile.resumeOriginalName = file.originalname;
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: user,
      success: true,
    });
  } catch (err) {
    console.error("error in updating user", err);
  }
};

exports.generateSummary = async (req, res) => {
  const userId = req.user;
  const resumeUrl = req.query.resume;

  try {
    const response = await axios.get(resumeUrl, {
      responseType: "arraybuffer",
    });
    const pdfBuffer = Buffer.from(response.data, "binary");

    // Step 2: Extract text
    const data = await pdf(pdfBuffer);
    const resumeText = data.text;

    // now call the google gemini api
    const ai = new GoogleGenAI({});

    const summaryRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert resume writer. I will provide you with resume data, and your task is to create a short, crisp, and eye-catching professional summary for the candidate. Follow these rules:

Use only the information, skills, projects, and experiences that are explicitly mentioned in the resume data.

Do not add anything that is not present in the resume.

Keep the summary concise (3–5 lines) and impactful.

Make it keyword-rich by naturally using important terms from the resume.

Highlight the candidate’s strongest skills, projects, and achievements in a way that grabs recruiter attention.

Maintain a professional, confident, and modern tone.

Now, here is the resume data: ${resumeText}`,
    });

    // console.log(
    //   "Extracted Resume Text: ",
    //   summaryRes.candidates[0].content.parts[0].text
    // );

    // genrating embending for user
    const embedding = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [`${resumeText}`],
    });
    // console.log("Embedding: ", embedding.embeddings[0].values);

    // update the user profile with summary and embeding
    const updateUser = await req.user;
    let user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "profile.profileSummary":
            summaryRes.candidates[0].content.parts[0].text,
          "profile.resumeEmbeddings": embedding.embeddings[0].values,
        },
      },
      { new: true }
    );
    await user.save();
    // console.log(user);
    return res.status(200).json({
      message: "User Summary generated",
      user: user,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ msg: "error in generating summary" });
    console.log("Error in genrating summary :", err);
  }
};
