import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; //jwt是util中定义的cookie名字
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }
    //解码token（验证）
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const user = await User.findById(decoded.id).select("-password"); //不选择密码字段
    if (!user) {
      return res.status(404).json({ message: "Unauthorized - User not found" });
    }

    req.user = user; //将用户信息附加到请求对象上，供后续中间件或路由处理程序使用
    next(); //继续执行后续中间件或路由处理程序
  } catch (err) {
    console.log("Error in protectRoute MiddleWare:", err.message);
    res.status(500).json({ message: "Server error in authentication" });
  }
};
