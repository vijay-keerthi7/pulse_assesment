exports.canEditVideo = (req, video) => {
  return req.user.role === "admin" || video.uploadedBy.toString() === req.user.id;
};
