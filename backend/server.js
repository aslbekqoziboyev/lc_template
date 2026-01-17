/**
 * BACKEND SERVER CODE
 * Run this in a Node.js environment.
 * 
 * Install dependencies:
 * npm install express mongoose cors dotenv jsonwebtoken bcryptjs
 * 
 * Usage:
 * node backend/server.js
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Recommended for password hashing

const app = express();
const PORT = process.env.PORT || 5000;

// ⚠️ DIQQAT: <db_password> ni o'zingizning haqiqiy MongoDB parolingiz bilan almashtiring!
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://coursemaker_1128:Azamat123@database.fjavu3b.mongodb.net/?appName=Database';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

app.use(cors());
app.use(express.json());

// --- MODELS ---

const userSchema = new mongoose.Schema({
  role: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  centerName: String,
  courseName: String,
  coursePrice: Number,
  monthlySalary: Number,
  salaryPaid: { type: Boolean, default: false },
  joinDate: String,
  isLeft: { type: Boolean, default: false },
  devices: [{
    id: String,
    name: String,
    lastLogin: String,
    ip: String,
    isCurrent: Boolean
  }]
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacherId: { type: String, required: false },
  schedule: { type: String, required: true },
  price: Number
});

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacherId: { type: String, required: true },
  courseName: String,
  paid: { type: Boolean, default: false },
  // Changed from Map to Object for easier JSON handling on frontend
  attendance: { type: Object, default: {} } 
}, { minimize: false }); // minimize: false ensures empty objects {} are saved

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Student = mongoose.model('Student', studentSchema);

// --- HELPERS ---

const getDeviceName = (ua) => {
  let name = 'Unknown Device';
  if (/windows/i.test(ua)) name = 'Windows PC';
  else if (/macintosh|mac os x/i.test(ua)) name = 'MacBook/iMac';
  else if (/linux/i.test(ua)) name = 'Linux PC';
  else if (/android/i.test(ua)) name = 'Android Device';
  else if (/iphone|ipad|ipod/i.test(ua)) name = 'iOS Device';

  if (/chrome/i.test(ua)) name += ' (Chrome)';
  else if (/firefox/i.test(ua)) name += ' (Firefox)';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) name += ' (Safari)';
  else if (/edge/i.test(ua)) name += ' (Edge)';
  
  return name;
};

// --- ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
  // Trim inputs to remove accidental spaces
  const { username, password } = req.body;
  const cleanUsername = username ? username.trim() : '';
  const cleanPassword = password ? password.trim() : '';

  try {
    // Find user by exact match (plain text)
    const user = await User.findOne({ username: cleanUsername, password: cleanPassword }); 
    
    if (!user) {
      console.log(`Login failed for user: ${cleanUsername}`);
      return res.status(401).json({ message: 'Login yoki parol noto‘g‘ri' });
    }
    
    // Capture Device Info
    const deviceId = 'dev-' + Date.now() + Math.floor(Math.random() * 1000);
    const deviceName = getDeviceName(req.headers['user-agent'] || '');
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Check if devices array exists, if not init
    if (!user.devices) user.devices = [];

    user.devices.push({
        id: deviceId,
        name: deviceName,
        lastLogin: new Date().toISOString(),
        ip: clientIp,
        isCurrent: true
    });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, user, currentDeviceId: deviceId });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    // Ensure username/password are trimmed before saving
    if(newUser.username) newUser.username = newUser.username.trim();
    if(newUser.password) newUser.password = newUser.password.trim();
    
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete specific device
app.delete('/api/users/:userId/devices/:deviceId', async (req, res) => {
    try {
      const { userId, deviceId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      user.devices = user.devices.filter(d => d.id !== deviceId);
      await user.save();
      res.json({ message: 'Device removed', user }); // Return updated user
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

// Courses
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/courses', async (req, res) => {
    try {
        const newCourse = new Course(req.body);
        await newCourse.save();
        res.json(newCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/courses/:id', async (req, res) => {
    try {
        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    await newStudent.save();
    res.json(newStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedStudent);
  } catch (err) {
     res.status(400).json({ message: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Connect DB & Start
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.log('Iltimos, server.js faylida <db_password> ni to\'g\'rilaganingizga ishonch hosil qiling.');
  });