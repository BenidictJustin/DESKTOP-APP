/**
 * Cloudinary Frontend Service
 *
 * Secure interface between the Electron renderer and main-process Cloudinary backend.
 * Never handles or exposes Cloudinary API Secret in renderer or browser code.
 */

export function isCloudinaryAvailable() {
  return Boolean(
    (typeof window !== 'undefined' && window.api?.cloudinary?.uploadDocument) ||
    (typeof window !== 'undefined' && window.electron?.ipcRenderer)
  )
}

/**
 * Tests if Cloudinary is configured and reachable on the backend.
 */
export async function testCloudinaryConnection() {
  if (window.api?.cloudinary?.testConnection) {
    return await window.api.cloudinary.testConnection()
  }
  if (window.electron?.ipcRenderer) {
    return await window.electron.ipcRenderer.invoke('cloudinary:test-connection')
  }
  return { configured: false, connected: false, message: 'Cloudinary API not available in current window' }
}

/**
 * Converts File or Blob to ArrayBuffer
 */
async function fileToArrayBuffer(fileOrBlob) {
  if (fileOrBlob instanceof ArrayBuffer) return fileOrBlob
  if (ArrayBuffer.isView(fileOrBlob)) return fileOrBlob.buffer
  if (typeof fileOrBlob.arrayBuffer === 'function') {
    return await fileOrBlob.arrayBuffer()
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = (e) => reject(e)
    reader.readAsArrayBuffer(fileOrBlob)
  })
}

/**
 * Uploads a Narrative Report document (.docx, .doc, .pdf) or photo to Cloudinary
 * through the secure Electron main process.
 *
 * @param {File|Blob|ArrayBuffer} file - File or buffer to upload
 * @param {Object} options - Upload metadata:
 *   - fileName: string
 *   - academicYear: string
 *   - eventId: string
 *   - accessMode: 'authenticated' | 'upload'
 *   - userRole: string ('office_coordinator' | 'admin')
 *   - isImage: boolean
 * @returns {Promise<Object>} Upload response with secureUrl, publicId, and metadata
 */
export async function uploadDocumentToCloudinary(file, options = {}) {
  const {
    fileName = file?.name || 'document.docx',
    academicYear = '2026-2027',
    eventId = 'general',
    accessMode,
    userRole = 'office_coordinator',
    isImage = false
  } = options

  try {
    const arrayBuffer = await fileToArrayBuffer(file)

    const payload = {
      buffer: arrayBuffer,
      fileName,
      academicYear,
      eventId,
      accessMode,
      userRole,
      isImage
    }

    let result = null
    if (window.api?.cloudinary?.uploadDocument) {
      result = await window.api.cloudinary.uploadDocument(payload)
    } else if (window.electron?.ipcRenderer) {
      result = await window.electron.ipcRenderer.invoke('cloudinary:upload-document', payload)
    } else {
      throw new Error('Cloudinary backend API is not accessible in this environment.')
    }

    if (!result?.success) {
      throw new Error(result?.error || 'Cloudinary upload failed')
    }

    return result
  } catch (err) {
    console.error('[cloudinary.js] Upload error:', err)
    throw err
  }
}

/**
 * Retrieves a signed or secure download/viewing URL for a stored document.
 */
export async function getDocumentAccessUrl({
  publicId,
  format,
  resourceType = 'raw',
  deliveryType = 'upload'
}) {
  try {
    if (window.api?.cloudinary?.getDocumentUrl) {
      return await window.api.cloudinary.getDocumentUrl({ publicId, format, resourceType, deliveryType })
    }
    if (window.electron?.ipcRenderer) {
      return await window.electron.ipcRenderer.invoke('cloudinary:get-document-url', {
        publicId,
        format,
        resourceType,
        deliveryType
      })
    }
    return { success: false, error: 'Cloudinary API unavailable' }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Downloads the document ArrayBuffer from Cloudinary via the main process.
 * Eliminates CORS and authentication issues when viewing or exporting documents.
 */
export async function downloadCloudinaryDocumentBuffer({
  url,
  publicId,
  format,
  resourceType = 'raw',
  deliveryType = 'upload',
  userRole = 'office_coordinator'
}) {
  try {
    const payload = { url, publicId, format, resourceType, deliveryType, userRole }
    let res = null
    if (window.api?.cloudinary?.downloadDocument) {
      res = await window.api.cloudinary.downloadDocument(payload)
    } else if (window.electron?.ipcRenderer) {
      res = await window.electron.ipcRenderer.invoke('cloudinary:download-document', payload)
    }

    if (res?.success && res.buffer) {
      // In Electron IPC, Buffer arrives as Uint8Array or ArrayBuffer
      const buf = res.buffer.buffer ? res.buffer.buffer : res.buffer
      return buf
    }
    return null
  } catch (err) {
    console.warn('[cloudinary.js] Download buffer via IPC failed:', err)
    return null
  }
}

/**
 * Deletes a document or image from Cloudinary when the report is deleted or cleared.
 */
export async function deleteDocumentFromCloudinary({
  publicId,
  resourceType = 'raw',
  deliveryType = 'upload',
  userRole = 'admin'
}) {
  try {
    const payload = { publicId, resourceType, deliveryType, userRole }
    if (window.api?.cloudinary?.deleteDocument) {
      return await window.api.cloudinary.deleteDocument(payload)
    }
    if (window.electron?.ipcRenderer) {
      return await window.electron.ipcRenderer.invoke('cloudinary:delete-document', payload)
    }
    return { success: false, error: 'Cloudinary API unavailable' }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}
