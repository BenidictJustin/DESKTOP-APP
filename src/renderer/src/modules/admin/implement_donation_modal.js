const fs = require('fs')

const filePath =
  'c:\\Users\\JOHN HAROLD SANTOS\\OneDrive\\Desktop\\CAPSTONE 2 - DOMMUNITY CODE\\DOMMUNITY-main\\src\\renderer\\src\\modules\\admin\\AdminDashboard.jsx'
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')

// 1. Declare isDonationModalOpen state
if (!content.includes('const [isDonationModalOpen, setIsDonationModalOpen] = useState(false)')) {
  content = content.replace(
    'const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false)',
    'const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false)\n  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false)'
  )
  console.log('Declared isDonationModalOpen state variable')
}

// 2. Add setIsDonationModalOpen(false) on success inside handleCreateDonation
if (
  content.includes(
    "triggerSuccess('Donation batch registered and items added to inventory stock.')"
  )
) {
  content = content.replace(
    "triggerSuccess('Donation batch registered and items added to inventory stock.')",
    "triggerSuccess('Donation batch registered and items added to inventory stock.')\n      setIsDonationModalOpen(false)"
  )
  console.log('Added setIsDonationModalOpen(false) to handleCreateDonation success handler')
}

// 3. Define component-wide isAnyModalOpen
const modalStatesDef = `  const isAnyModalOpen =
    Boolean(isAddUserModalOpen) ||
    Boolean(isAddModalOpen) ||
    Boolean(isReleaseModalOpen) ||
    Boolean(isReviewModalOpen) ||
    Boolean(isEventModalOpen) ||
    Boolean(isAddOrgModalOpen) ||
    Boolean(isAddDeptModalOpen) ||
    Boolean(isDonationModalOpen) ||
    Boolean(editingOrg) ||
    Boolean(editingEvent) ||
    Boolean(itemEditing) ||
    Boolean(editingUser) ||
    Boolean(confirmDialog) ||
    Boolean(actionError) ||
    Boolean(validationError) ||
    Boolean(actionSuccess) ||
    Boolean(selectedReport) ||
    Boolean(completedActivitiesModal?.isOpen)`

if (!content.includes('const isAnyModalOpen =')) {
  content = content.replace(
    'const [editingEvent, setEditingEvent] = useState(null)',
    'const [editingEvent, setEditingEvent] = useState(null)\n\n' + modalStatesDef
  )
  console.log('Declared component-wide isAnyModalOpen')
}

// 4. Remove local isAnyModalOpen in useEffect
content = content.replace(
  `  // Body scroll lock effect whenever any modal/popup is open
  useEffect(() => {
    const isAnyModalOpen =
      Boolean(isAddUserModalOpen) ||
      Boolean(isAddModalOpen) ||
      Boolean(isReleaseModalOpen) ||
      Boolean(isReviewModalOpen) ||
      Boolean(isEventModalOpen) ||
      Boolean(isAddOrgModalOpen) ||
      Boolean(isAddDeptModalOpen) ||
      Boolean(editingOrg) ||
      Boolean(editingEvent) ||
      Boolean(itemEditing) ||
      Boolean(editingUser) ||
      Boolean(confirmDialog) ||
      Boolean(actionError) ||
      Boolean(validationError) ||
      Boolean(actionSuccess) ||
      Boolean(selectedReport) ||
      Boolean(completedActivitiesModal?.isOpen)

    const mainEl = mainRef.current`,
  `  // Body scroll lock effect whenever any modal/popup is open
  useEffect(() => {
    const mainEl = mainRef.current`
)
console.log('Updated scroll lock useEffect to reference component-wide isAnyModalOpen')

// 5. Update header About button
content = content.replace(
  `          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className="text-navy-blue hover:opacity-85 transition cursor-pointer p-1"
            title="About DommUnity"
          >`,
  `          <button
            type="button"
            disabled={isAnyModalOpen}
            onClick={() => setActiveTab('about')}
            className={\`text-navy-blue transition p-1 \${isAnyModalOpen ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-85 cursor-pointer'}\`}
            title="About DommUnity"
          >`
)

// 6. Update header Home button
content = content.replace(
  `          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="text-navy-blue hover:opacity-85 transition cursor-pointer p-1"
            title="Dashboard"
          >`,
  `          <button
            type="button"
            disabled={isAnyModalOpen}
            onClick={() => setActiveTab('dashboard')}
            className={\`text-navy-blue transition p-1 \${isAnyModalOpen ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-85 cursor-pointer'}\`}
            title="Dashboard"
          >`
)

// 7. Update sidebar menu navigation buttons
content = content.replace(
  `              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                  }}
                  className={\`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold tracking-normal transition-all duration-150 cursor-pointer \${activeTab === tab.id
                    ? 'bg-sig-green/20 text-sig-green backdrop-blur-md border-l-[3px] border-sig-green shadow-xs'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-[3px] border-transparent'
                    }\`}`,
  `              ].map((tab) => (
                <button
                  key={tab.id}
                  disabled={isAnyModalOpen}
                  onClick={() => {
                    setActiveTab(tab.id)
                  }}
                  className={\`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold tracking-normal transition-all duration-150 \${activeTab === tab.id
                    ? 'bg-sig-green/20 text-sig-green backdrop-blur-md border-l-[3px] border-sig-green shadow-xs'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-[3px] border-transparent'
                    } \${isAnyModalOpen ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}\`}`
)

