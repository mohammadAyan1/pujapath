export const getMessageType = (file) => {
    if (!file) return "document";

    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";

    return "document";
};
