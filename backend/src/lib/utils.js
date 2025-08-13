import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "staging",       // chỉ HTTPS trong production
    sameSite: process.env.NODE_ENV === "staging" ? "none" : "lax",   // cho phép cross-site trong production
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return token;
};
