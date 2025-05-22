const express = require('express');
const cookieParser = require('cookie-parser')
const cors = require('cors')
const connectDb = require('./utils/db')
const userRoute = require('./Routes/userRoutes')
const companyRoute = require('./Routes/companyRoutes')
const jobRoute = require('./Routes/jobsRoutes')
const applicantRoute = require('./Routes/applicationRoute')
const path = require('path');
// const dotenv = require('dotenv').config({ path: path.join(__dirname, '.env') })
const dotenv = require('dotenv').config()
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const options = {
    origin: "http://localhost:5173",
    // origin: "https://job-portal-my.netlify.app",
    credentials: true
}


app.get("/amit", (req, res) => {
    res.send("hello amit")
})

app.use(cors(options))

const port = process.env.PORT || 3800;

app.use('/api/v1/user', userRoute)
app.use('/api/v1/company', companyRoute)
app.use('/api/v1/job', jobRoute)
app.use('/api/v1/application', applicantRoute)



app.listen(port, async () => {
    try {
        await connectDb()
    } catch (err) {
        comsole.log("error in connection database", err)
    }
    console.log(`Server running on port ${port}`);
});



