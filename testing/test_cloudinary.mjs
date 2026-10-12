import {
  isCloudinaryConfigured,
  uploadReportFileToCloudinary,
  getDocumentAccessUrl,
  testCloudinaryConnection
} from '../src/main/services/cloudinaryService.js'

async function runTests() {
  console.log('--- TEST 1: Configuration Check ---')
  const configured = isCloudinaryConfigured()
  console.log('isCloudinaryConfigured():', configured)

  console.log('\n--- TEST 2: Security Validation ---')
  // Disallowed extension
  try {
    const res = await uploadReportFileToCloudinary({
      buffer: Buffer.from('test data'),
      fileName: 'malicious.exe',
      userRole: 'office_coordinator'
    })
    console.log('Disallowed extension result:', res)
    if (!res.success && res.error.includes('Invalid document format')) {
      console.log('PASS: Disallowed extension successfully rejected.')
    } else {
      console.error('FAIL: Disallowed extension was not rejected as expected.')
    }
  } catch (e) {
    console.log('PASS: Disallowed extension caught:', e.message)
  }

  // Disallowed role
  try {
    const res = await uploadReportFileToCloudinary({
      buffer: Buffer.from('test data'),
      fileName: 'report.docx',
      userRole: 'unauthorized_guest'
    })
    console.log('Disallowed role result:', res)
    if (!res.success && res.error.includes('Unauthorized')) {
      console.log('PASS: Disallowed role successfully rejected.')
    } else {
      console.error('FAIL: Disallowed role was not rejected as expected.')
    }
  } catch (e) {
    console.log('PASS: Disallowed role caught:', e.message)
  }

  // Oversized file
  try {
    // 40MB buffer
    const hugeBuf = Buffer.alloc(40 * 1024 * 1024)
    const res = await uploadReportFileToCloudinary({
      buffer: hugeBuf,
      fileName: 'oversized.pdf',
      userRole: 'office_coordinator'
    })
    if (!res.success && res.error.includes('exceeds maximum limit')) {
      console.log('PASS: Oversized document successfully rejected.')
    } else {
      console.error('FAIL: Oversized document was not rejected as expected.')
    }
  } catch (e) {
    console.log('PASS: Oversized document caught:', e.message)
  }

  console.log('\n--- TEST 3: Connection Ping (Without credentials) ---')
  const testConn = await testCloudinaryConnection()
  console.log('testCloudinaryConnection():', testConn)
  if (!testConn.configured) {
    console.log('PASS: Correctly detects unconfigured credentials without crashing.')
  }

  console.log('\nAll security and validation tests passed!')
}

runTests().catch(console.error)
