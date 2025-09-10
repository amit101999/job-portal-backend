const Job = require("../models/JobsModels");
const User = require("../models/userModel");
const { GoogleGenAI } = require("@google/genai");
exports.postJob = async (req, res) => {
  const {
    title,
    description,
    requirements,
    salary,
    location,
    jobType,
    exprience,
    position,
    companyId,
  } = req.body;

  // if (!title || !description || !requirements || !salary ||
  //     !location || !jobType || !exprience || !position || !companyId) {
  //     return res.status(400).json({
  //         message: "All fields must be provided",
  //         success: false
  //     })
  // }

  const userId = req.user;
  try {
    const ai = new GoogleGenAI({});
    const jobEmembedding = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [`${description}`],
    });

    const job = await Job.create({
      title,
      description,
      requirements: requirements.split(","),
      salary,
      location,
      jobType,
      exprience,
      position,
      company: companyId,
      posted_by: userId,
      jobEmbeddings: jobEmembedding.embeddings[0].values,
    });

    return res.status(200).json({
      message: "Job posted successfully",
      job: job,
      success: true,
    });
  } catch (err) {
    console.error("error in creating job", err);
  }
};

exports.getJobs = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const query = {
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    };
    const jobs = await Job.find(query)
      .populate({
        path: "company",
      })
      .sort({ createdAt: -1 });

    if (!jobs) {
      return res.status(404).json({
        message: "No job found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "job found",
      job: jobs,
      success: true,
    });
  } catch (err) {
    console.error("Error in getting jobs", err);
  }
};

exports.getJobsById = async (req, res) => {
  try {
    const id = req.params.id;
    const job = await Job.findById(id)
      .populate({
        path: "applications",
      })
      .sort({ createdAt: -1 });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    return res.status(200).json({
      job: job,
      success: true,
    });
  } catch (err) {
    console.log("error ih getting job by id ", err);
  }
};

// jobs created by admin
exports.getAdminJob = async (req, res) => {
  try {
    const id = req.user;
    const jobs = await Job.find({ posted_by: id }).populate({
      path: "company",
      createdAt: -1,
    });
    if (!jobs) {
      return res.status(404).json({
        message: "No job found by current user",
        success: false,
      });
    }
    return res.status(200).json({
      jobs,
      success: true,
    });
  } catch (err) {
    console.error("Error in getting admin job", err);
  }
};

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

exports.getRecommendedJobs = async (req, res) => {
  try {
    console.log("recomd jobs called:::::");
    const userId = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "NO user found",
        success: false,
      });
    }

    const allJobs = await Job.find({
      jobEmbeddings: { $exists: true },
    });

    const scoredJobs = allJobs.map((job) => {
      const similarity = cosineSimilarity(
        user.profile.resumeEmbeddings,
        job.jobEmbeddings
      );
      return { job, similarity };
    });
    scoredJobs.sort((a, b) => b.similarity - a.similarity);
    console.log(scoredJobs.slice(0, 2));
    res.status(200).json({ success: true, jobs: scoredJobs.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ message: "Server Error", success: false });
    console.error("Error in getting recommended jobs", err);
  }
};
