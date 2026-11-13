
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileUpload from "../components/FileUpload";
import "../Dashboard.css";

function Dashboard() {
    const [message, setMessage] = useState("Loading...");
    const [files, setFiles] = useState([]);
    const [selectedType, setSelectedType] = useState("all");
    const [previewFile, setPreviewFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filesLoading, setFilesLoading] = useState(true);
    const [filesError, setFilesError] = useState("");
    const [shareLinks, setShareLinks] = useState({});
    const [openShareDropdown, setOpenShareDropdown] = useState({});
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [showSharedOnly, setShowSharedOnly] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        fetch("http://localhost:5000/api/protected", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Authentication failed");
                }
                return response.json();
            })
            .then(data => {
                setMessage(`Welcome, ${data.user.name}!`);
            })
            .catch(() => {
                sessionStorage.removeItem("token");
                navigate("/login");
            });

        fetch("http://localhost:5000/api/files", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Could not fetch files");
                }
                return response.json();
            })
           .then(data => {
    setFiles(data.files);

    // Restore existing sharing links after refreshing
    const savedLinks = {};

    data.files.forEach(file => {
        if (file.isShared && file.shareToken) {
            savedLinks[file._id] =
                `http://localhost:5173/shared/${file.shareToken}`;
        }
    });

    setShareLinks(savedLinks);
    setFilesLoading(false);
})
            .catch(() => {
                setFilesError("Unable to load your files.");
                setFilesLoading(false);
            });

    }, [navigate]);

    const handlePreview = async (fileId) => {
        try {
            const token = sessionStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/files/preview/${fileId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Preview failed");
            }

            setPreviewFile(data);

        } catch (error) {
            alert(error.message || "Unable to preview file");
        }
    };

    const handleDownload = async (fileId) => {
        try {
            const token = sessionStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/files/download/${fileId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Download failed");
            }

            window.location.href = data.downloadUrl;

        } catch (error) {
            alert(error.message || "Unable to download file");
        }
    };

    // Generate sharing link and open dropdown
    const handleShare = async (fileId, shareType) => {
        try {
            const token = sessionStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/files/share/${fileId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ shareType })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Sharing failed");
            }

            setShareLinks(prev => ({
                ...prev,
                [fileId]: data.shareUrl
            }));

            setOpenShareDropdown(prev => ({
                ...prev,
                [fileId]: true
            }));

            setFiles(prevFiles =>
                prevFiles.map(file =>
                    file._id === fileId
                        ? {
                            ...file,
                            isShared: true,
                            shareType: shareType
                        }
                        : file
                )
            );

            alert("Sharing link generated successfully!");

        } catch (error) {
            alert(error.message || "Unable to share file");
        }
    };

    // Revoke sharing link
    const handleRevokeShare = async (fileId) => {
        const confirmRevoke = window.confirm(
            "Are you sure you want to revoke this sharing link?"
        );

        if (!confirmRevoke) return;

        try {
            const token = sessionStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/files/share/${fileId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Revocation failed");
            }

            setShareLinks(prev => {
                const updatedLinks = { ...prev };
                delete updatedLinks[fileId];
                return updatedLinks;
            });

            setOpenShareDropdown(prev => ({
                ...prev,
                [fileId]: false
            }));

            setFiles(prevFiles =>
                prevFiles.map(file =>
                    file._id === fileId
                        ? {
                            ...file,
                            isShared: false,
                            shareToken: null,
                            shareType: null
                        }
                        : file
                )
            );

            alert("Sharing access revoked successfully!");

        } catch (error) {
            alert(error.message || "Unable to revoke sharing");
        }
    };

    // Delete file
    const handleDelete = async (fileId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this file?"
        );

        if (!confirmDelete) return;

        try {
            const token = sessionStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/files/${fileId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Delete failed");
            }

            setFiles(prevFiles =>
                prevFiles.filter(file => file._id !== fileId)
            );

            alert("File deleted successfully!");

        } catch (error) {
            alert(error.message || "Unable to delete file");
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login");
    };

    // Search and shared-file filtering
   // Search, shared-file and file-type filtering
