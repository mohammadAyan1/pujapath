import bcrypt from "bcrypt";
import db from "../utils/db.js";
import { sendOTPEmail } from "../utils/sendMail.js";
import jwt from "jsonwebtoken";
import redisClient from "../utils/redis.js";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

export const login = async (req, res) => {
  const connection = db.promise();

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 🔍 Find user
    const query = `
      SELECT id, name, email, password, role, is_verified,is_approved
      FROM users
      WHERE email = ?
    `;

    const [rows] = await connection.execute(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = rows[0];



    if (!user?.is_approved) {
      return res.status(403).json({
        success: false,
        message:
          "You are not logged in this website please contact Support Team",
      });
    }

    // ❌ Email not verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    // 🔐 Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 🎫 Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    // 🍪 Store token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // set true in production (HTTPS)
      sameSite: "strict",//set none in product none or strict 
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: `Login failed ${error.message}`,
    });
  }
};

export const logout = async (req, res) => {
  try {
    // ❌ Clear JWT cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "strict", // strict
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

// export const register = async (req, res) => {
//   const connection = await db.promise().getConnection();



//   // console.log(adminAuthentication);


//   try {
//     const { name, email, mobile, password } = req.body;

//     // ✅ Basic validation
//     if (!name || !email || !mobile || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     // ✅ 1. Check if email OR mobile already exists
//     const [existingUsers] = await connection.execute(
//       `
//       SELECT id, email, mobile
//       FROM users
//       WHERE email = ? OR mobile = ?
//       `,
//       [email, mobile],
//     );

//     if (existingUsers.length > 0) {
//       const existingUser = existingUsers[0];

//       if (existingUser.email === email) {
//         return res.status(409).json({
//           success: false,
//           message: "Email already registered",
//         });
//       }

//       if (existingUser.mobile === mobile) {
//         return res.status(409).json({
//           success: false,
//           message: "Mobile number already registered",
//         });
//       }
//     }

//     // 🔐 2. Start transaction ONLY after validation
//     await connection.beginTransaction();

//     // 🔐 Hash password
//     const hashPassword = await bcrypt.hash(password, 10);

//     // 🔢 Generate OTP
//     const otp = generateOTP();
//     const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

//     // ✅ 3. Insert user
//     const insertQuery = `
//       INSERT INTO users 
//       (name, email, mobile, password, otp, otp_time_limit)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `;

//     await connection.execute(insertQuery, [
//       name,
//       email,
//       mobile,
//       hashPassword,
//       otp,
//       otpExpiryTime,
//     ]);

//     // 📧 OTP email template
//     const html = `
//       <h2>Email Verification</h2>
//       <p>Your OTP is:</p>
//       <h1>${otp}</h1>
//       <p>This OTP is valid for <b>5 minutes</b>.</p>
//     `;

//     // 📧 Send email
//     await sendOTPEmail(email, "Email Verification OTP", html);

//     // ✅ 4. Commit transaction
//     await connection.commit();

//     return res.status(201).json({
//       success: true,
//       message: "User registered successfully. OTP sent to email.",
//       data: { email },
//     });
//   } catch (error) {
//     // ❌ Rollback on ANY failure
//     await connection.rollback();
//     console.log(error);

//     console.error("Register Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Registration failed",
//     });
//   } finally {
//     connection.release();
//   }
// };




// Admin register user




export const register = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check existing user
    const [existingUsers] = await connection.execute(
      `
      SELECT id, email, mobile
      FROM users
      WHERE email = ? OR mobile = ?
      `,
      [email, mobile]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      if (existingUser.mobile === mobile) {
        return res.status(409).json({
          success: false,
          message: "Mobile number already registered",
        });
      }
    }

    await connection.beginTransaction();

    // Password hash
    const hashPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Insert user WITHOUT otp column
    const insertQuery = `
      INSERT INTO users
      (name, email, mobile, password)
      VALUES (?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      name,
      email,
      mobile,
      hashPassword,
    ]);

    // Save OTP in Redis for 5 min
    await redisClient.set(
      `verify:${email}`,
      otp,
      {
        EX: 300, // 5 minutes
      }
    );

    const html = `
      <h2>Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for <b>5 minutes</b>.</p>
    `;

    await sendOTPEmail(
      email,
      "Email Verification OTP",
      html
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent to email.",
      data: { email },
    });

  } catch (error) {

    await connection.rollback();

    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });

  } finally {
    connection.release();
  }
};


export const adminRegister = async (req, res) => {

  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }



  const connection = await db.promise().getConnection();

  try {
    const { name, email, mobile, password } = req.body;

    // ✅ Basic validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }


    if (password?.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password Length should be 8 or Greater than 8",
      });
    }

    // ✅ 1. Check if email OR mobile already exists
    const [existingUsers] = await connection.execute(
      `
      SELECT id, email, mobile
      FROM users
      WHERE email = ? OR mobile = ?
      `,
      [email, mobile],
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      if (existingUser.mobile === mobile) {
        return res.status(409).json({
          success: false,
          message: "Mobile number already registered",
        });
      }
    }

    // 🔐 2. Start transaction ONLY after validation
    await connection.beginTransaction();

    // 🔐 Hash password
    const hashPassword = await bcrypt.hash(password, 10);


    // ✅ 3. Insert user
    const insertQuery = `
      INSERT INTO users 
      (name, email, mobile, password,is_verified)
      VALUES (?, ?, ?, ?, 1)
    `;

    await connection.execute(insertQuery, [
      name,
      email,
      mobile,
      hashPassword,
    ]);


    // ✅ 4. Commit transaction
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { email },
    });
  } catch (error) {
    // ❌ Rollback on ANY failure
    await connection.rollback();
    console.log(error);

    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  } finally {
    connection.release();
  }
};


// export const verifyEmail = async (req, res) => {
//   const connection = db.promise();

//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Email and OTP are required",
//       });
//     }

//     // 🔍 Check user
//     const selectQuery = `
//       SELECT id, otp, otp_time_limit, is_verified,is_approved
//       FROM users
//       WHERE email = ?
//     `;

//     const [rows] = await connection.execute(selectQuery, [email]);

//     if (rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const user = rows[0];

//     // ❌ Already verified
//     if (user.is_verified) {
//       return res.status(400).json({
//         success: false,
//         message: "Email already verified",
//       });
//     }

//     if (!user.is_approved) {
//       return res.status(400).json({
//         success: false,
//         message: "You Could not verify your main Please contact Support Team",
//       });
//     }

//     // ❌ OTP mismatch
//     if (String(user.otp) !== String(otp)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP",
//       });
//     }

//     // ❌ OTP expired
//     if (new Date(user.otp_time_limit) < new Date()) {
//       return res.status(400).json({
//         success: false,
//         message: "OTP expired",
//       });
//     }

//     // ✅ Verify user
//     const updateQuery = `
//       UPDATE users
//       SET is_verified = true,
//           otp = NULL,
//           otp_time_limit = NULL
//       WHERE id = ?
//     `;

//     await connection.execute(updateQuery, [user.id]);

//     return res.status(200).json({
//       success: true,
//       message: "Email verified successfully",
//     });
//   } catch (error) {
//     console.error("Verify Email Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Email verification failed",
//     });
//   }
// };


export const verifyEmail = async (req, res) => {
  const connection = db.promise();

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // User check
    const [rows] = await connection.execute(
      `
      SELECT id, is_verified, is_approved
      FROM users
      WHERE email = ?
      `,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    // Already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // Admin approval check
    if (!user.is_approved) {
      return res.status(400).json({
        success: false,
        message:
          "You Could not verify your email. Please contact Support Team",
      });
    }

    // OTP from Redis
    const savedOtp = await redisClient.get(
      `verify:${email}`
    );

    // OTP Expired
    if (!savedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // OTP Invalid
    if (String(savedOtp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Verify User
    await connection.execute(
      `
      UPDATE users
      SET is_verified = true
      WHERE id = ?
      `,
      [user.id]
    );

    // Delete OTP from Redis
    await redisClient.del(
      `verify:${email}`
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {

    console.error("Verify Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Email verification failed",
    });

  }
};

export const resendOTP = async (req, res) => {
  const connection = db.promise();

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 🔍 Check user
    const selectQuery = `
      SELECT id, is_verified,is_approved
      FROM users
      WHERE email = ?
    `;

    const [rows] = await connection.execute(selectQuery, [email]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    // ❌ Already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    if (!user.is_approved) {
      return res.status(400).json({
        success: false,
        message: "You could not resend OTP Please Contact Support Team ",
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000);

    const html = `
      <h2>Resend OTP For Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for <b>5 minutes</b>.</p>
    `;

    // 🔄 Update OTP
    const updateQuery = `
      UPDATE users
      SET otp = ?, otp_time_limit = ?
      WHERE id = ?
    `;

    await connection.execute(updateQuery, [otp, otpExpiryTime, user.id]);

    // 📧 Send OTP email
    await sendOTPEmail(email, "OTP Resend Successfully", html);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};

export const forgotPassword = async (req, res) => {
  const connection = db.promise();

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 🔍 Check user
    const [rows] = await connection.execute(
      "SELECT id,is_approved FROM users WHERE email = ?",
      [email],
    );



    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!rows?.[0]?.is_approved) {
      return res.status(400).json({
        success: false,
        message: "You could not Forget Password Please Contact Support Team ",
      });
    }
    const otp = generateOTP();
    const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000);

    // 🔄 Update OTP
    await connection.execute(
      `
      UPDATE users 
      SET otp = ?, otp_time_limit = ?
      WHERE email = ?
      `,
      [otp, otpExpiryTime, email],
    );

    const html = `
      <h2>Reset Password OTP</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for <b>5 minutes</b>.</p>
    `;

    // 📧 Send OTP
    await sendOTPEmail(email, "Reset Password OTP", html);

    return res.status(200).json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

export const resetPassword = async (req, res) => {
  const connection = db.promise();

  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 🔍 Get user
    const [rows] = await connection.execute(
      `
      SELECT id, otp, otp_time_limit ,is_approved
      FROM users 
      WHERE email = ?
      `,
      [email],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!rows?.[0]?.is_approved) {
      return res.status(400).json({
        success: false,
        message: "You could not Reset Password Please Contact Support Team ",
      });
    }

    const user = rows[0];

    // ❌ OTP mismatch
    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ❌ OTP expired
    if (new Date(user.otp_time_limit) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // 🔐 Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Update password & clear OTP
    await connection.execute(
      `
      UPDATE users
      SET password = ?, otp = NULL, otp_time_limit = NULL
      WHERE id = ?
      `,
      [hashedPassword, user.id],
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};
