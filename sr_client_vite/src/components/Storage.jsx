import React, { useState, useEffect } from "react";
import axios from "axios";

function Storage({ userName }) {
    const [images, setImages] = useState([]);

    useEffect(() => {
        fetchImages();
    }, [userName]);

    const fetchImages = () => {
        axios
            .post(`http://127.0.0.1:5000/display`, { userName })
            .then((response) => {
                setImages(response.data);
            })
            .catch((error) => {
                console.error("Error fetching images:", error);
            });
    };

    const downloadImage = (image) => {
        const link = document.createElement("a");
        link.href = `data:image/jpeg;base64,${image}`;
        link.download = `image_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const deleteImage = (index) => {
        const imageToDelete = images[index];
        axios
            .post("http://127.0.0.1:5000/delete_image", {
                image: imageToDelete,
                userName: userName
            })
            .then(() => {
                fetchImages();
            })
            .catch((error) => {
                console.error("Error deleting image:", error);
            });
    };

    return (
        <div className="flex flex-wrap gap-[30px] max-w-[70vw]">
            {images.map((image, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                    <div className="relative w-[300px] h-[300px] group">
                        <button
                            className="absolute top-[5px] left-[265px] w-[20px] h-[20px] bg-[url('/delete.png')] bg-no-repeat bg-contain invisible group-hover:visible"
                            onClick={() => deleteImage(index)}
                        ></button>
                        <img
                            src={`data:image/jpeg;base64,${image}`}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <button
                        onClick={() => downloadImage(image)}
                        className="w-[80px] h-[30px] flex justify-center items-center rounded-md bg-gray-200 hover:bg-gray-300"
                    >
                        Download
                    </button>
                </div>
            ))}
        </div>
    );
}

export default Storage;
