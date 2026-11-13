
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const path = require("path");

const File = require("../models/File");
const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../config/supabase");

const router = express.Router();
router.get("/", authMiddleware, async (req, res) => {
    try {
        const files = await File.find({
            owner: req.user.userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Files fetched successfully!",
            files
        });

    } catch (error) {
        console.error("Fetch files error:", error.message);

        res.status(500).json({
            message: "Unable to fetch files"
        });
    }
});
router.get("/preview/:id", authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf"
        ];

        if (!allowedTypes.includes(file.mimeType)) {
            return res.status(400).json({
                message: "Preview is not supported for this file type"
            });
        }

        const { data, error } = await supabase.storage
            .from("user-files")
            .createSignedUrl(file.storagePath, 300);

        if (error) {
            console.error("Preview link error:", error.message);

            return res.status(500).json({
                message: "Unable to generate preview link"
            });
        }

        res.status(200).json({
            previewUrl: data.signedUrl,
            mimeType: file.mimeType
        });

    } catch (error) {
        console.error("Preview error:", error.message);

        res.status(500).json({
            message: "File preview failed"
        });
    }
});
router.get("/download/:id", authMiddleware, async (req, res) => {
    try {
        // Find the file and make sure it belongs to the logged-in user
        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        // Generate a temporary download link (valid for 60 seconds)
        const { data, error } = await supabase.storage
            .from("user-files")
            .createSignedUrl(file.storagePath, 60, {
                download: file.originalName
            });

        if (error) {
            console.error("Download link error:", error.message);

            return res.status(500).json({
                message: "Unable to generate download link"
            });
        }

        res.status(200).json({
            downloadUrl: data.signedUrl
        });

    } catch (error) {
        console.error("Download error:", error.message);

        res.status(500).json({
            message: "File download failed"
        });
    }
});
router.post("/share/:id", authMiddleware, async (req, res) => {
    try {
        const { shareType } = req.body;

        if (!["public", "registered"].includes(shareType)) {
            return res.status(400).json({
                message: "Invalid sharing option"
            });
        }

        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        // Generate a secure random sharing token
        const shareToken = crypto.randomBytes(32).toString("hex");

        file.isShared = true;
        file.shareToken = shareToken;
        file.shareType = shareType;

        await file.save();

        res.status(200).json({
            message: "File shared successfully!",
            shareToken,
            shareType,
            shareUrl: `http://localhost:5173/shared/${shareToken}`
        });

    } catch (error) {
        console.error("Share error:", error.message);

        res.status(500).json({
            message: "Unable to share file"
        });
    }
});
router.delete("/share/:id", authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        file.isShared = false;
        file.shareToken = null;
        file.shareType = null;

        await file.save();

        res.status(200).json({
            message: "Sharing access revoked successfully!"
        });

    } catch (error) {
        console.error("Revoke sharing error:", error.message);

        res.status(500).json({
            message: "Unable to revoke sharing access"
        });
    }
});
router.get("/shared/:token", async (req, res) => {
    try {
        const file = await File.findOne({
            shareToken: req.params.token,
            isShared: true
        });

        if (!file) {
            return res.status(404).json({
                message: "Shared file not found"
            });
        }

        // Registered users must provide a valid login token
        if (file.shareType === "registered") {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    message: "Please log in to access this file"
                });
            }

            const token = authHeader.split(" ")[1];

            try {
                jwt.verify(token, process.env.JWT_SECRET);
            } catch (error) {
                return res.status(401).json({
                    message: "Please log in with a valid account"
                });
            }
        }

        // Generate a temporary viewing link
        const { data, error } = await supabase.storage
            .from("user-files")
            .createSignedUrl(file.storagePath, 300);

        if (error) {
            console.error("Shared file link error:", error.message);

            return res.status(500).json({
                message: "Unable to access shared file"
            });
        }

        res.status(200).json({
            message: "Shared file accessed successfully!",
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            previewUrl: data.signedUrl
        });

    } catch (error) {
        console.error("Shared file error:", error.message);

        res.status(500).json({
            message: "Unable to access shared file"
        });
    }
});
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        // Find the file and verify ownership
        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        // Delete the actual file from Supabase
        const { error } = await supabase.storage
            .from("user-files")
            .remove([file.storagePath]);

        if (error) {
            console.error("Supabase delete error:", error.message);

            return res.status(500).json({
                message: "Unable to delete file from cloud storage"
            });
        }

        // Delete its metadata from MongoDB
        await File.deleteOne({
            _id: file._id
        });

        res.status(200).json({
            message: "File deleted successfully!"
        });

    } catch (error) {
        console.error("Delete error:", error.message);

        res.status(500).json({
            message: "File deletion failed"
        });
    }
});
router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "Please select a file"
                });
            }

            const safeName = path.basename(req.file.originalname);
            const extension = path.extname(safeName).toLowerCase();

const safeExtension = /^\.[a-z0-9]{1,10}$/.test(extension)
    ? extension
    : "";

const storageName = `${crypto.randomUUID()}${safeExtension}`;
const storagePath = `${req.user.userId}/${storageName}`;

            const { error } = await supabase.storage
                .from("user-files")
                .upload(storagePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });
            if (error) {
    console.error("Supabase upload error:", error.message);

    return res.status(500).json({
        message: "File upload to cloud failed"
    });
}


            try {
                const newFile = await File.create({
                    originalName: safeName,
                    storagePath,
                    owner: req.user.userId,
                    mimeType: req.file.mimetype,
                    size: req.file.size
                });

                res.status(201).json({
                    message: "File uploaded successfully!",
                    file: newFile
                });

            } catch (dbError) {
                await supabase.storage
                    .from("user-files")
                    .remove([storagePath]);

                throw dbError;
            }

        } catch (error) {
            console.error("Upload error:", error.message);

            res.status(500).json({
                message: "File upload failed"
            });
        }
    }
);

module.exports = router;
