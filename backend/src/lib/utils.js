import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,       // bắt buộc khi dùng HTTPS
    sameSite: "none",   // cho phép cross-site
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return token;
};
