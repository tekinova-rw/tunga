// import { v2 as cloudinary } from 'cloudinary';
// import dotenv from 'dotenv';
// import { Request, Response, NextFunction } from 'express';

// dotenv.config();

// // Cloudinary Configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
//   api_key: process.env.CLOUDINARY_API_KEY || '',
//   api_secret: process.env.CLOUDINARY_API_SECRET || '',
//   secure: true,
// });

// export interface UploadOptions {
//   folder?: string;
//   public_id?: string;
//   transformation?: any[];
//   width?: number;
//   height?: number;
//   crop?: string;
//   quality?: string | number;
//   format?: string;
//   tags?: string[];
//   context?: Record<string, string>;
//   overwrite?: boolean;
//   resource_type?: 'image' | 'video' | 'raw' | 'auto';
// }

// export interface UploadResult {
//   success: boolean;
//   secure_url?: string;
//   public_id?: string;
//   width?: number;
//   height?: number;
//   format?: string;
//   bytes?: number;
//   created_at?: string;
//   error?: string;
//   [key: string]: any;
// }

// const DEFAULT_OPTIONS: Partial<UploadOptions> = {
//   folder: 'vetconnect',
//   resource_type: 'image',
//   quality: 'auto',
//   overwrite: true,
// };

// export const uploadFile = async (
//   file: string | Buffer,
//   options: UploadOptions = {}
// ): Promise<UploadResult> => {
//   try {
//     const uploadOptions = { ...DEFAULT_OPTIONS, ...options };
//     let fileToUpload = file;
    
//     if (typeof file === 'string' && !file.startsWith('data:image') && !file.startsWith('http')) {
//       fileToUpload = `data:image/jpeg;base64,${file}`;
//     }

//     const result = await cloudinary.uploader.upload(fileToUpload as string, uploadOptions);
    
//     return {
//       success: true,
//       secure_url: result.secure_url,
//       public_id: result.public_id,
//       width: result.width,
//       height: result.height,
//       format: result.format,
//       bytes: result.bytes,
//       created_at: result.created_at,
//       ...result,
//     };
//   } catch (error) {
//     console.error('Cloudinary upload error:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Upload failed',
//     };
//   }
// };

// export const uploadProfileImage = async (file: string | Buffer, userId: string | number): Promise<UploadResult> => {
//   return uploadFile(file, {
//     folder: 'vetconnect/profiles',
//     public_id: `user_${userId}_${Date.now()}`,
//     transformation: [
//       { width: 400, height: 400, crop: 'fill', gravity: 'face' },
//       { quality: 'auto' },
//     ],
//   });
// };

// export const uploadAnimalImage = async (file: string | Buffer, animalId: string | number): Promise<UploadResult> => {
//   return uploadFile(file, {
//     folder: 'vetconnect/animals',
//     public_id: `animal_${animalId}_${Date.now()}`,
//     transformation: [
//       { width: 800, height: 600, crop: 'limit' },
//       { quality: 'auto' },
//     ],
//   });
// };

// export const uploadProductImage = async (file: string | Buffer, productId: string | number): Promise<UploadResult> => {
//   return uploadFile(file, {
//     folder: 'vetconnect/products',
//     public_id: `product_${productId}_${Date.now()}`,
//     transformation: [
//       { width: 500, height: 500, crop: 'limit' },
//       { quality: 'auto' },
//     ],
//   });
// };

// export const uploadServiceImage = async (file: string | Buffer, requestId: string | number): Promise<UploadResult> => {
//   return uploadFile(file, {
//     folder: 'vetconnect/service_requests',
//     public_id: `request_${requestId}_${Date.now()}`,
//     transformation: [
//       { width: 800, height: 600, crop: 'limit' },
//       { quality: 'auto' },
//     ],
//   });
// };

// export const uploadMessageImage = async (file: string | Buffer, messageId: string | number): Promise<UploadResult> => {
//   return uploadFile(file, {
//     folder: 'vetconnect/messages',
//     public_id: `message_${messageId}_${Date.now()}`,
//     transformation: [
//       { width: 500, height: 500, crop: 'limit' },
//       { quality: 'auto' },
//     ],
//   });
// };

// export const deleteFile = async (public_id: string): Promise<{ success: boolean; error?: string; result?: string }> => {
//   try {
//     const result = await cloudinary.uploader.destroy(public_id);
//     return {
//       success: result.result === 'ok',
//       result: result.result,
//     };
//   } catch (error) {
//     console.error('Cloudinary delete error:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Delete failed',
//     };
//   }
// };

// export const deleteMultipleFiles = async (public_ids: string[]): Promise<{ success: boolean; error?: string }> => {
//   try {
//     const result = await cloudinary.api.delete_resources(public_ids);
//     return {
//       success: true,
//       ...result,
//     };
//   } catch (error) {
//     console.error('Cloudinary delete multiple error:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Delete failed',
//     };
//   }
// };

// export const getOptimizedImage = (public_id: string, width?: number, height?: number): string => {
//   return cloudinary.url(public_id, {
//     secure: true,
//     width: width || 500,
//     height: height || 500,
//     crop: 'limit',
//     quality: 'auto',
//     fetch_format: 'auto',
//   });
// };

// export const getThumbnail = (public_id: string, width: number = 200, height: number = 200): string => {
//   return cloudinary.url(public_id, {
//     secure: true,
//     width,
//     height,
//     crop: 'fill',
//     gravity: 'auto',
//     quality: 'auto',
//   });
// };

// export const handleUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const file = (req as any).file?.buffer || (req as any).body?.image;
    
//     if (!file) {
//       return next();
//     }

//     const folder = (req as any).body?.upload_folder || 'vetconnect';
//     const transformations = (req as any).body?.transformations 
//       ? JSON.parse((req as any).body.transformations) 
//       : undefined;

//     const result = await uploadFile(file, {
//       folder,
//       transformation: transformations,
//     });

//     if (result.success) {
//       (req as any).cloudinaryResult = result;
//       next();
//     } else {
//       res.status(400).json({
//         success: false,
//         message: 'Failed to upload image',
//         error: result.error,
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Upload error',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// };

// export { cloudinary };
// export default cloudinary;