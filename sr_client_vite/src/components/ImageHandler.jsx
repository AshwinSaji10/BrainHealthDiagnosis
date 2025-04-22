import React, { useEffect, useState } from "react";
import axios from "axios";

const placeholderImage = "/placeholder1.png";
const loadingIcon = "/loading.gif";

function ImageHandler({ userName }) {
    const [compare, setCompare] = useState(null);
    const [selectedModel, setSelectedModel] = useState("rrdb");
    const [originalDimensions, setOriginalDimensions] = useState(null);
    const [processedDimensions, setProcessedDimensions] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileURL, setSelectedFileURL] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [downloadEnabled, setDownloadEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const modelOptions = [
        { label: "EDSR", value: "rrdb" },
        { label: "Custom Model", value: "esrgan" },
        { label: "SRGAN", value: "srgan" }
        // { label: "SwinIR", value: "swinir" },
        // { label: "BSRGAN", value: "bsrgan" },
    ];

    const fileSelectedHandler = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);

        setProcessedImage(null);
        setDownloadEnabled(null);
        setProcessedDimensions(null);

        const fileURL = URL.createObjectURL(file);
        setSelectedFileURL(fileURL);
        const img = new Image();
        img.src = fileURL;
        img.onload = () => {
            setOriginalDimensions({ width: img.width, height: img.height });
        };
        
        // console.log("Original image dimensions: ", originalDimensions);
    };

    const fileUploadHandler = () => {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("userName", userName);
        formData.append("model", selectedModel);
        setLoading(true);
        axios
            .post("http://127.0.0.1:5000/image", formData, {
                responseType: "json",
            })
            .then((response) => {
                const base64Image = response.data.image;
                setProcessedImage(response.data.image);
                setDownloadEnabled(true);
                const img = new Image();
                img.src = `data:image/jpeg;base64,${base64Image}`;
                img.onload = () => {
                    setProcessedDimensions({
                        width: img.width,
                        height: img.height,
                    });
                };
            })
            .catch((error) => {
                console.error("Error uploading file: ", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const downloadImageHandler = () => {
        const link = document.createElement("a");
        link.href = `data:image/jpeg;base64,${processedImage}`;
        link.setAttribute("download", "processed_image.png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-row gap-[150px]">
            {/* Original Image Section */}
            <div className="flex flex-col items-center gap-[25px]">
                <div className="flex flex-col w-[320px] h-[340px] bg-[#dce6f8] rounded-2xl items-center justify-center">
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
                    {originalDimensions && (
                        <p className="text-sm text-black">
                            {originalDimensions.width} x{" "}
                            {originalDimensions.height}
                        </p>
                    )}
                    {/* <h1>hi</h1> */}
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
            </div>

            {/* Button + Loading Section */}
            <div className="flex flex-col items-center justify-end gap-[120px]">
                {loading && (
                    <img
                        src={loadingIcon}
                        alt="Loading"
                        className="w-[120px] h-[120px]"
                    />
                )}
                <div className="flex flex-col items-center justify-center">
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-[120px] mb-4 p-1 rounded bg-white border border-gray-300 text-sm text-black"
                    >
                        {modelOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={fileUploadHandler}
                        disabled={loading || !selectedFile}
                        className="w-[120px] h-[35px] bg-[#dce6f8] text-black rounded-full hover:opacity-90 disabled:opacity-50"
                    >
                        Upscale 4x
                    </button>
                    <button
                        className="mt-2 w-[140px] h-[50px] bg-[#dce6f8] text-black rounded-2xl hover:opacity-90 disabled:opacity-50"
                    >
                        Compare all Models
                    </button>
                </div>
            </div>

            {/* Processed Image Section */}
            <div className="flex flex-col items-center gap-[25px]">
                <div className="flex flex-col w-[320px] h-[340px] bg-[#dce6f8] rounded-2xl items-center justify-center">
                    <div className="w-[300px] h-[300px] overflow-hidden">
                        {processedImage ? (
                            <img
                                src={`data:image/jpeg;base64,${processedImage}`}
                                alt="Processed"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={placeholderImage}
                                alt="Placeholder"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    {processedDimensions && (
                        <p className="text-sm text-gray-600">
                            {processedDimensions.width} x{" "}
                            {processedDimensions.height}
                        </p>
                    )}
                </div>
                <button
                    onClick={downloadImageHandler}
                    disabled={!downloadEnabled}
                    className="w-[100px] h-[35px] bg-[#dce6f8] text-black rounded hover:opacity-90 disabled:opacity-50"
                >
                    Download
                </button>
            </div>
        </div>
    );
}

export default ImageHandler;
