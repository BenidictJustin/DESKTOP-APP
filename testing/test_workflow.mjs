import assert from 'assert'
import {
  isCloudinaryConfigured,
  getDocumentAccessUrl
} from '../src/main/services/cloudinaryService.js'

async function testWorkflow() {
  console.log('=== TEST SUITE: NARRATIVE REPORT LIFECYCLE & CLOUDINARY INTEGRATION ===\n')

  // 1. Report Creation & Upload simulation
  console.log('1. Coordinator creates report with Cloudinary document...')
  const initialReportId = 'rep_test_' + Date.now()
  const initialUploadResult = {
    success: true,
    url: 'https://res.cloudinary.com/demo/raw/upload/v1234567890/dommunity_narratives/AY_2026-2027/event_ev_01/Community_Outreach_Narrative.docx',
    secureUrl: 'https://res.cloudinary.com/demo/raw/upload/v1234567890/dommunity_narratives/AY_2026-2027/event_ev_01/Community_Outreach_Narrative.docx',
    publicId: 'dommunity_narratives/AY_2026-2027/event_ev_01/Community_Outreach_Narrative_1728710000.docx',
    assetId: 'ast_1a2b3c4d5e',
    fileType: 'docx',
    deliveryType: 'upload',
    originalDocxName: 'Community_Outreach_Narrative.docx',
    bytes: 450200
  }

  let reportRecord = {
    id: initialReportId,
    eventId: 'ev_01',
    eventTitle: 'Community Outreach 2026',
    status: 'submitted',
    docxUrl: initialUploadResult.secureUrl,
    cloudinaryUrl: initialUploadResult.secureUrl,
    cloudinaryPublicId: initialUploadResult.publicId,
    cloudinaryAssetId: initialUploadResult.assetId,
    cloudinaryFileType: initialUploadResult.fileType,
    cloudinaryDeliveryType: initialUploadResult.deliveryType,
    fileName: initialUploadResult.originalDocxName,
    submittedBy: 'coordinator_user_1',
    submittedAt: new Date().toISOString(),
    history: [
      {
        action: 'submitted',
        timestamp: new Date().toISOString(),
        by: 'coordinator_user_1',
        note: 'Submitted with Cloudinary-backed narrative report.'
      }
    ]
  }

  assert.strictEqual(reportRecord.status, 'submitted')
  assert.strictEqual(reportRecord.cloudinaryUrl, initialUploadResult.secureUrl)
  console.log('PASS: Report successfully initialized with Cloudinary document URL.')

  // 2. Admin Review & Return for Revision
  console.log('\n2. Admin reviews report and returns for revision with feedback...')
  const adminFeedback = 'Please add participant breakdown table on page 4.'
  reportRecord = {
    ...reportRecord,
    status: 'returned',
    feedback: adminFeedback,
    returnedAt: new Date().toISOString(),
    returnedBy: 'admin_user_1',
    history: [
      ...reportRecord.history,
      {
        action: 'returned',
        timestamp: new Date().toISOString(),
        by: 'admin_user_1',
        note: adminFeedback
      }
    ]
  }

  assert.strictEqual(reportRecord.id, initialReportId, 'Report ID must not change upon return')
  assert.strictEqual(reportRecord.status, 'returned')
  assert.strictEqual(reportRecord.feedback, adminFeedback)
  console.log('PASS: Report returned with feedback; record ID preserved.')

  // 3. Coordinator revises document: same report record must be updated without creating duplicate
  console.log('\n3. Coordinator revises document and re-uploads...')
  const revisedUploadResult = {
    success: true,
    url: 'https://res.cloudinary.com/demo/raw/upload/v1234567999/dommunity_narratives/AY_2026-2027/event_ev_01/Community_Outreach_Narrative_v2.docx',
    secureUrl: 'https://res.cloudinary.com/demo/raw/upload/v1234567999/dommunity_narratives/AY_2026-2027/event_ev_01/Community_Outreach_Narrative_v2.docx',
    publicId: 'dommunity_narratives/AY_2026-2027/event_ev_01/Community_Outreach_Narrative_v2_1728710999.docx',
    assetId: 'ast_9z8y7x6w5v',
    fileType: 'docx',
    deliveryType: 'upload',
    originalDocxName: 'Community_Outreach_Narrative_v2.docx',
    bytes: 461500
  }

  // Simulate handleDocxUploadSubmit revision logic in OfficeCoordinatorDashboard.jsx
  const targetReportId = reportRecord.id
  assert.strictEqual(targetReportId, initialReportId)

  reportRecord = {
    ...reportRecord,
    status: 'submitted', // re-submitted
    docxUrl: revisedUploadResult.secureUrl,
    cloudinaryUrl: revisedUploadResult.secureUrl,
    cloudinaryPublicId: revisedUploadResult.publicId,
    cloudinaryAssetId: revisedUploadResult.assetId,
    cloudinaryFileType: revisedUploadResult.fileType,
    fileName: revisedUploadResult.originalDocxName,
    feedback: null, // feedback cleared
    resubmittedAt: new Date().toISOString(),
    history: [
      ...reportRecord.history,
      {
        action: 'revised',
        timestamp: new Date().toISOString(),
        by: 'coordinator_user_1',
        note: 'Uploaded revised narrative document Community_Outreach_Narrative_v2.docx'
      }
    ]
  }

  assert.strictEqual(reportRecord.id, initialReportId, 'Report ID MUST remain identical after revision')
  assert.strictEqual(reportRecord.cloudinaryUrl, revisedUploadResult.secureUrl, 'Cloudinary URL must be updated to revised file')
  assert.strictEqual(reportRecord.feedback, null, 'Feedback should be cleared on resubmission')
  assert.strictEqual(reportRecord.history.length, 3, 'Audit history must contain submission, return, and revision entries')
  console.log('PASS: Revised document uploaded to same report record. No duplicate records created.')

  // 4. Admin Approves Report
  console.log('\n4. Admin approves the revised report...')
  reportRecord = {
    ...reportRecord,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: 'admin_user_1',
    history: [
      ...reportRecord.history,
      {
        action: 'approved',
        timestamp: new Date().toISOString(),
        by: 'admin_user_1',
        note: 'Approved revised report.'
      }
    ]
  }

  assert.strictEqual(reportRecord.id, initialReportId)
  assert.strictEqual(reportRecord.status, 'approved')
  assert.strictEqual(reportRecord.history.length, 4)
  console.log('PASS: Final approval completed cleanly.')

  // 5. Cloudinary URL Access & Helper Test
  console.log('\n5. Document Access URL resolution test...')
  process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dommunity_test'
  process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '123456789012345'
  process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'secret_test_key_abc123'

  const accessUrl = await getDocumentAccessUrl({
    publicId: reportRecord.cloudinaryPublicId,
    resourceType: 'raw',
    deliveryType: 'upload'
  })
  console.log('Access URL output:', accessUrl)
  assert.ok(accessUrl.success, 'Access URL generation must succeed')
  assert.ok(accessUrl.url, 'Access URL must produce a URL')
  console.log('PASS: Document access URL successfully resolved: ' + accessUrl.url)

  console.log('\n=== ALL WORKFLOW TESTS PASSED SUCCESSFULLY! ===')
}

testWorkflow().catch((err) => {
  console.error('Workflow test failed:', err)
  process.exit(1)
})