// 8. Update logout button
content = content.replace(
  `            <button
              onClick={onLogout}
              className="w-full bg-sig-green hover:bg-sig-green-600 active:bg-sig-green-700 text-navy-blue py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer text-center flex items-center justify-center shadow-glass-sm hover:shadow-md border border-white/40"
            >
              Logout
            </button>`,
  `            <button
              disabled={isAnyModalOpen}
              onClick={onLogout}
              className={\`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-150 text-center flex items-center justify-center border \${
                isAnyModalOpen
                  ? 'opacity-40 cursor-not-allowed bg-gray-500 text-gray-300 border-transparent'
                  : 'bg-sig-green hover:bg-sig-green-600 active:bg-sig-green-700 text-navy-blue cursor-pointer shadow-glass-sm hover:shadow-md border border-white/40'
              }\`}
            >
              Logout
            </button>`
)

// 9. Cut the donation form from the layout and replace with flex header
const marker = '/* Right Column: Donation batch compiler */'
const markerIdx = content.indexOf(marker)

if (markerIdx === -1) {
  console.error('Could not find the donation form marker in AdminDashboard.jsx!')
  process.exit(1)
}

// Find the start <div className="w-full"> before the comment
const beforeMarker = content.slice(0, markerIdx)
const startIdx = beforeMarker.lastIndexOf('<div')

// Find the end index of the donation form card
const endFormIdx = content.indexOf('</form>', markerIdx)
const afterForm = content.slice(endFormIdx)
const div1 = afterForm.indexOf('</div>')
const div2 = afterForm.indexOf('</div>', div1 + 6)
const endIdx = endFormIdx + div2 + '</div>'.length

const originalFormCode = content.slice(startIdx, endIdx)

// Construct new layout for donations tab
const newHeaderAndPlaceholder = `<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                    <div>
                      <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">Donors & Donations Logs</h1>
                    </div>
                    <button
                      type="button"
                      disabled={isAnyModalOpen}
                      onClick={() => {
                        setDonorName('')
                        setDonorType('')
                        setDonPurpose('')
                        setDonDesc('')
                        setDonDate(new Date().toISOString().split('T')[0])
                        setDonItems([{ name: '', category: 'food packs', unit: 'pieces', quantity: '', expiryDate: '' }])
                        setIsDonationModalOpen(true)
                      }}
                      className={\`flex items-center space-x-1.5 bg-navy-blue text-white rounded-lg text-xs font-semibold py-2 px-4 border border-navy-blue shadow-xs transition-all duration-150 \${
                        isAnyModalOpen ? 'opacity-40 cursor-not-allowed' : 'hover:bg-navy-blue-600 active:bg-navy-blue-700 cursor-pointer'
                      }\`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register Donation Batch</span>
                    </button>
                  </div>`

// Find the header of the donations tab
const fullTabBlockStart = content.indexOf(
  "{activeTab === 'donations' && user.role === 'admin' && ("
)
const headerCardStart = content.indexOf(
  '<div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">\n                    <h1 className="text-2xl font-bold text-navy-blue">Donors & Donations Logs</h1>\n                  </div>',
  fullTabBlockStart
)

if (headerCardStart === -1) {
  console.error('Could not find header card start!')
  process.exit(1)
}

// Re-slice content to clean the embedded layout
content = content.slice(0, headerCardStart) + newHeaderAndPlaceholder + '\n' + content.slice(endIdx)
console.log('Refactored Donations Tab Panel header and removed the embedded form from layout')

// 10. Wrap cut form code inside modal wrapper and insert in the bottom viewport modals block
const insertionModalsMarker = '{/* Centered Glassmorphic Add / Edit User Modal */}'
const insertionIdx = content.indexOf(insertionModalsMarker)

if (insertionIdx === -1) {
  console.error('Could not find insertion modals section at the bottom of AdminDashboard.jsx!')
  process.exit(1)
}

// Convert original form card layout to a centered glassmorphic modal overlay
const cleanFormCode = originalFormCode
  .replace(/<div className="\s*w-full\s*">/, '')
  .replace('{/* Right Column: Donation batch compiler */}', '')
  .replace('<div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">', '')
  .slice(0, -'</div>\n                  </div>'.length)

const modalWrapper = `
        {/* REGISTER DONATION BATCH MODAL */}
        {isDonationModalOpen && (
          <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-modal rounded-2xl p-6 max-w-4xl w-full shadow-2xl border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in-scale">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-3 text-left">
                <h3 className="font-bold text-navy-blue text-base">
                  Register Donation Batch
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDonationModalOpen(false)}
                  className="text-gray-400 hover:text-navy-blue transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              \n${cleanFormCode.trim()}\n
            </div>
          </div>
        )}
`

content = content.slice(0, insertionIdx) + modalWrapper + '\n' + content.slice(insertionIdx)
console.log('Appended Register Donation Batch Modal to the bottom viewport modals block!')

fs.writeFileSync(filePath, content, 'utf8')
console.log('Refactoring donation modal completed successfully!')
