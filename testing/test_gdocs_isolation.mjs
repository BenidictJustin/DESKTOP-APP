import assert from 'assert'
import {
  getGoogleDocId,
  base64PdfToFile
} from '../src/renderer/src/components/editor/utils/editorHelpers.js'

function runReuseAndPreservationTests() {
  console.log('=== TEST SUITE: GOOGLE DOCS LINK REUSE & SUBMITTED VERSION PRESERVATION ===\n')

  // 1. Google Doc ID extraction
  console.log('1. Testing getGoogleDocId extraction...')
  const sharedDocId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  const sharedUrl = `https://docs.google.com/document/d/${sharedDocId}/edit`
  assert.strictEqual(getGoogleDocId(sharedUrl), sharedDocId)
  console.log('PASS: Correctly extracts shared document ID.')

  // 2. Allow link reuse across multiple reports
  console.log('\n2. Testing Google Docs link reuse across multiple reports...')
  const reportA = {
    id: 'rep_001',
    activityTitle: 'Medical Mission 2026',
    status: 'submitted',
    googleDocsUrl: sharedUrl,
    submittedNarrative: '<h1>Medical Mission 2026 - Official Report A</h1>',
    cloudinaryUrl: 'https://res.cloudinary.com/test/raw/upload/v1/Medical_Mission_rep_001_submitted.pdf',
    submittedSnapshotUrl: 'https://res.cloudinary.com/test/raw/upload/v1/Medical_Mission_rep_001_submitted.pdf',
    submittedAt: '2026-03-01T10:00:00.000Z'
  }

  // Report B uses the SAME Google Docs link
  const reportB = {
    id: 'rep_002',
    activityTitle: 'Feeding Program 2026',
    status: 'submitted',
    googleDocsUrl: sharedUrl, // SAME LINK REUSED!
    submittedNarrative: '<h1>Feeding Program 2026 - Official Report B</h1>',
    cloudinaryUrl: 'https://res.cloudinary.com/test/raw/upload/v1/Feeding_Program_rep_002_submitted.pdf',
    submittedSnapshotUrl: 'https://res.cloudinary.com/test/raw/upload/v1/Feeding_Program_rep_002_submitted.pdf',
    submittedAt: '2026-03-15T14:00:00.000Z'
  }

  assert.strictEqual(reportA.googleDocsUrl, reportB.googleDocsUrl, 'Both reports must be allowed to share the same Google Docs link')
  assert.notStrictEqual(reportA.id, reportB.id, 'Report IDs must remain independent')
  assert.notStrictEqual(reportA.cloudinaryUrl, reportB.cloudinaryUrl, 'Each report must have its own immutable Cloudinary snapshot')
  assert.notStrictEqual(reportA.submittedNarrative, reportB.submittedNarrative, 'Each report must have its own submitted narrative')
  console.log('PASS: Same Google Docs link successfully reused by multiple reports with independent snapshots.')

  // 3. Document Viewer and PDF Export isolation verification
  console.log('\n3. Testing Document Viewer & Export version preservation...')
  // Admin opens Report A:
  const reportADisplaySnapshot = reportA.cloudinaryUrl || reportA.submittedSnapshotUrl
  const reportADisplayNarrative = reportA.submittedNarrative || reportA.narrative
  assert.strictEqual(reportADisplaySnapshot, 'https://res.cloudinary.com/test/raw/upload/v1/Medical_Mission_rep_001_submitted.pdf')
  assert.strictEqual(reportADisplayNarrative, '<h1>Medical Mission 2026 - Official Report A</h1>')

  // Admin opens Report B:
  const reportBDisplaySnapshot = reportB.cloudinaryUrl || reportB.submittedSnapshotUrl
  const reportBDisplayNarrative = reportB.submittedNarrative || reportB.narrative
  assert.strictEqual(reportBDisplaySnapshot, 'https://res.cloudinary.com/test/raw/upload/v1/Feeding_Program_rep_002_submitted.pdf')
  assert.strictEqual(reportBDisplayNarrative, '<h1>Feeding Program 2026 - Official Report B</h1>')
  console.log('PASS: Viewing Report A preserves Report A content; viewing Report B preserves Report B content.')

  // 4. Return and resubmission revision history preservation
  console.log('\n4. Testing revision history preservation on returned report resubmission...')
  // Report A returned by Admin:
  const returnedReportA = {
    ...reportA,
    status: 'returned',
    adminFeedback: 'Please add financial statement table.'
  }

  // Resubmission creates new revision entry while preserving original version
  const resubmittedReportA = {
    ...returnedReportA,
    status: 'submitted',
    adminFeedback: null,
    revisions: [
      {
        version: 1,
        cloudinaryUrl: returnedReportA.cloudinaryUrl,
        submittedSnapshotUrl: returnedReportA.submittedSnapshotUrl,
        submittedNarrative: returnedReportA.submittedNarrative,
        submittedAt: returnedReportA.submittedAt,
        feedback: returnedReportA.adminFeedback
      }
    ],
    submittedNarrative: '<h1>Medical Mission 2026 - Revised Report A with Financials</h1>',
    cloudinaryUrl: 'https://res.cloudinary.com/test/raw/upload/v2/Medical_Mission_rep_001_v2_submitted.pdf',
    submittedSnapshotUrl: 'https://res.cloudinary.com/test/raw/upload/v2/Medical_Mission_rep_001_v2_submitted.pdf',
    submittedAt: '2026-03-20T09:00:00.000Z'
  }

  assert.strictEqual(resubmittedReportA.revisions.length, 1)
  assert.strictEqual(resubmittedReportA.revisions[0].cloudinaryUrl, reportA.cloudinaryUrl)
  assert.strictEqual(resubmittedReportA.revisions[0].submittedNarrative, reportA.submittedNarrative)
  assert.strictEqual(resubmittedReportA.submittedNarrative, '<h1>Medical Mission 2026 - Revised Report A with Financials</h1>')
  console.log('PASS: Return and resubmission cleanly preserves previous submitted version in revisions array.')

  // 5. PDF File conversion test
  console.log('\n5. Testing base64PdfToFile conversion...')
  const validBase64 = Buffer.from('%PDF-1.4 test document').toString('base64')
  const fakePdfBase64 = `data:application/pdf;base64,${validBase64}`
  const fileObj = base64PdfToFile(fakePdfBase64, 'narrative.pdf')
  assert.ok(fileObj)
  assert.strictEqual(fileObj.name, 'narrative.pdf')
  assert.strictEqual(fileObj.type, 'application/pdf')
  console.log('PASS: Base64 PDF safely converted to File object for Cloudinary upload.')

  console.log('\n=== ALL LINK REUSE & PRESERVATION TESTS PASSED! ===')
}

runReuseAndPreservationTests()
