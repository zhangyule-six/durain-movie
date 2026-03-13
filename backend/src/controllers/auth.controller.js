import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }
    //hash password，此处使用bcryptjs进行密码加密
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // 查询用户名/邮箱是否已存在
    const [existingByEmail, existingByUsername] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ username }),
    ]);

    if (existingByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (existingByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    //哈希密码
    const salt = await bcrypt.genSalt(10); //方法返回一个promise/生成hash
    const hashedPassword = await bcrypt.hash(password, salt); //password和salt结合生成不可逆hash

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      //生成jwt token
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio,
        role: newUser.role,
        stats: newUser.stats,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (err) {
    console.log("Error in signup:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password); //比较明文密码和哈希密码

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      stats: user.stats,
    });
  } catch (err) {
    console.log("Error in login:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.log("Error in logout:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    // 兼容旧字段 profilePic（前端若还在用）
    const avatarInput = req.body.avatar ?? req.body.profilePic;
    const userId = req.user._id;

    if (!avatarInput) {
      return res
        .status(400)
        .json({ message: "Please provide avatar" });
    }

    const uploadResponse = await cloudinary.uploader.upload(avatarInput); //图片上传云端
    //更新数据库中数据
    const updateUser = await User.findByIdAndUpdate(
      userId,
      { avatar: uploadResponse.secure_url },
      { new: true },
    );

    res.status(200).json(updateUser);
  } catch (err) {
    console.log("Error in updateProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.log("Error in checkAuth:", err);
    res.status(500).json({ message: "Server error" });
  }
};
