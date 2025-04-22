import React from "react";

const Sidebar = ({ handleComponentChange }) => {
    const handleClick = (component) => {
        handleComponentChange(component);
    };

    return (
        <div className="fixed flex flex-col text-white text-[20px] justify-center gap-[50px] min-h-screen h-full z-[999] bg-black/50 backdrop-blur-md px-4">
            {/* <button
                onClick={() => handleClick("canvas")}
                className="w-[180px] h-[70px] rounded-3xl cursor-pointer transition duration-300 hover:bg-white/20"
            >
                Canvas
            </button> */}
            <button
                onClick={() => handleClick("upscale")}
                className="w-[180px] h-[70px] rounded-3xl cursor-pointer transition duration-300 hover:bg-white/20"
            >
                Upscale Images
            </button>
            <button
                onClick={() => handleClick("view")}
                className="w-[180px] h-[70px] rounded-3xl cursor-pointer transition duration-300 hover:bg-white/20"
            >
                Stored Images
            </button>
            {/* <button
                onClick={() => handleClick("diagnosis")}
                className="w-[180px] h-[70px] rounded-3xl cursor-pointer transition duration-300 hover:bg-white/20"
            >
                Diagnosis
            </button>
            <button
                onClick={() => handleClick("history")}
                className="w-[180px] h-[70px] rounded-3xl cursor-pointer transition duration-300 hover:bg-white/20"
            >
                History
            </button> */}
        </div>
    );
};

export default Sidebar;
