import env from '../config/env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

export const uploadMediaFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No media file provided',
      });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'VIDEO' : 'IMAGE';

    // Build public URL using BACKEND_URL (e.g. ngrok or configured host)
    const baseUrl = env.BACKEND_URL
      ? env.BACKEND_URL.replace(/\/$/, '')
      : `${req.protocol}://${req.get('host')}`;

    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      message: 'Media uploaded successfully',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        mediaType,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listUploadedMedia = async (req, res, next) => {
  try {
    if (!fs.existsSync(uploadDir)) {
      return res.json({ success: true, data: [] });
    }

    const files = await fs.promises.readdir(uploadDir);
    const baseUrl = env.BACKEND_URL
      ? env.BACKEND_URL.replace(/\/$/, '')
      : `${req.protocol}://${req.get('host')}`;

    const mediaList = [];
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        const isVideo = ['.mp4', '.mov'].includes(ext);
        mediaList.push({
          filename: file,
          url: `${baseUrl}/uploads/${file}`,
          mediaType: isVideo ? 'VIDEO' : 'IMAGE',
          size: stat.size,
          createdAt: stat.birthtime,
        });
      }
    }

    // Sort newest first
    mediaList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return res.json({
      success: true,
      data: mediaList,
    });
  } catch (error) {
    next(error);
  }
};
