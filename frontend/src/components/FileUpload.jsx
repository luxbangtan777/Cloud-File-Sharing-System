
import { useState } from "react";

function FileUpload() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            setMessage("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = sessionStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/files/upload",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setMessage("File uploaded successfully!");
            setFile(null);
            e.target.reset();

        } catch (error) {
            setMessage(error.message || "Upload failed!");
        }
    };

    return (
        <div>
            <h2>Upload Your Files</h2>

            <form onSubmit={handleUpload}>
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                />

                <button type="submit">
                    Upload File
                </button>
            </form>

            <p>{message}</p>
        </div>
    );
}

export default FileUpload;
