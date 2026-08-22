import api from "../api/axios";
import toast from "react-hot-toast";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { HiOutlineMail, HiOutlineUser } from "react-icons/hi";
import { RiLockPasswordLine } from "react-icons/ri";
import registerImage from "../assets/register.png";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    //Base frontend validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", formData);

      toast.success(response.data.message);

      navigate("/login");
    } catch (error) {
      console.error("Registration Error:", error);

      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Section */}
      <div className="w-full lg:w-[45%] bg-[#15134b] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">W</span>
            </div>

            <h1 className="text-2xl font-bold text-white">WorkSync</h1>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold text-white">Create Account</h2>

          <p className="text-gray-400 mt-2 mb-8">
            Start managing your projects with WorkSync
          </p>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="text-sm text-gray-300">Full Name</label>

              <div className="relative mt-2">
                <HiOutlineUser
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full bg-[#1e1b5e] border border-purple-800 text-white rounded-lg py-3 pl-12 pr-4 outline-none focus:border-purple-500"
                />
              </div>
            </div>

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
                  placeholder="Enter your email address"
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
                  placeholder="Create a password"
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

            {/* Terms */}
            <label className="flex items-start gap-2 text-sm text-gray-300">
              <input type="checkbox" className="accent-purple-600 mt-1" />

              <span>I agree to the Terms and Privacy Policy</span>
            </label>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-400 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-400 hover:text-purple-300">
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="hidden lg:block flex-1">
        <img
          src={registerImage}
          alt="WorkSync Register"
          className="w-full h-screen object-cover"
        />
      </div>
    </div>
  );
};

export default Register;
