import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'
import dotenv from 'dotenv'
import { join } from 'path'
import fs from 'fs'

// Load .env variables in main process
dotenv.config()

// If running in packaged app or alternate directory, also check userData or app directory
try {
  const envPath = join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
} catch {}

const ALLOWED_DOCUMENT_EXTENSIONS = ['.docx', '.doc', '.pdf']
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']
const MAX_DOCUMENT_SIZE = 35 * 1024 * 1024 // 35MB
const MAX_IMAGE_SIZE = 15 * 1024 * 1024 // 15MB

const AUTHORIZED_ROLES = ['admin', 'office_coordinator']

/**
 * Checks if Cloudinary credentials are fully configured.
 */
export function isCloudinaryConfigured() {
  const url = process.env.CLOUDINARY_URL
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (url && url.startsWith('cloudinary://')) return true
  if (cloudName && apiKey && apiSecret) return true
  return false
}

/**
 * Configures Cloudinary SDK from environment variables.
 */
function configureCloudinary() {
  const url = process.env.CLOUDINARY_URL
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (url && url.startsWith('cloudinary://')) {
    cloudinary.config({
      cloudinary_url: url,
      secure: true
    })
  } else if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    })
  }
  return cloudinary
}

/**
 * Validates file security: type, extension, size, and authorization.
 */
function validateUploadSecurity({ fileName, bytesLength, isImage = false, userRole }) {
  if (userRole && !AUTHORIZED_ROLES.includes(userRole)) {
    throw new Error(`Unauthorized: User role "${userRole}" is not permitted to upload report documents.`)
  }

  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Invalid file name specified for upload.')
  }

  const lowerName = fileName.toLowerCase()
  const isDoc = ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  const isImg = ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))

  if (isImage) {
    if (!isImg) {
      throw new Error(`Invalid image format. Allowed formats: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`)
    }
    if (bytesLength > MAX_IMAGE_SIZE) {
      throw new Error(`Image size exceeds maximum limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`)
    }
  } else {
    if (!isDoc && !isImg) {
      throw new Error(`Invalid document format. Allowed formats: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}`)
    }
    if (bytesLength > MAX_DOCUMENT_SIZE) {
      throw new Error(`Document size exceeds maximum limit of ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB.`)
    }
  }
}

/**
 * Uploads a document (DOCX or PDF) or photo to Cloudinary.
 * Keeps API secrets strictly server-side in the Electron main process.
 */
