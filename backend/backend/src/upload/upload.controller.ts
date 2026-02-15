
import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Get,
    Param,
    Res,
    NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { existsSync, mkdirSync } from 'fs';

// Controller for file uploads
@Controller('uploads')
export class UploadController {

    // handles file upload using multer
    @Post('image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = './uploads';
                    if (!existsSync(uploadPath)) {
                        mkdirSync(uploadPath);
                    }
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) { // only allow image files
                    return cb(new Error('Only image files are allowed!'), false);
                }
                cb(null, true);
            },
        }),
    )
    uploadFile(@UploadedFile() file: any) {
        if (!file) {
            throw new Error('File upload failed');
        }
        // Return relative path that frontend can use to fetch the image
        // Assuming backend serves 'uploads' via a controller or static serve
        // For now, we return 'uploads/filename'
        // Frontend expects "assets/uploads/..." based on user request, but backend serves directly.
        // User code has: this.uploaded.emit(res.path); // "assets/uploads/..."
        // Wait, the user's frontend code says: this.uploaded.emit(res.path); // "assets/uploads/..."
        // But backend is serving it. The backend URL is environment.apiUrl.
        // So the path should be relative to the domain? Or full URL?
        // Let's modify the frontend to prepend backend URL if needed, OR serve it under 'api/uploads/image/FILENAME'

        // The user's code snippet:
        // this.http.post<{ path: string }>(`${environment.apiUrl}/api/uploads/image`, form)
        // .subscribe(next: (res) => this.uploaded.emit(res.path))

        // So the response should contain { path: '...' }
        // If I return 'uploads/my-image.jpg', the frontend will use it as src.
        // If src="uploads/my-image.jpg" on frontend running on localhost:4200, it looks for localhost:4200/uploads/...
        // BUT the image is on backend localhost:3000.
        // So distinct path or proxy is needed.
        // The user's prompt implies "assets/uploads" which is a frontend folder. 
        // BUT they asked for backend code too. 
        // "bitte schreibe mir auch das backend dazu"
        // If I upload to backend, I should serve it from backend.
        // So the path returned should probably be a full URL OR the frontend should know to prepend API URL.

        // Let's stick to returning the filename or relative path and let frontend handle display.
        // I previously saw `imageUrl` in `restaurant` object.
        // If I return `/api/uploads/serve/${file.filename}`, then `<img src="/api/uploads/serve/...">` works if proxy or full URL.

        return { path: `/api/uploads/serve/${file.filename}` };
    }

    @Get('serve/:filename')
    serveFile(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = join(process.cwd(), 'uploads', filename);
        if (!existsSync(filePath)) {
            throw new NotFoundException('File not found');
        }
        res.sendFile(filePath);
    }
}
