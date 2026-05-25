# 🌐 SentinelX - 100% Free Production Deployment Guide

This guide walks you through deploying the entire **SentinelX** stack to the internet for free using Vercel, Render, Hugging Face, and MongoDB Atlas.

---

## 📋 Checklist & Order of Operations
We must deploy the services in a specific order so that each service can point to the correct URL of its dependencies:
1. [ ] **Step 1: MongoDB Atlas** (Provides Database URL)
2. [ ] **Step 2: Hugging Face Spaces** (Provides ML Service URL)
3. [ ] **Step 3: Render** (Provides Backend API URL)
4. [ ] **Step 4: Vercel** (Provides Frontend URL)

---

## 🗄️ Step 1: Deploy MongoDB Atlas (Database)
MongoDB Atlas is a fully managed cloud database. The free tier gives you a 512 MB sandbox cluster which is perfect for this project.

1. **Sign Up**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. **Create a Project**: Create a new project named `SentinelX`.
3. **Build a Database**:
   - Choose the **M0 Free Tier**.
   - Select your preferred cloud provider and region (choose the one closest to you).
   - Click **Create**.
4. **Security Configuration**:
   - **Authentication**: Choose **Username and Password**. Create a user (e.g., `dbadmin`) and set a strong password. **Write these down.**
   - **IP Access List**: Set this to **Allow Access from Anywhere (`0.0.0.0/0`)** since Render's free tier uses dynamic IP addresses that change constantly.
5. **Get Connection String**:
   - Click **Overview** or **Database** in the sidebar.
   - Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string. It will look like this:
     ```text
     mongodb+srv://dbadmin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Replace `<password>` with your database user's password, and add `/sentinelx` before `?` to specify the database name:
     ```text
     mongodb+srv://dbadmin:YOUR_PASSWORD_HERE@cluster0.abcde.mongodb.net/sentinelx?retryWrites=true&w=majority&appName=Cluster0
     ```
   - **Save this connection string.** You will need it for Render!

---

## 🤖 Step 2: Deploy Hugging Face Spaces (ML Service)
Hugging Face offers free GPU/CPU instances designed specifically for machine learning models. The free CPU tier offers **16 GB RAM and 2 vCPUs**, which runs PyTorch and BERT smoothly.

1. **Sign Up**: Go to [Hugging Face](https://huggingface.co/join) and create an account.
2. **Create a Space**:
   - Go to `Hugging Face > Spaces` and click **New Space**.
   - Name: `sentinelx-ml-service`
   - License: Choose `mit`.
   - **Space SDK**: Select **Docker** (Crucial!).
   - **Docker Template**: Select **Blank** (or `None`).
   - Space Hardware: Choose **CPU basic • 2 vCPU • 16 GB • Free**.
   - Visibility: Choose **Public** (required so your Render backend can reach it).
   - Click **Create Space**.
3. **Push the ML Code**:
   - Clone the space repository locally or upload the files directly through Hugging Face's web interface.
   - You need to upload all files located in the `ml-service/` folder:
     - `app/` (the entire directory including `main.py`, models, and features)
     - `Dockerfile`
     - `requirements.txt`
   - Hugging Face will automatically detect the `Dockerfile`, build the image, download the Hugging Face weights, and start the FastAPI server.
4. **Get ML URL**:
   - Once the build succeeds, click the **three dots** in the top right corner of your Space.
   - Click **Embed this Space**.
   - Copy the URL under **Direct URL**. It will look like this:
     ```text
     https://yourusername-sentinelx-ml-service.hf.space
     ```
   - **Save this URL.** You will need it for Render!

---

## 🚀 Step 3: Deploy Render (Backend Node.js API)
Render compiles and runs web apps directly from GitHub. The free tier hosts your Node app, spinning it down when idle.

1. **Sign Up**: Go to [Render](https://render.com) and sign up (link it to your GitHub account).
2. **Push to GitHub**: Push your SentinelX project workspace to your own GitHub repository.
3. **Create a Web Service**:
   - In Render Dashboard, click **New +** and select **Web Service**.
   - Connect your GitHub repository.
   - Name: `sentinelx-backend`
   - Root Directory: `backend` (Crucial - this tells Render to run within the backend folder)
   - Environment: `Node`
   - Build Command: `npm install` (or `npm ci`)
   - Start Command: `node server.js`
   - Plan: **Free**
4. **Configure Environment Variables**:
   Click **Advanced** or **Environment** and add the following keys:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render's default)
   - `MONGODB_URI` = `YOUR_MONGODB_ATLAS_CONNECTION_STRING` (from Step 1)
   - `ML_SERVICE_URL` = `YOUR_HUGGING_FACE_SPACE_DIRECT_URL` (from Step 2)
   - `JWT_SECRET` = `ANY_LONG_RANDOM_SECRET_KEY` (e.g., generate one with `openssl rand -base64 32`)
   - `FRONTEND_URL` = `https://your-app-name.vercel.app` (You can update this after Step 4)
   - `VIRUSTOTAL_API_KEY` = `your_key` (optional, for real reputation scans)
   - `ABUSEIPDB_API_KEY` = `your_key` (optional, for real reputation scans)
   - `WHOIS_API_KEY` = `your_key` (optional)
5. **Start & Seed Database**:
   - Click **Create Web Service**. It will build and boot.
   - Once it shows "Live", go to the service's **Shell** tab in the Render sidebar.
   - Seed the admin database by running:
     ```bash
     npm run seed
     ```
6. **Get Backend URL**:
   - Copy your Render app's public URL (e.g., `https://sentinelx-backend.onrender.com`).
   - **Save this URL.** You will need it for Vercel!

---

## 🎨 Step 4: Deploy Vercel (Frontend React app)
Vercel hosts frontend React code for free with global CDN speeds.

1. **Sign Up**: Go to [Vercel](https://vercel.com) and log in with your GitHub account.
2. **Create Project**:
   - Click **Add New** > **Project**.
   - Import your GitHub repository.
   - **Configure Project**:
     - Frame Preset: Select **Vite**.
     - Root Directory: Edit and select `frontend` (Crucial - tells Vercel to run in the frontend folder).
     - Build Command: `npm run build`
     - Output Directory: `dist`
3. **Environment Variables**:
   Under the Environment Variables section, add:
   - `VITE_API_URL` = `https://sentinelx-backend.onrender.com/api` (your backend Render URL with `/api` appended!)
4. **Deploy**:
   - Click **Deploy**. Vercel will build the frontend and host it.
   - Copy your live frontend Vercel URL (e.g., `https://sentinelx-yourusername.vercel.app`).
5. **Final Touch**:
   - Go back to your **Render Web Service** dashboard (Step 3).
   - Go to Environment.
   - Update `FRONTEND_URL` to your Vercel URL (e.g., `https://sentinelx-yourusername.vercel.app`).
   - Save changes. Render will automatically redeploy with the correct CORS configuration.

---

🎉 **Done!** Your SentinelX platform is now live on the internet, securely communicating across your free MongoDB, Hugging Face, Render, and Vercel services!
