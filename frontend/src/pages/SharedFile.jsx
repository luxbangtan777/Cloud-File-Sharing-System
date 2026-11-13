import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";

function SharedFile() {
    const { token } = useParams();
    const location = useLocation();
    const [file, setFile] = useState(null);
    const [error, setError] = useState("Loading shared file...");

    useEffect(() => {
        const fetchSharedFile = async () => {
            try {
                const loginToken = sessionStorage.getItem("token");

                const response = await fetch(
                    `http://localhost:5000/api/files/shared/${token}`,
                    {
                        headers: loginToken
                            ? { Authorization: `Bearer ${loginToken}` }
                            : {}
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                setFile(data);
                setError("");

            } catch (err) {
                setError(err.message || "Unable to access shared file");
            }
        };

        fetchSharedFile();
    }, [token]);

    if (!file) {
    return (
        <div>
            <h2>Shared File</h2>
            <p>{error}</p>

            {error.toLowerCase().includes("log in") && (
                <Link
    to="/login"
    state={{ from: location.pathname }}
>
    <button>Go to Login</button>
</Link>
            )}
        </div>
    );
}

    return (
        <div>
            <h1>Shared File</h1>

            <h2>{file.originalName}</h2>

            <p>File size: {(file.size / 1024).toFixed(2)} KB</p>

            {file.mimeType.startsWith("image/") && (
                <img
                    src={file.previewUrl}
                    alt={file.originalName}
                    style={{
                        maxWidth: "100%",
                        maxHeight: "500px"
                    }}
                />
            )}

            {file.mimeType === "application/pdf" && (
                <iframe
                    src={file.previewUrl}
                    title="Shared PDF"
                    width="100%"
                    height="600px"
                    style={{ border: "none" }}
                />
            )}

            {!file.mimeType.startsWith("image/") &&
                file.mimeType !== "application/pdf" && (
                    <p>Preview is not supported for this file type.</p>
                )}

            <p>This file was shared with you through Cloud File Sharing.</p>
        </div>
    );
}

export default SharedFile;