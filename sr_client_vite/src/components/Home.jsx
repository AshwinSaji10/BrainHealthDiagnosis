import ImageHandler from "./ImageHandler";
import Canvas from "./Canvas";
import Diagnosis from "./Diagnosis";
import History from "./History";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import Storage from "./Storage";

const ProfileIcon = "/user_icon.png";

function Home() {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentComponent, setCurrentComponent] = useState(null);

    const userName = location.state ? location.state.userName : "";

    const handleLogout = async () => {
        try {
            const response = await axios.post("http://127.0.0.1:5000/logout");
            console.log(response.data);
            navigate("/", { replace: true });
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleComponentChange = (component) => {
        setCurrentComponent(component);
    };

    return (
        <div className="flex flex-row gap-[290px]">
            <div className="sidebar-container">
                <Sidebar handleComponentChange={handleComponentChange} />
            </div>
            <div className="flex flex-col items-start gap-[50px]">
                <div className="ml-220 flex-row items-start justify-end gap-[350px] mb-[50px]">
                    {/* <h1 className="font-semibold leading-tight text-[50px] tracking-[2px] text-white">
                        Single Image
                        <br />
                        <span className="text-[#ff7200] text-[50px]">Capstone Project</span>
                    </h1> */}
                    <div className="flex flex-row items-center gap-[20px] mt-5">
                        <div className="flex flex-col items-center text-white">
                            <h2>
                                {userName
                                    .substring(0, userName.indexOf("@"))
                                    .substring(0, 15)}
                            </h2>
                            <button
                                onClick={handleLogout}
                                className="bg-[#dce6f8] text-black px-4 py-1 mt-1 w-[100px] h-[35px] rounded-full hover:opacity-90"
                            >
                                Logout
                            </button>
                        </div>
                        <div>
                            <img
                                src={ProfileIcon}
                                alt="Profile Icon"
                                className="w-[100px] h-[100px] mt-[20px]"
                            />
                        </div>
                    </div>
                </div>
                {currentComponent === "view" ? (
                    <Storage userName={userName} />
                ) : (
                    <ImageHandler userName={userName} />
                )}

                {/* {currentComponent === "view" ? (
                    <Storage userName={userName} />
                ) : currentComponent === "upscale" ? (
                    <ImageHandler userName={userName} />
                ) : currentComponent === "diagnosis" ? (
                    <Diagnosis/>
                ):
                (
                    <History />
                )} */}
            </div>
        </div>
    );
}

export default Home;
