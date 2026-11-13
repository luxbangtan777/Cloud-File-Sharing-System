
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true
    },

    storagePath: {
        type: String,
        required: true
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    mimeType: {
        type: String,
        required: true
    },

    size: {
    type: Number,
    required: true
},

isShared: {
    type: Boolean,
    default: false
},

shareToken: {
    type: String,
    default: null
},

shareType: {
    type: String,
    enum: ["public", "registered"],
    default: null
}
}, { timestamps: true });

const File = mongoose.model("File", fileSchema);

module.exports = File;
