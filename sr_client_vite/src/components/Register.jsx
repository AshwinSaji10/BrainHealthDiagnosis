import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Register() {
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios
            .post("http://127.0.0.1:5000/register", formData)
            .then((response) => {
                console.log(response.data);
                setNotification({
                    type: "success",
                    message: "Registration successful!",
                });
                setTimeout(() => {
                    setNotification(null);
                }, 2000);
            })
            .catch((error) => {
                setNotification({
                    type: "error",
                    message: "Registration failed! Username already exists.",
                });
                setTimeout(() => {
                    setNotification(null);
                }, 2000);
                console.error("Error:", error);
            });
    };

    return (
        <div className="flex flex-col items-center justify-center mt-[5%] gap-4">
            <form
                className="flex flex-col items-center justify-evenly min-h-[80vh] min-w-[35vw] rounded-[10px] bg-[linear-gradient(to_top,rgba(0,0,0,0.8)_50%,rgba(0,0,0,0.8)_50%)] text-white"
                onSubmit={handleSubmit}
            >
                <h1 className="text-2xl font-semibold my-2">Register</h1>

                <div className="flex flex-row items-center gap-5 mx-4 mt-4 w-full max-w-xs">
                    <label className="max-w-[140px] break-words text-sm">
                        Enter your email address
                    </label>
                    <input
                        type="text"
                        name="email"
                        placeholder="Eg: abc@gmail.com"
                        pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                        title="Please enter a valid email address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-white border-b text-black text-[15px] px-1 py-1 w-[180px] h-[50px] outline-none rounded-md placeholder-gray-500"
                    />
                </div>

                <div className="flex flex-row items-center gap-5 mx-4 mt-4 w-full max-w-xs">
                    <label className="max-w-[140px] break-words text-sm">
                        Enter your password
                    </label>
                    <input
                        type="password"
                        name="password"
                        placeholder="********"
                        minLength="8"
                        maxLength="20"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="bg-white border-b text-black text-[15px] px-1 py-1 w-[180px] h-[50px] outline-none rounded-md placeholder-gray-500"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-[#dce6f8] text-black text-[18px] w-[160px] h-[40px] rounded-3xl mt-6 hover:opacity-90"
                >
                    Register
                </button>

                <Link to="/" className="text-[#4285F4] text-sm mt-4 hover:underline">
                    Already have an account? Login here
                </Link>
            </form>

            {notification && (
                <div
                    className={`bg-black/50 backdrop-blur-md text-sm px-4 py-2 rounded ${
                        notification.type === "error"
                            ? "text-red-500"
                            : "text-green-500"
                    }`}
                >
                    {notification.message}
                </div>
            )}
        </div>
    );
}

export default Register;
