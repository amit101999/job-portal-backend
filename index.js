const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDb = require("./utils/db");
const userRoute = require("./Routes/userRoutes");
const companyRoute = require("./Routes/companyRoutes");
const jobRoute = require("./Routes/jobsRoutes");
const applicantRoute = require("./Routes/applicationRoute");
const path = require("path");
// const dotenv = require('dotenv').config({ path: path.join(__dirname, '.env') })
const dotenv = require("dotenv").config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const payementRoute = require("./Routes/paymentRoute");

const options = {
  origin: [
    "https://job-portal-frontend-19ezy0y92-amits-projects-6033cb4a.vercel.app",
    "http://localhost:5173",
  ],
  credentials: true,
};

app.get("/amit", (req, res) => {
  res.send("hello amit");
});

console.log("connecting to server");

app.use(cors(options));

const port = process.env.PORT || 3800;

app.get("/", (req, res) => {
  res.send("server is running");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicantRoute);
app.use("/api/v1/payment", payementRoute);

app.listen(port, async () => {
  try {
    await connectDb();
  } catch (err) {
    console.log("error in connection database", err);
  }
  console.log(`Server running on port ${port}`);
});
