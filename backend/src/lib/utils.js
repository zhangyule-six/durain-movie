import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  //cookie的名称是jwt，内容是token，配置选项如下
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, //防止 XSS攻击
    sameSite: "strict", //防止 CSRF攻击
    secure: process.env.NODE_ENV !== "development",
  });
  return token;
};