export async function uploadReportFileToCloudinary({
  buffer,
  fileName,
  academicYear = '2026-2027',
  eventId = 'general',
  accessMode,
  userRole = 'office_coordinator',
  isImage = false
}) {
  try {
    const rawBuffer = buffer ? (Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)) : Buffer.alloc(0)
    validateUploadSecurity({ fileName, bytesLength: rawBuffer.length, isImage, userRole })

    if (!isCloudinaryConfigured()) {
      return {
        success: false,
        error:
          'Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the .env file.'
      }
    }

    const c = configureCloudinary()

    const lowerName = fileName.toLowerCase()
    const isPdf = lowerName.endsWith('.pdf')
    const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc')

    // DOCX and PDF narrative documents are stored as 'raw' to preserve exact byte-for-byte binary structure
    const resourceType = isImage ? 'image' : 'raw'

    // Delivery type: defaults to 'authenticated' for confidential report documents if configured,
    // or 'upload' for standard public delivery.
    const deliveryType =
      accessMode ||
      process.env.CLOUDINARY_ACCESS_MODE ||
      'upload'

    const folderPrefix = process.env.CLOUDINARY_FOLDER || 'dommunity_narratives'
    const safeAy = String(academicYear).replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeEv = String(eventId || 'general').replace(/[^a-zA-Z0-9_-]/g, '_')
    const targetFolder = `${folderPrefix}/AY_${safeAy}/event_${safeEv}`

    const cleanBaseName = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : (isPdf ? '.pdf' : '.docx')
    const publicId = `${cleanBaseName}_${Date.now()}${ext}`

    return await new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: targetFolder,
        public_id: publicId,
        resource_type: resourceType,
        type: deliveryType,
        overwrite: true
      }

      const stream = c.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error('[CloudinaryService] Upload error:', error)
          return resolve({ success: false, error: error.message || String(error) })
        }

        resolve({
          success: true,
          url: result.secure_url || result.url,
          secureUrl: result.secure_url || result.url,
          publicId: result.public_id,
          assetId: result.asset_id,
          version: result.version,
          format: result.format || ext.replace('.', ''),
          resourceType: result.resource_type,
          deliveryType: result.type,
          bytes: result.bytes,
          createdAt: result.created_at,
          originalDocxName: fileName,
          fileType: isPdf ? 'pdf' : (isDocx ? 'docx' : (isImage ? 'image' : 'raw'))
        })
      })

      const readStream = new Readable()
      readStream.push(rawBuffer)
      readStream.push(null)
      readStream.pipe(stream)
    })
  } catch (err) {
    console.error('[CloudinaryService] Upload exception:', err)
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Generates an authenticated / signed URL or standard delivery URL for a stored document.
 */
export async function getDocumentAccessUrl({
  publicId,
  format,
  resourceType = 'raw',
  deliveryType = 'upload'
}) {
  if (!isCloudinaryConfigured()) {
    return { success: false, error: 'Cloudinary credentials missing.' }
  }

  try {
    const c = configureCloudinary()

    if (deliveryType === 'authenticated') {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600 // Valid for 1 hour
      const signedUrl = c.utils.private_download_url(publicId, format || '', {
        resource_type: resourceType,
        expires_at: expiresAt
      })
      return { success: true, url: signedUrl, expiresAt }
    }

    const url = c.url(publicId, {
      resource_type: resourceType,
      secure: true
    })
    return { success: true, url }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Downloads a document from Cloudinary as a Node Buffer/Uint8Array.
 * Allows Electron renderer to access both public and authenticated documents
 * without CORS or cross-origin restrictions.
 */
export async function downloadCloudinaryDocumentBuffer({
  url,
  publicId,
  format,
  resourceType = 'raw',
  deliveryType = 'upload',
  userRole = 'office_coordinator'
}) {
  if (userRole && !AUTHORIZED_ROLES.includes(userRole)) {
    return { success: false, error: `Unauthorized: User role "${userRole}" cannot access report documents.` }
  }

  try {
    let targetUrl = url
    if (!targetUrl && publicId) {
      const accessRes = await getDocumentAccessUrl({ publicId, format, resourceType, deliveryType })
      if (!accessRes.success) return accessRes
      targetUrl = accessRes.url
    }

    if (!targetUrl) {
      return { success: false, error: 'No URL or publicId provided for document download.' }
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'DommUnity-App/1.0'
      }
    })

    if (!res.ok) {
      return { success: false, error: `Failed to download from Cloudinary: HTTP ${res.status} ${res.statusText}` }
    }

    const arrayBuf = await res.arrayBuffer()
    return { success: true, buffer: Buffer.from(arrayBuf) }
  } catch (err) {
    console.error('[CloudinaryService] Download buffer error:', err)
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Permanently deletes a report file from Cloudinary when the report is deleted or cleared.
 */
export async function deleteCloudinaryFile({
  publicId,
  resourceType = 'raw',
  deliveryType = 'upload',
  userRole = 'admin'
}) {
  if (userRole && !AUTHORIZED_ROLES.includes(userRole)) {
    return { success: false, error: `Unauthorized: User role "${userRole}" cannot delete report documents.` }
  }

  if (!isCloudinaryConfigured()) {
    return { success: false, error: 'Cloudinary not configured.' }
  }

  if (!publicId) {
    return { success: false, error: 'publicId is required for deletion.' }
  }

  try {
    const c = configureCloudinary()
    const result = await c.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: deliveryType,
      invalidate: true
    })
    return { success: true, result }
  } catch (err) {
    console.error('[CloudinaryService] Deletion error:', err)
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Tests Cloudinary connection / credentials.
 */
export async function testCloudinaryConnection() {
  if (!isCloudinaryConfigured()) {
    return {
      configured: false,
      connected: false,
      message: 'Cloudinary environment variables missing in .env'
    }
  }

  try {
    const c = configureCloudinary()
    const pingRes = await c.api.ping()
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '(from URL)'
    return {
      configured: true,
      connected: pingRes.status === 'ok',
      cloudName,
      message: 'Cloudinary connected successfully'
    }
  } catch (err) {
    return {
      configured: true,
      connected: false,
      error: err.message || String(err),
      message: `Failed to connect to Cloudinary: ${err.message || err}`
    }
  }
}
