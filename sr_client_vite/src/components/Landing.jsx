import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Landing({ setAuthenticated }) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                "http://127.0.0.1:5000/login",
                formData
            );
            setAuthenticated(true);
            navigate("/home", { state: { userName: response.data.user_name } });
        } catch (error) {
            setErrorMessage("Invalid email or password!");
            setTimeout(() => setErrorMessage(""), 2000);
        }
    };

    return (
        <div className="flex flex-row justify-center mt-[10%] gap-[170px]">
            {/* Left Content */}
            <div className="flex flex-col justify-evenly max-w-md">
                <h1 className="text-[50px] font-serif leading-tight">
                    Brain MRI<br />
                    <span className="text-[#aeb7c9] text-[60px]">
                        Super resolution
                    </span>
                </h1>
                <p className="text-[18px] leading-[30px] tracking-wide">
                    <h2 className="text-lg font-semibold mt-4">
                        Data Science Capstone Project
                    </h2>
                </p>
                <Link to="/register" className="inline-block w-[160px] mt-4">
                    <button className="w-full h-[40px] bg-[#dce6f8] text-black text-[18px] rounded-3xl cursor-pointer">
                        Sign Up
                    </button>
                </Link>
            </div>

            {/* Form */}
            <form
                className="flex flex-col items-center gap-[10px] w-[250px] h-[380px] rounded-[10px] bg-[linear-gradient(to_top,rgba(0,0,0,0.8)_50%,rgba(0,0,0,0.8)_50%)] text-white"
                onSubmit={handleSubmit}
            >
                <h1 className="text-2xl mt-4 mb-4 font-semibold">Login</h1>
                <input
                    type="text"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-white border-b text-black text-[15px] mt-4 px-1 py-1 outline-none rounded-md placeholder-gray-500 h-[45px] w-[210px]"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="bg-white border-b text-black text-[15px] px-1 py-2 outline-none rounded-md placeholder-gray-500 h-[45px] w-[210px]"
                />
                <button
                    type="submit"
                    className="bg-[#dce6f8] w-1/2 min-w-[70px] text-black py-2 rounded-full cursor-pointer text-[16px] mt-2"
                >
                    Login
                </button>
                {errorMessage && (
                    <div className="bg-black/50 backdrop-blur-md text-red-500 text-sm p-2 rounded mt-2">
                        {errorMessage}
                    </div>
                )}
            </form>
        </div>
    );
}

export default Landing;
