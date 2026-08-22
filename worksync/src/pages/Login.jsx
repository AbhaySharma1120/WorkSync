import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { RiLockPasswordLine } from "react-icons/ri";
import toast from "react-hot-toast";

import loginImage from "../assets/login.png";
import api from "../api/axios";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // ============================
  // HANDLE INPUT CHANGE
  // ============================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ============================
  // HANDLE LOGIN
  // ============================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const response = await api.post("/auth/login", loginData);

      localStorage.setItem("token", response.data.token);

      localStorage.setItem("user", JSON.stringify(response.data.user));

      toast.success(response.data.message);

      navigate("/dashboard");
    } catch (error) {
      console.error("Login Error Response:", error.response?.data);

      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Login Section */}
      <div className="w-full lg:w-[45%] bg-[#15134b] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">W</span>
            </div>

            <h1 className="text-2xl font-bold text-white">WorkSync</h1>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold text-white">Welcome Back! 👋</h2>

          <p className="text-gray-400 mt-2 mb-8">
            Please login to your account
          </p>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm text-gray-300">Email</label>

              <div className="relative mt-2">
                <HiOutlineMail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full bg-[#1e1b5e] border border-purple-800 text-white rounded-lg py-3 pl-12 pr-4 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-300">Password</label>

              <div className="relative mt-2">
                <RiLockPasswordLine
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full bg-[#1e1b5e] border border-purple-800 text-white rounded-lg py-3 pl-12 pr-12 outline-none focus:border-purple-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" className="accent-purple-600" />
                Remember me
              </label>

              <button
                type="button"
                className="text-purple-400 hover:text-purple-300"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Sign Up */}
          <p className="text-center text-gray-400 mt-8">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-purple-400 hover:text-purple-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="hidden lg:block flex-1">
        <img
          src={loginImage}
          alt="WorkSync Login"
          className="w-full h-screen object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
