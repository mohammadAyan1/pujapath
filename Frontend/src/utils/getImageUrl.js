export const getImageUrl = (imgPath, BASE_URL_IMAGE) => {
    console.log(imgPath);

    if (!imgPath) return "/no-image.png";
    if (imgPath.startsWith("http")) return imgPath;
    return `${BASE_URL_IMAGE}/${imgPath}`;
};
