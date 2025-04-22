import React, { useState } from "react";
import axios from "axios";

const placeholderImage = "/placeholder1.png";

const Diagnosis = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileURL, setSelectedFileURL] = useState(null);
    const fileSelectedHandler = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setSelectedFileURL(URL.createObjectURL(file));
    };
    const fileUploadHandler = () => {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("userName", userName);
        setLoading(true);
        axios
            .post("http://127.0.0.1:5000/diagnosis", formData, {
                responseType: "json",
            })
            .then((response) => {
                setProcessedImage(response.data.image);
                setDownloadEnabled(true);
            })
            .catch((error) => {
                console.error("Error uploading file: ", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };
    return (
        <div>
            <div className="flex flex-row items-center gap-5 mx-4 mt-4 w-full max-w-xs">
                <label className="max-w-[140px] break-words text-sm">
                    Enter name
                </label>
                <input
                    type="text"
                    name="name"
                    placeholder="Eg. John"
                    className="bg-white border-b text-black text-[15px] px-1 py-1 w-[180px] h-[50px] outline-none rounded-md placeholder-gray-500"
                />
            </div>
            <div className="flex flex-row items-center gap-5 mx-4 mt-4 w-full max-w-xs">
                <label className="max-w-[140px] break-words text-sm">
                    Enter age
                </label>
                <input
                    type="number"
                    name="name"
                    placeholder="Eg. 45"
                    className="bg-white border-b text-black text-[15px] px-1 py-1 w-[180px] h-[50px] outline-none rounded-md placeholder-gray-500"
                />
            </div>
            <div className="flex flex-col gap-2 mx-4 mt-4">
                <label className="text-sm">Select gender</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="gender"
                            value="male"
                            className="accent-blue-600"
                        />
                        Male
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="gender"
                            value="female"
                            className="accent-pink-600"
                        />
                        Female
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="gender"
                            value="other"
                            className="accent-green-600"
                        />
                        Other
                    </label>
                </div>
            </div>
            <div className="w-[300px] h-[300px] overflow-hidden">
                {!selectedFileURL ? (
                    <img
                        src={placeholderImage}
                        alt="Placeholder"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={selectedFileURL}
                        alt="Selected File"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
            <input
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={fileSelectedHandler}
            />
            <label
                htmlFor="fileUpload"
                className="bg-[#dce6f8] text-sm text-black font-semibold px-4 py-2 rounded-xl cursor-pointer hover:opacity-90"
            >
                Upload
            </label>
            <button
                    onClick={fileUploadHandler}
                    className="w-[120px] h-[35px] bg-[#dce6f8] text-black rounded-full hover:opacity-90 disabled:opacity-50"
                >
                    Perform Diagnosis
                </button>
        </div>
    );
};

export default Diagnosis;