const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesShared = !showSharedOnly || file.isShared;

    const extension = file.originalName
        .split(".")
        .pop()
        .toLowerCase();

    let matchesType = true;

    if (selectedType === "pdf") {
        matchesType = extension === "pdf";
    } else if (selectedType === "image") {
        matchesType = file.mimeType.startsWith("image/");
    } else if (selectedType === "video") {
        matchesType = file.mimeType.startsWith("video/");
    } else if (selectedType === "audio") {
        matchesType = file.mimeType.startsWith("audio/");
    } else if (selectedType === "document") {
        matchesType = ["doc", "docx", "txt"].includes(extension);
    } else if (selectedType === "other") {
        matchesType = ![
            "pdf", "doc", "docx", "txt",
            "jpg", "jpeg", "png", "gif", "webp",
            "mp4", "mp3", "wav",
        ].includes(extension);
    }

    return matchesSearch && matchesShared && matchesType;
});
    // Dashboard statistics
    const sharedFilesCount = files.filter(
        file => file.isShared
    ).length;

    const totalStorage = files.reduce(
        (total, file) => total + file.size,
        0
    );

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

const getFileIcon = (file) => {
    const type = file.mimeType || "";
    const extension = file.originalName.split(".").pop().toLowerCase();

    if (type === "application/pdf" || extension === "pdf") return "📕";

    if (type.startsWith("image/")) return "🖼️";

    if (type.startsWith("video/")) return "🎬";

    if (type.startsWith("audio/")) return "🎵";

    if (
        type.includes("word") ||
        ["doc", "docx"].includes(extension)
    ) return "📝";

    if (
        type.includes("spreadsheet") ||
        type.includes("excel") ||
        ["xls", "xlsx", "csv"].includes(extension)
    ) return "📊";

    if (
        type.includes("presentation") ||
        ["ppt", "pptx"].includes(extension)
    ) return "📽️";

    if (
        ["zip", "rar", "7z"].includes(extension)
    ) return "🗜️";

    if (type.startsWith("text/")) return "📄";

    return "📁";
};

    return (
        <div className="dashboard-container">

            {/* Sidebar */}
            <aside className="sidebar">

                <div className="sidebar-brand">
                    <h2>CloudSpace</h2>
                    <p>Your files, your space.</p>
                </div>

                <div className="sidebar-menu">
                    <p className="menu-label">WORKSPACE</p>

                    <div
                        className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`}
                        onClick={() => {
                            setActiveMenu("dashboard");
                            setShowSharedOnly(false);
                            document.getElementById("dashboard-top").scrollIntoView({
                                behavior: "smooth"
                            });
                        }}
                    >
                        ☁️ My Dashboard
                    </div>

                    <div
                        className={`menu-item ${activeMenu === "files" ? "active" : ""}`}
                        onClick={() => {
                            setActiveMenu("files");
                            setShowSharedOnly(false);
                            document.getElementById("my-files").scrollIntoView({
                                behavior: "smooth"
                            });
                        }}
                    >
                        📁 My Files
                    </div>

                    <div
                        className={`menu-item ${activeMenu === "shared" ? "active" : ""}`}
                        onClick={() => {
                            setActiveMenu("shared");
                            setShowSharedOnly(true);
                            document.getElementById("my-files").scrollIntoView({
                                behavior: "smooth"
                            });
                        }}
                    >
                        🔗 Shared Files
                    </div>
                </div>

            </aside>

            {/* Main dashboard */}
            <main className="dashboard-main">

                <header className="dashboard-header" id="dashboard-top">
                    <h1>Cloud File Sharing System</h1>
                    <h2>{message}</h2>
                </header>

                {/* Statistics */}
                <section className="stats-container">

                    <div className="stat-card">
                        <p>Total Files</p>
                        <h2>{files.length}</h2>
                    </div>

                    <div className="stat-card">
                        <p>Shared Files</p>
                        <h2>{sharedFilesCount}</h2>
                    </div>

                    <div className="stat-card">
                        <p>Storage Used</p>
                        <h2>
                            {(totalStorage / (1024 * 1024)).toFixed(2)} MB
                        </h2>
                    </div>

                </section>

                {/* Upload section */}
                <section className="upload-section">
                    <FileUpload />
                </section>

                {/* Preview section */}
               
{previewFile && (
    <div className="preview-overlay">
        <section className="preview-modal">

            <div className="preview-modal-header">
                <h2>File Preview</h2>

                <button
                    className="preview-close"
                    onClick={() => setPreviewFile(null)}
                >
                    ×
                </button>
            </div>

            <p className="preview-filename">
                {previewFile.originalName}
            </p>

            <div className="preview-modal-content">

                {previewFile.mimeType.startsWith("image/") && (
                    <img
                        src={previewFile.previewUrl}
                        alt="File preview"
                        className="preview-image"
                    />
                )}

                {previewFile.mimeType === "application/pdf" && (
                    <iframe
                        src={previewFile.previewUrl}
                        title="PDF Preview"
                        className="preview-pdf"
                    />
                )}

            </div>

        </section>
    </div>
)}


                {/* Files section */}
                <section className="files-section" id="my-files">

                    <h2>{showSharedOnly ? "Shared Files" : "My Files"}</h2>

                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search your files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
<select
    className="filter-select"
    value={selectedType}
    onChange={(e) => setSelectedType(e.target.value)}
>
    <option value="all">All File Types</option>
    <option value="pdf">PDF</option>
    <option value="image">Images</option>
    <option value="video">Videos</option>
    <option value="audio">Audio</option>
    <option value="document">Documents</option>
    <option value="other">Other Files</option>
</select>
                    {filesLoading && (
                        <p>Loading your files...</p>
                    )}

                    {filesError && (
                        <p>{filesError}</p>
                    )}

                    {!filesLoading && !filesError && files.length === 0 && (
                        <p>You haven't uploaded any files yet.</p>
                    )}

                    {!filesLoading && !filesError &&
                        files.length > 0 && filteredFiles.length === 0 && (
                            <p>No matching files found.</p>
                        )
                    }

                    <div className="file-list">

                        {filteredFiles.map(file => (
                            <div className="file-card" key={file._id}>

                                <div className="file-title-row">
    <span className="file-icon">
        {getFileIcon(file)}
    </span>

    <p className="file-name">
        {file.originalName}
    </p>
</div>
                                <p className="file-meta">
                                    Size: {formatSize(file.size)}
                                </p>

                                {/* Sharing status */}
                                {file.isShared ? (
                                    <div className="sharing-status">
                                        <span>● Currently Shared</span>

                                        <p>
                                            Access: {file.shareType === "public"
                                                ? "Anyone with the link"
                                                : "Registered users only"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="sharing-status not-shared">
                                        <span>● Private</span>
                                    </div>
                                )}

                                {/* File actions */}
                                <div className="file-actions">

                                    <button onClick={() => handlePreview(file._id)}>
                                        Preview
                                    </button>

                                    <button onClick={() => handleDownload(file._id)}>
                                        Download
                                    </button>

                                    <button onClick={() => handleDelete(file._id)}>
                                        Delete
                                    </button>

                                </div>

                                {/* Sharing controls */}
                                <div className="share-section">

                                    <button onClick={() => handleShare(file._id, "public")}>
                                        Share with Anyone
                                    </button>

                                    <button onClick={() => handleShare(file._id, "registered")}>
                                        Share with Registered Users
                                    </button>

                                    {/* Dropdown toggle */}
                                    {file.isShared && (
                                        <div className="share-dropdown">

                                            <button
                                                onClick={() => {
                                                    setOpenShareDropdown(prev => ({
                                                        ...prev,
                                                        [file._id]: !prev[file._id]
                                                    }));
                                                }}
                                            >
                                                {openShareDropdown[file._id]
                                                    ? "Close Sharing Link ▲"
                                                    : "View Sharing Link ▼"}
                                            </button>

                                            {/* Dropdown content */}
<div
    className={`share-link ${
        openShareDropdown[file._id] ? "share-link-open" : ""
    }`}
>
    <p>Sharing Link:</p>

    {shareLinks[file._id] ? (
        <>
            <input
                type="text"
                value={shareLinks[file._id]}
                readOnly
            />

            <button
                onClick={async () => {
                    try {
                        await navigator.clipboard.writeText(
                            shareLinks[file._id]
                        );

                        alert("Link copied successfully!");
                    } catch (error) {
                        alert("Unable to copy link. Please try again.");
                    }
                }}
            >
                Copy Link
            </button>

            <button
                onClick={() => handleRevokeShare(file._id)}
                style={{
                    backgroundColor: "#8B3A5B",
                    marginTop: "12px"
                }}
            >
                Revoke Sharing
            </button>
        </>
    ) : (
        <p>Generate a new link to display it here.</p>
    )}
</div>

                                        </div>
                                    )}

                                    

                                </div>

                                <p className="file-meta">
                                    Uploaded: {new Date(file.createdAt).toLocaleString()}
                                </p>

                            </div>
                        ))}

                    </div>

                </section>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </main>

        </div>
    );
}

export default Dashboard;
