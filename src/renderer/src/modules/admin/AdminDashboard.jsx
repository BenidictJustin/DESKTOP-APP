import React, { useState, useEffect, useRef } from 'react';
import {
  getUsers, registerUser, updateUser, deleteUser, updateCoordinatorStatus, getResetRequests, handleResetRequest,
  getOrganizations, addOrganization, updateOrganization, deleteOrganization,
  getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
  getDonors, addDonor, updateDonor, deleteDonor, getDonations, addDonation,
  getEvents, addEvent, updateEvent,
  getReports, updateReport, getInventoryTransactions, logInventoryTransaction,
  addReport, uploadPhoto
} from '../../services/db';
import {
  Users, Package, Gift, Calendar, FileText, Info, LogOut,
  Plus, Edit2, Trash2, Check, X, ShieldAlert, Download, Clock, ArrowRight,
  TrendingDown, TrendingUp, Sparkles, FolderOpen, MapPin, Eye, FileSymlink, ChevronRight, AlertTriangle,
  LayoutDashboard, Share, ListFilter, Search, Save, Send, Upload, Image as ImageIcon, MessageSquare, Edit3,
  Heading1, Heading2, Heading3, Bold, Italic, Strikethrough, List, ListOrdered, Quote, Undo2, Redo2, Settings, ChevronLeft
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingUser, setEditingUser] = useState(null);

  // States for database sync
  const [usersList, setUsersList] = useState([]);
  const [orgsList, setOrgsList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [donorsList, setDonorsList] = useState([]);
  const [donationsList, setDonationsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);

  // Loading & error handling states
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // PDF Export target reference
  const pdfExportRef = useRef(null);
  const [exportingReport, setExportingReport] = useState(null);

  const [deletedCategories, setDeletedCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('dommunity_deleted_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const defaultCategories = ['school supplies', 'food packs', 'hygiene kits'];
  const allCategories = [...new Set([...defaultCategories, ...inventoryList.map(i => (i.category || '').trim().toLowerCase())])].filter(Boolean);
  const activeCategories = allCategories.filter(cat => !deletedCategories.includes(cat.toLowerCase().trim()));

  const defaultUnits = ['pieces', 'cans', 'packs', 'boxes', 'bundles', 'bars'];
  const allUnits = [...new Set([...defaultUnits, ...inventoryList.map(i => (i.unit || '').trim().toLowerCase())])].filter(Boolean);

  // Form inputs
  // Coordinator Registration form
  const [coordName, setCoordName] = useState('');
  const [coordFirstName, setCoordFirstName] = useState('');
  const [coordLastName, setCoordLastName] = useState('');
  const [coordEmail, setCoordEmail] = useState('');
  const [coordUsername, setCoordUsername] = useState('');
  const [coordPassword, setCoordPassword] = useState('');
  const [coordConfirmPassword, setCoordConfirmPassword] = useState('');
  const [coordOrgId, setCoordOrgId] = useState('');
  const [coordRole, setCoordRole] = useState('department_coordinator'); // department_coordinator vs office_coordinator
  const [coordErrors, setCoordErrors] = useState({});

  // Inventory Item Form
  const [itemEditing, setItemEditing] = useState(null); // null means adding
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('food packs');
  const [itemUnit, setItemUnit] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemExpiry, setItemExpiry] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [releaseItemId, setReleaseItemId] = useState('');
  const [releaseQty, setReleaseQty] = useState('');
  const [releaseQtyGroup, setReleaseQtyGroup] = useState('');
  const [releaseQtyPieces, setReleaseQtyPieces] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [releaseSearch, setReleaseSearch] = useState('');
  const [showReleaseDropdown, setShowReleaseDropdown] = useState(false);
  const [showAddCategoryDropdown, setShowAddCategoryDropdown] = useState(false);
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);
  const [showAddQtyDropdown, setShowAddQtyDropdown] = useState(false);
  const [showEditQtyDropdown, setShowEditQtyDropdown] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm }
  const [showItemNameSuggestions, setShowItemNameSuggestions] = useState(false);
  const [itemPiecesPerUnit, setItemPiecesPerUnit] = useState('');
  const [itemGroupUnit, setItemGroupUnit] = useState('none');
  const [releaseUnitType, setReleaseUnitType] = useState('base');
  const [showAddUnitDropdown, setShowAddUnitDropdown] = useState(false);
  const [showEditUnitDropdown, setShowEditUnitDropdown] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [txHistory, setTxHistory] = useState([]);
  const [pendingReleaseItems, setPendingReleaseItems] = useState([]);
  const [showAllRecommended, setShowAllRecommended] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // States for donation batch item dropdown inputs
  const [activeDonItemSuggestionsIdx, setActiveDonItemSuggestionsIdx] = useState(null);
  const [activeDonItemCategoryIdx, setActiveDonItemCategoryIdx] = useState(null);
  const [activeDonItemUnitIdx, setActiveDonItemUnitIdx] = useState(null);
  const [activeDonItemQtyIdx, setActiveDonItemQtyIdx] = useState(null);

  const prevAddCategoryRef = useRef('');
  const prevAddQtyRef = useRef('');
  const prevAddUnitRef = useRef('');
  const prevEditCategoryRef = useRef('');
  const prevEditQtyRef = useRef('');
  const prevEditUnitRef = useRef('');
  const prevReleaseSearchRef = useRef('');
  const errorOkButtonRef = useRef(null);
  const confirmButtonRef = useRef(null);

  const prevDonCategoryRef = useRef({ idx: -1, value: '' });
  const prevDonUnitRef = useRef({ idx: -1, value: '' });
  const prevDonQtyRef = useRef({ idx: -1, value: '' });

  useEffect(() => {
    if ((actionError || validationError) && errorOkButtonRef.current) {
      errorOkButtonRef.current.focus();
    }
  }, [actionError, validationError]);

  useEffect(() => {
    if (confirmDialog && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [confirmDialog]);

  useEffect(() => {
    if ((itemCategory || '').toLowerCase().trim() === 'school supplies') {
      setItemExpiry('');
    }
  }, [itemCategory]);

  const formatUnit = (qty, unitStr) => {
    if (!unitStr) return '';
    let unit = unitStr.trim();
    if (unit === '') return '';

    const isCapitalized = unit[0] === unit[0].toUpperCase();
    const isAllUpperCase = unit === unit.toUpperCase();
    let base = unit.toLowerCase();

    const getSingular = (str) => {
      if (str.endsWith('ies')) {
        return str.slice(0, -3) + 'y';
      }
      if (str.endsWith('es')) {
        if (str.endsWith('pieces')) return str.slice(0, -1);
        if (str.endsWith('ces')) return str.slice(0, -1);
        if (str.endsWith('xes') || str.endsWith('shes') || str.endsWith('ches') || str.endsWith('sses')) {
          return str.slice(0, -2);
        }
        return str.slice(0, -1);
      }
      if (str.endsWith('s') && !str.endsWith('ss')) {
        return str.slice(0, -1);
      }
      return str;
    };

    const getPlural = (str) => {
      if (str.endsWith('ies') || (str.endsWith('es') && !str.endsWith('piece')) || (str.endsWith('s') && !str.endsWith('ss'))) {
        str = getSingular(str);
      }
      if (str.endsWith('y') && !['ay', 'ey', 'oy', 'uy'].includes(str.slice(-2))) {
        return str.slice(0, -1) + 'ies';
      }
      if (str.endsWith('x') || str.endsWith('sh') || str.endsWith('ch') || str.endsWith('s')) {
        return str + 'es';
      }
      return str + 's';
    };

    let result = qty === 1 ? getSingular(base) : getPlural(base);

    if (isAllUpperCase) {
      return result.toUpperCase();
    }
    if (isCapitalized) {
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result;
  };

  const handleQtyChange = (val) => {
    if (/^\d*$/.test(val)) {
      setItemQty(val);
    }
  };

  const handleReleaseQtyChange = (val) => {
    if (/^\d*$/.test(val)) {
      setReleaseQty(val);
    }
  };

  const handlePiecesPerUnitChange = (val) => {
    if (/^\d*$/.test(val)) {
      setItemPiecesPerUnit(val);
    }
  };

  const displayStock = (qty, unitStr, groupUnit, piecesPerUnit) => {
    if (!qty) return `0 ${formatUnit(0, unitStr)}`;

    const pPerUnit = piecesPerUnit ? parseInt(piecesPerUnit, 10) : 0;
    if (!groupUnit || groupUnit === 'none' || pPerUnit <= 0) {
      return `${qty} ${formatUnit(qty, unitStr)}`;
    }

    const groups = Math.floor(qty / pPerUnit);
    if (groups > 0) {
      return `${groups} ${formatUnit(groups, groupUnit)}`;
    } else {
      return `${qty} ${formatUnit(qty, unitStr)}`;
    }
  };

  const getRemainingPiecesText = (totalQty, piecesPerUnit, groupUnit) => {
    const qty = parseInt(totalQty, 10);
    const pPerUnit = parseInt(piecesPerUnit, 10) || 12;
    if (isNaN(qty) || isNaN(pPerUnit) || pPerUnit <= 0) return '';
    const grouped = Math.floor(qty / pPerUnit);
    const remaining = qty % pPerUnit;
    const unitName = groupUnit === 'box' ? 'Box' : groupUnit === 'bundle' ? 'Bundle' : 'Pack';
    const unitPlural = groupUnit === 'box' ? 'Boxes' : groupUnit === 'bundle' ? 'Bundles' : 'Packs';
    const groupPart = `${grouped} ${grouped === 1 ? unitName : unitPlural}`;
    const remainingPart = `${remaining} Remaining Piece${remaining === 1 ? '' : 's'}`;
    return `${groupPart} + ${remainingPart}`;
  };

  const getReleaseFactor = (item, releaseUnitStr) => {
    if (!item) return 1;
    const unitLower = (releaseUnitStr || '').toLowerCase().trim();
    const itemUnitLower = (item.unit || '').toLowerCase().trim();

    if (unitLower === 'base' || unitLower === itemUnitLower || unitLower === 'piece' || unitLower === 'pieces') {
      return 1;
    }

    if (item.groupUnit && item.groupUnit.toLowerCase().trim() === unitLower) {
      return item.piecesPerUnit || 12;
    }

    if (unitLower === 'pack' || unitLower === 'packs') {
      return (item.groupUnit === 'pack' && item.piecesPerUnit) ? item.piecesPerUnit : 12;
    }
    if (unitLower === 'box' || unitLower === 'boxes') {
      return (item.groupUnit === 'box' && item.piecesPerUnit) ? item.piecesPerUnit : 12;
    }
    if (unitLower === 'bundle' || unitLower === 'bundles') {
      return (item.groupUnit === 'bundle' && item.piecesPerUnit) ? item.piecesPerUnit : 12;
    }

    return 1;
  };

  const handleDeleteCategory = (catToDelete) => {
    const catLower = catToDelete.toLowerCase().trim();
    setConfirmDialog({
      title: "Delete Category",
      message: `Are you sure you want to permanently delete the category "${catToDelete}" from the dropdown list?`,
      onConfirm: () => {
        const updated = [...deletedCategories, catLower];
        setDeletedCategories(updated);
        localStorage.setItem('dommunity_deleted_categories', JSON.stringify(updated));
        triggerSuccess(`Category "${catToDelete}" has been permanently deleted from the list.`);
        if (itemCategory.toLowerCase().trim() === catLower) {
          setItemCategory('');
        }
      }
    });
  };

  // Donor form
  const [donorName, setDonorName] = useState('');
  const [donorType, setDonorType] = useState('external_sponsor');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [editingDonor, setEditingDonor] = useState(null);
  const [donorRegistrationDate, setDonorRegistrationDate] = useState(new Date().toISOString().split('T')[0]);
  const [donorSearchQuery, setDonorSearchQuery] = useState('');

  // Donation form
  const [donDonorId, setDonDonorId] = useState('');
  const [donPurpose, setDonPurpose] = useState('');
  const [donDesc, setDonDesc] = useState('');
  const [donDate, setDonDate] = useState(new Date().toISOString().split('T')[0]);
  const [donItems, setDonItems] = useState([{ category: '', name: '', quantity: '', unit: 'pieces', expiryDate: '', groupUnit: 'none', piecesPerUnit: '' }]);

  // Organization form
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgAbbr, setOrgAbbr] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [editingOrg, setEditingOrg] = useState(null); // null means registering, object means updating
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [selectedOrgSubTab, setSelectedOrgSubTab] = useState('organization');
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [deptLogo, setDeptLogo] = useState('');
  const [deptCoordinatorId, setDeptCoordinatorId] = useState('');

  // Organization Activity Tracker States
  const [trackerDeptFilter, setTrackerDeptFilter] = useState('all');
  const [trackerMonthFilter, setTrackerMonthFilter] = useState('all');
  const [trackerSearchQuery, setTrackerSearchQuery] = useState('');

  // Event Scheduler form
  const [evtName, setEvtName] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtLoc, setEvtLoc] = useState('');
  const [evtOrgId, setEvtOrgId] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [evtStatus, setEvtStatus] = useState('planned');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventMonthFilter, setEventMonthFilter] = useState('');

  // Review Report detail modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState('');



  // Sync data from DB
  const loadData = async () => {
    try {
      const u = await getUsers();
      const o = await getOrganizations();
      const inv = await getInventory();
      const d = await getDonors();
      const dn = await getDonations();
      const ev = await getEvents();
      const rep = await getReports();
      const reset = await getResetRequests();

      setUsersList(u);
      setOrgsList(o);
      setInventoryList(inv);
      setDonorsList(d);
      setDonationsList(dn);
      setEventsList(ev);
      setReportsList(rep);
      setResetRequests(reset);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerError = (msg) => {
    setActionError(msg);
    setActionSuccess('');
  };

  const triggerValidationError = (title, message, fields = [], guidance = '') => {
    setValidationError({ title, message, fields, guidance });
    setActionError('');
  };

  const clearFieldValError = (fieldName) => {
    if (validationError && validationError.fields.includes(fieldName)) {
      setValidationError(prev => {
        if (!prev) return null;
        const remainingFields = prev.fields.filter(f => f !== fieldName);
        if (remainingFields.length === 0) {
          return null;
        }
        return { ...prev, fields: remainingFields };
      });
    }
  };

  const triggerSuccess = (msg) => {
    setActionSuccess(msg);
    setActionError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setActionSuccess(''), 5000);
  };

  // --- ACTIONS ---

  // Save User (Create or Update)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    
    const errors = {};
    
    // 1. First Name Validation
    if (!coordFirstName.trim()) {
      errors.coordFirstName = 'First name is required.';
    }
    
    // 2. Last Name Validation
    if (!coordLastName.trim()) {
      errors.coordLastName = 'Last name is required.';
    }
    
    // 3. Email Validation
    if (!coordEmail.trim()) {
      errors.coordEmail = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coordEmail.trim())) {
      errors.coordEmail = 'Please enter a valid email address.';
    }
    
    // 4. Role Validation
    if (!coordRole) {
      errors.coordRole = 'Role is required.';
    }
    
    // 5. Assigned Department Validation (only if Role is department_coordinator)
    if (coordRole === 'department_coordinator' && !coordOrgId) {
      errors.coordOrgId = 'Assigned department is required.';
    }
    
    // 6. Password & Confirm Password Validation
    const passwordRequired = !editingUser;
    if (passwordRequired) {
      if (!coordPassword) {
        errors.coordPassword = 'Password is required.';
      } else {
        if (coordPassword.length < 8) {
          errors.coordPassword = 'Password must be at least 8 characters long.';
        } else if (!/[A-Z]/.test(coordPassword)) {
          errors.coordPassword = 'Password must contain at least 1 uppercase letter.';
        } else if (!/[a-z]/.test(coordPassword)) {
          errors.coordPassword = 'Password must contain at least 1 lowercase letter.';
        } else if (!/[0-9]/.test(coordPassword)) {
          errors.coordPassword = 'Password must contain at least 1 number.';
        } else if (!/[^A-Za-z0-9]/.test(coordPassword)) {
          errors.coordPassword = 'Password must contain at least 1 special character.';
        }
      }
      
      if (!coordConfirmPassword) {
        errors.coordConfirmPassword = 'Confirm password is required.';
      } else if (coordConfirmPassword !== coordPassword) {
        errors.coordConfirmPassword = 'Passwords do not match.';
      }
    } else {
      // Editing Mode - Password is optional, but if entered it must follow complexity rules
      if (coordPassword) {
        if (coordPassword.length < 8) {
          errors.coordPassword = 'Password must be at least 8 characters long.';
        } else if (!/[A-Z]/.test(coordPassword)) {
          errors.coordPassword = 'Password must contain at least 1 uppercase letter.';
        } else if (!/[a-z]/.test(coordPassword)) {
          errors.coordPassword = 'Password must contain at least 1 lowercase letter.';
        } else if (!/[0-9]/.test(coordPassword)) {
          errors.coordPassword = 'Password must contain at least 1 number.';
        } else if (!/[^A-Za-z0-9]/.test(coordPassword)) {
          errors.coordPassword = 'Password must contain at least 1 special character.';
        }
        
        if (!coordConfirmPassword) {
          errors.coordConfirmPassword = 'Confirm password is required when changing password.';
        } else if (coordConfirmPassword !== coordPassword) {
          errors.coordConfirmPassword = 'Passwords do not match.';
        }
      }
    }
    
    setCoordErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const fullName = `${coordFirstName.trim()} ${coordLastName.trim()}`;
      const username = coordUsername || coordEmail.split('@')[0] || '';
      const assignedOrg = coordRole === 'department_coordinator' ? coordOrgId : null;
      
      if (editingUser) {
        const payload = {
          name: fullName,
          email: coordEmail,
          username: username,
          role: coordRole,
          organizationId: assignedOrg
        };
        if (coordPassword) {
          payload.password = coordPassword;
        }
        await updateUser(editingUser.uid, payload);
        triggerSuccess(`Account successfully updated for ${fullName}.`);
      } else {
        await registerUser(coordEmail, username, coordPassword, fullName, coordRole, assignedOrg);
        triggerSuccess(`Account successfully established for ${fullName}.`);
      }

      // Reset form
      setEditingUser(null);
      setCoordName('');
      setCoordFirstName('');
      setCoordLastName('');
      setCoordEmail('');
      setCoordUsername('');
      setCoordPassword('');
      setCoordConfirmPassword('');
      setCoordOrgId('');
      setCoordRole('department_coordinator');
      setCoordErrors({});
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.uid === user.uid) {
      triggerError("Cannot delete your own administrator session.");
      return;
    }
    setConfirmDialog({
      title: "Delete User Account",
      message: `Are you sure you want to permanently delete the account of ${targetUser.name}? This action is irreversible.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await deleteUser(targetUser.uid);
          triggerSuccess(`Account of ${targetUser.name} has been permanently deleted.`);
          loadData();
        } catch (err) {
          triggerError(err.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Toggle user status
  const handleToggleStatus = async (uid, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateCoordinatorStatus(uid, nextStatus);
      triggerSuccess(`Account status updated to ${nextStatus}.`);
      loadData();
    } catch (err) {
      triggerError(err.message);
    }
  };

  // Reset password requests approval
  const handleResetApproval = async (reqId, action) => {
    try {
      await handleResetRequest(reqId, action);
      triggerSuccess(`Password request status updated: ${action}.`);
      loadData();
    } catch (err) {
      triggerError(err.message);
    }
  };

  // Inventory Save (Add/Update)
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    const isSchoolSupplies = (itemCategory || '').toLowerCase().trim() === 'school supplies';

    const unitLower = (itemUnit || '').toLowerCase().trim();
    const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(unitLower);

    if (!itemName || !itemQty || (!isSchoolSupplies && !itemExpiry) || (isAlreadyGrouped && !itemPiecesPerUnit)) {
      const fields = [];
      if (!itemName) fields.push('itemName');
      if (!itemQty) fields.push('itemQty');
      if (!isSchoolSupplies && !itemExpiry) fields.push('itemExpiry');
      if (isAlreadyGrouped && !itemPiecesPerUnit) fields.push('itemPiecesPerUnit');

      let errMsg = "Item name and quantity are required to catalog the supply.";
      if (!isSchoolSupplies && !itemExpiry) {
        errMsg = "Item name, quantity, and expiration date are required to catalog this supply.";
      }
      if (isAlreadyGrouped && !itemPiecesPerUnit) {
        errMsg = "Pieces per Unit is required when the Unit is a Pack, Box, or Bundle.";
      }

      triggerValidationError(
        "Inventory Catalog Error",
        errMsg,
        fields,
        "Provide a name, valid quantity, and any other required information before saving."
      );
      return;
    }

    let finalQty = parseInt(itemQty, 10);
    let finalUnit = itemUnit;
    let finalGroupUnit = itemGroupUnit;
    let finalPiecesPerUnit = itemPiecesPerUnit ? parseInt(itemPiecesPerUnit, 10) : null;

    if (isAlreadyGrouped) {
      if (unitLower === 'pack' || unitLower === 'packs') finalGroupUnit = 'pack';
      else if (unitLower === 'box' || unitLower === 'boxes') finalGroupUnit = 'box';
      else if (unitLower === 'bundle' || unitLower === 'bundles') finalGroupUnit = 'bundle';

      finalUnit = 'pieces';
      const factor = finalPiecesPerUnit || 12;
      finalQty = finalQty * factor;
    }

    const payload = {
      name: itemName,
      category: itemCategory,
      unit: finalUnit,
      quantity: finalQty,
      expiryDate: (isSchoolSupplies || !itemExpiry) ? null : new Date(itemExpiry).toISOString(),
      piecesPerUnit: finalPiecesPerUnit,
      groupUnit: finalGroupUnit
    };

    setLoading(true);
    try {
      if (itemEditing) {
        await updateInventoryItem(itemEditing.id, { ...payload, hasBeenReleased: false }, user.uid);
        const qtyDiff = payload.quantity - itemEditing.quantity;
        if (qtyDiff > 0) {
          await logInventoryTransaction('added', payload.name, qtyDiff, payload.unit, 'Stock updated manually');
        } else if (qtyDiff < 0) {
          await logInventoryTransaction('released', payload.name, Math.abs(qtyDiff), payload.unit, 'Stock reduced manually');
        }
        triggerSuccess("Inventory catalog updated successfully");
      } else {
        await addInventoryItem(payload, user.uid);
        await logInventoryTransaction('added', payload.name, payload.quantity, payload.unit, 'New item cataloged');
        triggerSuccess("Item added successfully");
        setIsAddModalOpen(false); // Close Add Modal on success
      }

      // Reset
      setItemEditing(null);
      setItemName('');
      setItemUnit('');
      setItemQty('');
      setItemExpiry('');
      setItemPiecesPerUnit('');
      setItemGroupUnit('none');
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInventory = async (itemId) => {
    setConfirmDialog({
      title: "Delete Inventory Item",
      message: "Are you sure you want to delete this item? This action is permanent.",
      onConfirm: async () => {
        try {
          const item = inventoryList.find(i => i.id === itemId);
          await deleteInventoryItem(itemId);
          if (item) {
            await logInventoryTransaction('deleted', item.name, item.quantity, item.unit, 'Removed from inventory catalog');
          }
          triggerSuccess("Item deleted successfully");
          loadData();
        } catch (err) {
          triggerError(err.message);
        }
      }
    });
  };

  // Inventory Item Release (Added to Pending List)
  const handleAddPendingReleaseItem = (e) => {
    e.preventDefault();
    if (!releaseItemId) {
      triggerValidationError(
        "Release Item Error",
        "Please select an item to release.",
        ['releaseItemId'],
        "Search and choose a stock item before submitting."
      );
      return;
    }

    const item = inventoryList.find(i => i.id === releaseItemId);
    if (!item) {
      triggerValidationError(
        "Release Item Error",
        "Selected item not found.",
        ['releaseItemId'],
        "Select a valid active item from the searchable stock dropdown list."
      );
      return;
    }

    const hasGroup = item.groupUnit && item.groupUnit !== 'none' && item.piecesPerUnit;
    const factor = item.piecesPerUnit ? parseInt(item.piecesPerUnit, 10) : 12;

    let baseQtyToRelease = 0;
    let qtyGroupVal = 0;
    let qtyPiecesVal = 0;

    if (hasGroup) {
      qtyGroupVal = parseInt(releaseQtyGroup, 10) || 0;
      qtyPiecesVal = parseInt(releaseQtyPieces, 10) || 0;
      baseQtyToRelease = (qtyGroupVal * factor) + qtyPiecesVal;
    } else {
      qtyPiecesVal = parseInt(releaseQtyPieces, 10) || parseInt(releaseQty, 10) || 0;
      baseQtyToRelease = qtyPiecesVal;
    }

    if (baseQtyToRelease <= 0) {
      triggerValidationError(
        "Release Item Error",
        "Please enter a valid positive quantity to release.",
        hasGroup ? ['releaseQtyGroup', 'releaseQtyPieces'] : ['releaseQty'],
        "The release quantity (grouped units or pieces) must be a positive whole number."
      );
      return;
    }

    const existingPending = pendingReleaseItems.find(p => p.id === releaseItemId);
    const alreadyPendingBaseQty = existingPending ? parseInt(existingPending.baseQty, 10) || 0 : 0;
    const totalProposedBaseRelease = alreadyPendingBaseQty + baseQtyToRelease;

    if (totalProposedBaseRelease > item.quantity) {
      triggerValidationError(
        "Release Item Error",
        `Insufficient stock. Only ${item.quantity} Total Pieces available, and ${alreadyPendingBaseQty} is already in the release list.`,
        hasGroup ? ['releaseQtyGroup', 'releaseQtyPieces'] : ['releaseQty'],
        "Reduce the release quantity to fit within available stock."
      );
      return;
    }

    if (existingPending) {
      const newBaseQty = alreadyPendingBaseQty + baseQtyToRelease;
      let newQtyGroup = 0;
      let newQtyPieces = newBaseQty;
      if (hasGroup) {
        newQtyGroup = Math.floor(newBaseQty / factor);
        newQtyPieces = newBaseQty % factor;
      }
      setPendingReleaseItems(prev =>
        prev.map(p => p.id === releaseItemId ? {
          ...p,
          qtyGroup: newQtyGroup,
          qtyPieces: newQtyPieces,
          baseQty: newBaseQty
        } : p)
      );
    } else {
      setPendingReleaseItems(prev => [
        ...prev,
        {
          id: item.id,
          name: item.name,
          category: item.category,
          baseUnit: item.unit,
          groupUnit: item.groupUnit,
          piecesPerUnit: item.piecesPerUnit,
          availableStock: item.quantity,
          qtyGroup: qtyGroupVal,
          qtyPieces: qtyPiecesVal,
          baseQty: baseQtyToRelease,
          expiryDate: item.expiryDate
        }
      ]);
    }

    setReleaseItemId('');
    setReleaseQty('');
    setReleaseQtyGroup('');
    setReleaseQtyPieces('');
    setReleaseSearch('');
    setReleaseUnitType('base');
  };

  const handleEditPendingQty = (itemId, val) => {
    if (val === '') {
      setPendingReleaseItems(prev =>
        prev.map(p => p.id === itemId ? { ...p, qty: '' } : p)
      );
      return;
    }

    const qty = parseInt(val, 10);
    if (isNaN(qty) || qty < 0) return;

    const pendingItem = pendingReleaseItems.find(p => p.id === itemId);
    if (!pendingItem) return;

    const item = inventoryList.find(i => i.id === itemId);
    const itemFactor = getReleaseFactor(item, pendingItem.releaseUnitType);
    const proposedBaseQty = qty * itemFactor;

    if (proposedBaseQty > pendingItem.availableStock) {
      triggerValidationError(
        "Release List Edit Error",
        `Cannot release ${qty} ${formatUnit(qty, pendingItem.releaseUnit)}. Only ${displayStock(pendingItem.availableStock, pendingItem.baseUnit, item.groupUnit, item.piecesPerUnit)} is available in stock.`,
        [],
        "Specify a release quantity that does not exceed the available inventory stock."
      );
      return;
    }

    setPendingReleaseItems(prev =>
      prev.map(p => p.id === itemId ? { ...p, qty, baseQty: proposedBaseQty } : p)
    );
  };

  const handleRemovePendingItem = (itemId) => {
    setPendingReleaseItems(prev => prev.filter(p => p.id !== itemId));
  };

  const handleConfirmRelease = async () => {
    const invalidItem = pendingReleaseItems.find(p => !p.baseQty || parseInt(p.baseQty, 10) <= 0);
    if (invalidItem) {
      triggerValidationError(
        "Release Confirmation Error",
        `Please specify a valid quantity for "${invalidItem.name}".`,
        [],
        "Ensure all items in the release list have a quantity greater than zero before confirming."
      );
      return;
    }

    setLoading(true);
    try {
      for (const pending of pendingReleaseItems) {
        const item = inventoryList.find(i => i.id === pending.id);
        if (!item) {
          throw new Error(`Item "${pending.name}" not found in inventory.`);
        }
        const baseQtyToRelease = parseInt(pending.baseQty, 10);
        if (baseQtyToRelease > item.quantity) {
          throw new Error(`Insufficient stock for "${item.name}". Only ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} available.`);
        }
        const updatedQty = item.quantity - baseQtyToRelease;
        await updateInventoryItem(item.id, { quantity: updatedQty, hasBeenReleased: true }, user.uid);
        await logInventoryTransaction('released', item.name, baseQtyToRelease, item.baseUnit, 'Released for outreach program');
      }

      triggerSuccess("Items released successfully");
      setPendingReleaseItems([]);
      setIsReviewModalOpen(false); // Close review list modal
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReportPreview = async () => {
    setLoading(true);
    try {
      const history = await getInventoryTransactions();
      setTxHistory(history);
      setShowReportPreview(true);
    } catch (e) {
      console.error(e);
      triggerError("Failed to load inventory transaction history.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDownloadPDF = () => {
    const input = document.getElementById('inventory-history-pdf-target');
    if (!input) return;

    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`CES_Inventory_History_${new Date().toISOString().split('T')[0]}.pdf`);
      setShowReportPreview(false);
    });
  };

  // Donor CRUD Handlers
  const handleCreateDonor = async (e) => {
    e.preventDefault();
    if (!donorName) {
      triggerValidationError(
        "Donor Profile Error",
        "Donor name is required.",
        ['donorName'],
        "Please enter the official name of the school department, individual, or external sponsor."
      );
      return;
    }

    setLoading(true);
    try {
      if (editingDonor) {
        await updateDonor(editingDonor.id, {
          name: donorName,
          type: donorType,
          contactEmail: donorEmail,
          contactPhone: donorPhone,
          createdAt: donorRegistrationDate ? new Date(donorRegistrationDate).toISOString() : new Date().toISOString()
        });
        triggerSuccess(`Donor profile updated: ${donorName}.`);
        setEditingDonor(null);
      } else {
        await addDonor({
          name: donorName,
          type: donorType,
          contactEmail: donorEmail,
          contactPhone: donorPhone,
          createdAt: donorRegistrationDate ? new Date(donorRegistrationDate).toISOString() : new Date().toISOString()
        });
        triggerSuccess(`Donor logged: ${donorName}.`);
      }
      setDonorName('');
      setDonorEmail('');
      setDonorPhone('');
      setDonorType('external_sponsor');
      setDonorRegistrationDate(new Date().toISOString().split('T')[0]);
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDonorEdit = () => {
    setEditingDonor(null);
    setDonorName('');
    setDonorType('external_sponsor');
    setDonorEmail('');
    setDonorPhone('');
    setDonorRegistrationDate(new Date().toISOString().split('T')[0]);
    clearFieldValError('donorName');
  };

  const handleEditDonorClick = (donor) => {
    setEditingDonor(donor);
    setDonorName(donor.name || '');
    setDonorType(donor.type || 'external_sponsor');
    setDonorEmail(donor.contactEmail || '');
    setDonorPhone(donor.contactPhone || '');
    if (donor.createdAt) {
      try {
        const dateStr = new Date(donor.createdAt).toISOString().split('T')[0];
        setDonorRegistrationDate(dateStr);
      } catch (err) {
        setDonorRegistrationDate(new Date().toISOString().split('T')[0]);
      }
    } else {
      setDonorRegistrationDate(new Date().toISOString().split('T')[0]);
    }
    clearFieldValError('donorName');
  };

  const handleDeleteDonor = async (donorId) => {
    const donor = donorsList.find(d => d.id === donorId);
    if (!donor) return;

    setConfirmDialog({
      title: "Delete Donor Profile",
      message: `Are you sure you want to delete ${donor.name}? This will permanently remove the donor profile.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await deleteDonor(donorId);
          triggerSuccess(`Donor ${donor.name} successfully deleted.`);
          if (editingDonor?.id === donorId) {
            handleCancelDonorEdit();
          }
          loadData();
        } catch (err) {
          triggerError(err.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Donation item change
  const handleDonItemChange = (idx, field, val) => {
    const list = [...donItems];
    if (field === 'quantity' || field === 'piecesPerUnit') {
      if (!/^\d*$/.test(val)) return;
    }
    list[idx][field] = val;
    if (field === 'category' && val.toLowerCase().trim() === 'school supplies') {
      list[idx].expiryDate = '';
    }
    setDonItems(list);
  };

  // Add donation item line
  const handleAddDonItemLine = () => {
    setDonItems([...donItems, { category: '', name: '', quantity: '', unit: 'pieces', expiryDate: '', groupUnit: 'none', piecesPerUnit: '' }]);
  };

  // Remove donation item line
  const handleRemoveDonItemLine = (idx) => {
    const list = donItems.filter((_, i) => i !== idx);
    setDonItems(list);
  };

  // Donation Batch Create
  const handleCreateDonation = async (e) => {
    e.preventDefault();
    if (!donDonorId || !donPurpose) {
      const fields = [];
      if (!donDonorId) fields.push('donDonorId');
      if (!donPurpose) fields.push('donPurpose');
      triggerValidationError(
        "Donation Entry Error",
        "Donor source and purpose are required.",
        fields,
        "Select the logging donor profile and state the community outreach purpose for this donation."
      );
      return;
    }

    // Comprehensive validation for donation items in the batch
    const fields = [];
    let errMsg = "";
    
    donItems.forEach((item, idx) => {
      const isSchoolSupplies = (item.category || '').toLowerCase().trim() === 'school supplies';
      const unitLower = (item.unit || '').toLowerCase().trim();
      const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(unitLower);

      if (!item.name) fields.push(`donItem-${idx}-name`);
      if (!item.quantity) fields.push(`donItem-${idx}-quantity`);
      if (!isSchoolSupplies && !item.expiryDate) fields.push(`donItem-${idx}-expiryDate`);
      if (isAlreadyGrouped && !item.piecesPerUnit) fields.push(`donItem-${idx}-piecesPerUnit`);
    });

    if (fields.length > 0) {
      const firstField = fields[0];
      const match = firstField.match(/donItem-(\d+)-(.+)/);
      const itemNum = parseInt(match[1], 10) + 1;
      const fieldName = match[2];

      if (fieldName === 'name') errMsg = `Item Name is required for Item #${itemNum}.`;
      else if (fieldName === 'quantity') errMsg = `Quantity is required for Item #${itemNum}.`;
      else if (fieldName === 'expiryDate') errMsg = `Expiration Date is required for Item #${itemNum} (non-school supplies).`;
      else if (fieldName === 'piecesPerUnit') errMsg = `Pieces per Unit is required for Item #${itemNum} since the Unit is grouped.`;

      triggerValidationError(
        "Donation Batch Error",
        errMsg,
        fields,
        "Please ensure all required fields are filled out on each item card."
      );
      return;
    }

    // Process and convert grouped items to base units (pieces)
    const processedItems = donItems.map(i => {
      const isSchoolSupplies = (i.category || '').toLowerCase().trim() === 'school supplies';
      const unitLower = (i.unit || '').toLowerCase().trim();
      const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(unitLower);

      let finalQty = parseInt(i.quantity, 10);
      let finalUnit = i.unit;
      let finalGroupUnit = i.groupUnit || 'none';
      let finalPiecesPerUnit = i.piecesPerUnit ? parseInt(i.piecesPerUnit, 10) : null;

      if (isAlreadyGrouped) {
        if (unitLower === 'pack' || unitLower === 'packs') finalGroupUnit = 'pack';
        else if (unitLower === 'box' || unitLower === 'boxes') finalGroupUnit = 'box';
        else if (unitLower === 'bundle' || unitLower === 'bundles') finalGroupUnit = 'bundle';

        finalUnit = 'pieces';
        const factor = finalPiecesPerUnit || 12;
        finalQty = finalQty * factor;
      }

      return {
        category: i.category,
        name: i.name,
        unit: finalUnit,
        quantity: finalQty,
        expiryDate: (isSchoolSupplies || !i.expiryDate) ? null : new Date(i.expiryDate).toISOString(),
        piecesPerUnit: finalPiecesPerUnit,
        groupUnit: finalGroupUnit
      };
    });

    const payload = {
      donorId: donDonorId,
      dateOfDonation: new Date(donDate).toISOString(),
      purpose: donPurpose,
      description: donDesc,
      items: processedItems
    };

    setLoading(true);
    try {
      await addDonation(payload, user.uid);
      const donor = donorsList.find(d => d.id === payload.donorId);
      const donorNameStr = donor ? donor.name : 'Donor';
      for (const item of payload.items) {
        await logInventoryTransaction('added', item.name, item.quantity, item.unit, `Received via donation batch from: ${donorNameStr}`);
      }
      triggerSuccess("Donation batch registered and items added to inventory stock.");

      // Reset
      setDonPurpose('');
      setDonDesc('');
      setDonItems([{ category: '', name: '', quantity: '', unit: 'pieces', expiryDate: '', groupUnit: 'none', piecesPerUnit: '' }]);
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Org Create & Update
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!orgId || !orgName || !orgAbbr) {
      const fields = [];
      if (!orgId) fields.push('orgId');
      if (!orgName) fields.push('orgName');
      if (!orgAbbr) fields.push('orgAbbr');
      triggerValidationError(
        editingOrg ? "Profile Update Error" : "Profile Registration Error",
        "ID Code, Name, and Abbreviation are required.",
        fields,
        "Enter a unique Slug ID Code, the full Name, and its standard Abbreviation before saving."
      );
      return;
    }

    setLoading(true);
    try {
      if (editingOrg) {
        // If updating
        const determinedType = editingOrg.type || 'department';
        const updates = { 
          name: orgName, 
          abbreviation: orgAbbr, 
          description: orgDesc,
          type: determinedType
        };
        if (determinedType === 'department') {
          updates.logo = deptLogo || null;
          updates.coordinatorId = deptCoordinatorId || null;
        }
        await updateOrganization(editingOrg.id, updates);

        // Update user organization links
        if (determinedType === 'department' && deptCoordinatorId) {
          await updateUser(deptCoordinatorId, { organizationId: editingOrg.id });
        }
        triggerSuccess(`Profile updated: ${orgName}.`);
        setEditingOrg(null);
      } else {
        // If registering new
        const determinedType = selectedOrgSubTab === 'department' ? 'department' : 'organization';
        const newOrg = { 
          id: orgId, 
          name: orgName, 
          abbreviation: orgAbbr, 
          description: orgDesc,
          type: determinedType
        };
        if (determinedType === 'department') {
          newOrg.logo = deptLogo || null;
          newOrg.coordinatorId = deptCoordinatorId || null;
        }
        await addOrganization(newOrg);

        // Update user organization links
        if (determinedType === 'department' && deptCoordinatorId) {
          await updateUser(deptCoordinatorId, { organizationId: orgId });
        }
        triggerSuccess(`${determinedType === 'department' ? 'Department' : 'Organization'} Profile registered: ${orgName}.`);
      }
      setOrgId('');
      setOrgName('');
      setOrgAbbr('');
      setOrgDesc('');
      setDeptLogo('');
      setDeptCoordinatorId('');
      setIsAddOrgModalOpen(false);
      setIsAddDeptModalOpen(false);
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrgClick = (org) => {
    setEditingOrg(org);
    setOrgId(org.id);
    setOrgName(org.name);
    setOrgAbbr(org.abbreviation);
    setOrgDesc(org.description || '');
    setDeptLogo(org.logo || '');
    setDeptCoordinatorId(org.coordinatorId || '');
    clearFieldValError('orgId');
    clearFieldValError('orgName');
    clearFieldValError('orgAbbr');
    if (org.type === 'organization') {
      setIsAddOrgModalOpen(true);
    } else {
      setIsAddDeptModalOpen(true);
    }
  };

  const handleCancelOrgEdit = () => {
    setEditingOrg(null);
    setOrgId('');
    setOrgName('');
    setOrgAbbr('');
    setOrgDesc('');
    setDeptLogo('');
    setDeptCoordinatorId('');
    clearFieldValError('orgId');
    clearFieldValError('orgName');
    clearFieldValError('orgAbbr');
    setIsAddOrgModalOpen(false);
    setIsAddDeptModalOpen(false);
  };

  const handleDeleteOrg = async (orgId) => {
    const org = orgsList.find(o => o.id === orgId);
    if (!org) return;

    setConfirmDialog({
      title: `Delete ${org.type === 'organization' ? 'Organization' : 'Department'} Profile`,
      message: `Are you sure you want to delete ${org.name}? This will permanently remove the profile.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await deleteOrganization(orgId);
          triggerSuccess(`${org.type === 'organization' ? 'Organization' : 'Department'} ${org.name} successfully deleted.`);
          if (editingOrg?.id === orgId) {
            handleCancelOrgEdit();
          }
          if (selectedOrgSubTab === orgId) {
            setSelectedOrgSubTab(org.type === 'organization' ? 'organization' : 'department');
          }
          loadData();
        } catch (err) {
          triggerError(err.message);
        } finally {
          setLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  // Event schedule helper to set edit mode
  const handleEditClick = (evt) => {
    setEditingEvent(evt);
    setEvtName(evt.name || '');
    setEvtDesc(evt.description || '');
    if (evt.scheduleDate) {
      try {
        const localDate = new Date(evt.scheduleDate);
        const offset = localDate.getTimezoneOffset();
        const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
        setEvtDate(adjustedDate.toISOString().slice(0, 16));
      } catch (err) {
        setEvtDate('');
      }
    } else {
      setEvtDate('');
    }
    setEvtLoc(evt.location || '');
    setEvtOrgId(evt.assignedOrganizationId || '');
    setEvtStatus(evt.status || 'planned');
    clearFieldValError('evtName');
    clearFieldValError('evtDate');
    clearFieldValError('evtOrgId');
  };

  // Event schedule / update handler
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!evtName || !evtDate || !evtOrgId) {
      const fields = [];
      if (!evtName) fields.push('evtName');
      if (!evtDate) fields.push('evtDate');
      if (!evtOrgId) fields.push('evtOrgId');
      triggerValidationError(
        editingEvent ? "Event Update Error" : "Event Scheduling Error",
        "Event name, scheduled date & time, and assigned department are required.",
        fields,
        editingEvent
          ? "Provide a descriptive Event Name, set a Scheduled Date & Time, and select the co-organizer Assigned Department before updating."
          : "Provide a descriptive Event Name, set a future Scheduled Date & Time, and select the co-organizer Assigned Department before scheduling."
      );
      return;
    }

    setLoading(true);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          name: evtName,
          description: evtDesc,
          scheduleDate: new Date(evtDate).toISOString(),
          location: evtLoc,
          assignedOrganizationId: evtOrgId,
          status: evtStatus
        });
        triggerSuccess(`Outreach updated: ${evtName}.`);
        setEditingEvent(null);
      } else {
        await addEvent({
          name: evtName,
          description: evtDesc,
          scheduleDate: new Date(evtDate).toISOString(),
          location: evtLoc,
          assignedOrganizationId: evtOrgId,
          status: 'planned'
        });
        triggerSuccess(`Outreach scheduled: ${evtName}.`);
      }
      setEvtName('');
      setEvtDesc('');
      setEvtDate('');
      setEvtLoc('');
      setEvtOrgId('');
      setEvtStatus('planned');
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Report decision: Approve or Return
  const handleReviewReport = async (status) => {
    if (!selectedReport) return;
    if (status === 'returned' && !feedbackNote.trim()) {
      alert("Feedback notes are mandatory to return reports.");
      return;
    }

    setLoading(true);
    try {
      await updateReport(selectedReport.id, {
        status,
        adminFeedback: status === 'returned' ? feedbackNote : null
      }, user.uid);

      triggerSuccess(`Report successfully marked as ${status}.`);
      setSelectedReport(null);
      setFeedbackNote('');
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format and export Inventory Report as PDF
  const exportInventoryPDF = () => {
    const input = document.getElementById('inventory-table-container');
    if (!input) return;

    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      // Add Header
      pdf.setFontSize(14);
      pdf.setTextColor(3, 14, 105); // Navy Blue
      pdf.text("DOMINICAN COLLEGE OF TARLAC, INC.", 15, 15);
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // Muted
      pdf.text("Community Extension & Services (CES) Office", 15, 20);
      pdf.text(`Inventory Status Log - Generated: ${new Date().toLocaleDateString()}`, 15, 25);
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(128, 204, 42); // Sig Green
      pdf.line(15, 28, 195, 28);

      pdf.addImage(imgData, 'PNG', 15, 33, imgWidth - 30, imgHeight - 20);
      pdf.save(`CES_Inventory_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    });
  };

  // Compile Approved Report to PDF (standard format)
  const compileReportPDF = (report) => {
    setExportingReport(report);

    // Allow React to render the template in a hidden container
    setTimeout(() => {
      const input = document.getElementById('report-pdf-target');
      if (!input) {
        setExportingReport(null);
        return;
      }

      html2canvas(input, { useCORS: true, scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`CES_Narrative_Report_${report.academicYear}_${report.id.substring(0, 6)}.pdf`);
        setExportingReport(null);
      }).catch(err => {
        console.error(err);
        setExportingReport(null);
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-poppins selection:bg-sig-green selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-navy-blue flex flex-col justify-between shrink-0 relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sig-green"></div>

        <div>
          {/* Logo block */}
          <div className="p-6 border-b border-white/10 flex items-center space-x-3 bg-navy-blue/90">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border-2 border-sig-green">
              <span className="text-navy-blue font-bold text-lg">D</span>
              <span className="text-sig-green font-bold text-sm -ml-0.5">U</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">DommUnity</h2>
              <span className="text-[10px] text-sig-green font-semibold">
                CES Administrator
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'inventory', label: 'Inventory', icon: Package },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'organization', label: 'Organization', icon: FolderOpen },
              { id: 'donations', label: 'Donor', icon: Gift },
              { 
                id: 'reports', 
                label: 'Reports Review', 
                icon: FileText, 
                badge: reportsList.filter(r => r.status === 'submitted').length 
              },
              { id: 'accounts', label: 'User Accounts', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer ${activeTab === tab.id ? 'bg-sig-green text-navy-blue' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center space-x-3">
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[9px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-navy-blue/90">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-sig-green text-navy-blue flex items-center justify-center font-bold text-xs">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-white text-xs font-bold truncate">{user.name}</h4>
              <p className="text-[9px] text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 py-2 px-4 rounded-full text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-8 overflow-y-auto h-screen bg-gray-50">
        <div className="flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto items-start w-full">
          {/* Left / Center Content Column */}
          <div className="flex-1 w-full space-y-6">

            {/* Banner Alert Prompts */}
            {/* Centered Pop-up Warning Alert Dialog */}
            {/* Centered Pop-up Warning Alert Dialog */}
            {(actionError || validationError) && (
              <div className="fixed inset-0 z-100 flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4">
                  <div>
                    <h4 className="font-bold text-navy-blue text-sm uppercase tracking-wide">
                      {validationError ? validationError.title : 'Action Warning'}
                    </h4>
                    <p className="text-xs text-gray-500 font-semibold mt-2 leading-relaxed">
                      {validationError ? validationError.message : actionError}
                    </p>
                  </div>
                  <button
                    ref={errorOkButtonRef}
                    autoFocus
                    type="button"
                    onClick={() => {
                      setActionError('');
                      setValidationError(null);
                    }}
                    className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            {confirmDialog && (
              <div className="fixed inset-0 z-100 flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4">
                  <div>
                    <h4 className="font-bold text-navy-blue text-sm uppercase tracking-wide">
                      {confirmDialog.title}
                    </h4>
                    <p className="text-xs text-gray-500 font-semibold mt-2 leading-relaxed">
                      {confirmDialog.message}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setConfirmDialog(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-semibold py-2.5 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      ref={confirmButtonRef}
                      autoFocus
                      type="button"
                      onClick={() => {
                        confirmDialog.onConfirm();
                        setConfirmDialog(null);
                      }}
                      className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionSuccess && (
              <div className="fixed inset-0 z-100 flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4">
                  <div>
                    <h4 className="font-bold text-navy-blue text-sm uppercase tracking-wide">
                      Success
                    </h4>
                    <p className="text-xs text-gray-500 font-semibold mt-2 leading-relaxed">
                      {actionSuccess}
                    </p>
                  </div>
                  <button
                    autoFocus
                    type="button"
                    onClick={() => {
                      setActionSuccess('');
                    }}
                    className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* DASHBOARD TAB PANEL */}
            {/* ==================================================== */}
            {activeTab === 'dashboard' && user.role === 'admin' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h1 className="text-2xl font-bold text-navy-blue">CES Administrative Dashboard</h1>
                  <p className="text-gray-500 text-xs mt-1">Overview of Community Extension & Services operations, coordinator accounts, and live alerts.</p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Coordinators</span>
                      <span className="text-2xl font-black text-navy-blue">
                        {usersList.filter(u => u.role === 'department_coordinator' && u.status === 'active').length}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Logged Donors</span>
                      <span className="text-2xl font-black text-navy-blue">{donorsList.length}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3.5 bg-yellow-50 text-yellow-600 rounded-2xl">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Stock Items</span>
                      <span className="text-2xl font-black text-navy-blue">
                        {inventoryList.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Relief Purposes</span>
                      <span className="text-2xl font-black text-navy-blue">
                        {[...new Set(donationsList.map(d => d.purpose))].length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Alerts & Action Center section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Reset Requests queue */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <span>Password Reset Notifications</span>
                    </h3>
                    {resetRequests.filter(r => r.status === 'pending').length > 0 ? (
                      <div className="space-y-2">
                        {resetRequests.filter(r => r.status === 'pending').map(req => (
                          <div key={req.id} className="flex justify-between items-center p-3 border border-red-200/50 rounded-xl bg-red-50/10 text-xs">
                            <div>
                              <span className="font-bold text-navy-blue">{req.name}</span> ({req.email})
                              <div className="text-[10px] text-gray-400">Requested reset on {new Date(req.timestamp).toLocaleDateString()}</div>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleResetApproval(req.id, 'dismiss')}
                                className="py-1 px-3 bg-gray-50 border border-gray-200 text-gray-500 rounded-full hover:bg-gray-100 transition cursor-pointer text-[10px]"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => {
                                  const newPass = prompt("Enter new password for coordinator:", "dctpassword");
                                  if (newPass) {
                                    handleResetApproval(req.id, 'approve', newPass);
                                    alert(`Successfully reset! Please hand over password "${newPass}" to ${req.name}.`);
                                  }
                                }}
                                className="py-1 px-3 bg-navy-blue text-white rounded-full font-bold border-b border-sig-green hover:opacity-90 transition cursor-pointer text-[10px]"
                              >
                                Approve & Reset
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-xs">No pending password reset requests.</div>
                    )}
                  </div>

                  {/* System Live Alerts & Stock Warnings */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Critical System Notifications</span>
                    </h3>

                    <div className="space-y-2 text-xs">
                      {/* Report Submissions alert */}
                      {reportsList.filter(r => r.status === 'submitted').length > 0 ? (
                        <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl">
                          <div>
                            <strong>{reportsList.filter(r => r.status === 'submitted').length} Pending Narrative Reports</strong>
                            <div className="text-[10px] text-amber-700">Outreach reports awaiting review.</div>
                          </div>
                          <button
                            onClick={() => setActiveTab('reports')}
                            className="py-1 px-3 bg-amber-600 text-white rounded-full font-bold hover:bg-amber-700 transition text-[10px] cursor-pointer"
                          >
                            Review
                          </button>
                        </div>
                      ) : null}

                      {/* Low stock alert */}
                      {inventoryList.filter(i => i.quantity <= 10 && i.quantity > 0).length > 0 ? (
                        <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-2xl">
                          <div>
                            <strong>{inventoryList.filter(i => i.quantity <= 10 && i.quantity > 0).length} Low Stock Supply Items</strong>
                            <div className="text-[10px] text-yellow-700">Supplies have fallen below safe inventory thresholds.</div>
                          </div>
                          <button
                            onClick={() => setActiveTab('inventory')}
                            className="py-1 px-3 bg-yellow-600 text-white rounded-full font-bold hover:bg-yellow-700 transition text-[10px] cursor-pointer"
                          >
                            View Stock
                          </button>
                        </div>
                      ) : null}

                      {/* Expiring Soon alert */}
                      {inventoryList.filter(i => {
                        if (!i.expiryDate || i.quantity === 0 || i.status === 'expired') return false;
                        const daysUntilExpiry = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                      }).length > 0 ? (
                        <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 text-orange-900 rounded-2xl">
                          <div>
                            <strong>{inventoryList.filter(i => {
                              if (!i.expiryDate || i.quantity === 0 || i.status === 'expired') return false;
                              const daysUntilExpiry = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                              return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                            }).length} Consumable Batches Expiring Soon</strong>
                            <div className="text-[10px] text-orange-700">Consumables expiring within 30 days.</div>
                          </div>
                          <button
                            onClick={() => setActiveTab('inventory')}
                            className="py-1 px-3 bg-orange-600 text-white rounded-full font-bold hover:bg-orange-700 transition text-[10px] cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      ) : null}

                      {reportsList.filter(r => r.status === 'submitted').length === 0 &&
                        inventoryList.filter(i => i.quantity <= 10 && i.quantity > 0).length === 0 &&
                        inventoryList.filter(i => {
                          if (!i.expiryDate || i.quantity === 0 || i.status === 'expired') return false;
                          const daysUntilExpiry = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                          return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                        }).length === 0 && (
                          <div className="text-center py-6 text-gray-400">All systems operational. No critical notifications.</div>
                        )}
                    </div>
                  </div>

                  {/* Upcoming Outreaches Widget */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 w-full">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-navy-blue" />
                        <h3 className="font-bold text-navy-blue text-sm">Upcoming Outreaches</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('events')}
                        className="text-[10px] text-sig-green font-bold hover:underline cursor-pointer flex items-center"
                      >
                        <span>View all</span>
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {eventsList.filter(e => e.status === 'planned').slice(0, 3).map(evt => {
                        const org = orgsList.find(o => o.id === evt.assignedOrganizationId);
                        return (
                          <div key={evt.id} className="p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl text-[11px] space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-navy-blue truncate pr-2 max-w-[130px]">{evt.name}</span>
                              <span className="bg-navy-blue text-sig-green text-[8px] font-extrabold px-1.5 py-0.5 rounded leading-none shrink-0">
                                {org ? org.abbreviation : 'CES'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-gray-300" />
                                {new Date(evt.scheduleDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="truncate max-w-[90px]">{evt.location}</span>
                            </div>
                          </div>
                        );
                      })}
                      {eventsList.filter(e => e.status === 'planned').length === 0 && (
                        <div className="text-center py-4 text-gray-400 text-[10px]">
                          No upcoming events scheduled.
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ==================================================== */}
            {/* INVENTORY TAB PANEL */}
            {/* ==================================================== */}
            {activeTab === 'inventory' && user.role === 'admin' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-navy-blue">Inventory Management</h1>
                  </div>
                  <div className="flex space-x-2 mt-4 md:mt-0">
                    <button
                      onClick={handleOpenReportPreview}
                      className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-2 px-4 rounded-full text-xs flex items-center space-x-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report PDF</span>
                    </button>
                  </div>
                </div>

                {/* Compact triggers row */}
                <div className="flex flex-wrap gap-2.5 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-200 text-navy-blue hover:bg-gray-50 transition rounded-full text-xs font-semibold shadow-sm flex items-center space-x-1.5 cursor-pointer animate-fade-in"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Catalog Item</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReleaseModalOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-200 text-navy-blue hover:bg-gray-50 transition rounded-full text-xs font-semibold shadow-sm flex items-center space-x-1.5 cursor-pointer animate-fade-in"
                  >
                    <Share className="w-3.5 h-3.5 transform rotate-180" />
                    <span>Release Item</span>
                  </button>
                  {pendingReleaseItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(true)}
                      className="px-4 py-2 bg-sig-green text-navy-blue hover:bg-sig-green/90 transition rounded-full text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer animate-fade-in"
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      <span>Release Review List ({pendingReleaseItems.length})</span>
                    </button>
                  )}
                </div>

                {/* Recommended Release Items Section */}
                {(() => {
                  const recommendedItems = inventoryList.filter(item => item.isRecommendedForRelease && item.expiryDate && item.quantity > 0);
                  if (recommendedItems.length === 0) return null;

                  // Sort by nearest expiration date
                  const sortedItems = [...recommendedItems].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
                  const displayedItems = showAllRecommended ? sortedItems : sortedItems.slice(0, 3);

                  return (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 w-full animate-fade-in">
                      <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3">
                        Recommended Release Items
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedItems.map(item => (
                          <div key={item.id} className="border border-sig-green/20 bg-sig-green/5 rounded-2xl p-4 flex flex-col justify-between hover:border-sig-green/45 transition">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-navy-blue text-xs">{item.name}</h4>
                                <span className="text-[10px] bg-white border border-sig-green/35 text-navy-blue font-bold px-2 py-0.5 rounded-full capitalize">
                                  {item.category}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 mt-2 space-y-0.5">
                                <div>Stock Level: <span className="font-bold text-navy-blue">{displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)}</span></div>
                                <div className="text-red-500 font-semibold flex items-center">
                                  <Clock className="w-3.5 h-3.5 mr-1" />
                                  Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setReleaseItemId(item.id);
                                  const optionText = `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} left ${item.expiryDate ? `(Exp: ${new Date(item.expiryDate).toLocaleDateString()})` : ''}`;
                                  setReleaseSearch(optionText);
                                  setReleaseUnitType('base');
                                  setIsReleaseModalOpen(true);
                                }}
                                className="px-3 py-1 bg-navy-blue text-white rounded-full text-[10px] font-semibold hover:bg-navy-blue/90 transition flex items-center space-x-1 cursor-pointer"
                              >
                                <span>Quick Release</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {sortedItems.length > 3 && (
                        <div className="flex justify-center pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAllRecommended(!showAllRecommended)}
                            className="px-4 py-1.5 border border-navy-blue/15 text-navy-blue hover:bg-navy-blue/5 rounded-full text-xs font-semibold transition cursor-pointer"
                          >
                            {showAllRecommended ? 'See Less' : 'See More'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Full-width Stock Table Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between w-full">
                  <div id="inventory-table-container">
                    <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">
                      Current Inventory Stock
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                            <th className="py-3 px-3">Item Details</th>
                            <th className="py-3 px-2">
                              <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer capitalize"
                                style={{ height: '36px', minWidth: '130px' }}
                              >
                                <option value="all">Category (All)</option>
                                {allCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </th>
                            <th className="py-3 px-2">
                              <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer capitalize"
                                style={{ height: '36px', minWidth: '135px' }}
                              >
                                <option value="all">Stock Level (All)</option>
                                <option value="available">Available</option>
                                <option value="low stock">Low Stock</option>
                                <option value="expired">Expired</option>
                              </select>
                            </th>
                            <th className="py-3 px-2">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs">
                          {inventoryList
                            .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
                            .filter(item => statusFilter === 'all' || item.status === statusFilter)
                            .map(item => (
                              <tr key={item.id} className={`hover:bg-gray-50/50 transition ${item.isRecommendedForRelease && item.expiryDate ? 'bg-sig-green/5 font-medium' : ''}`}>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-navy-blue flex items-center space-x-1.5">
                                    <span>{item.name}</span>
                                    {item.isRecommendedForRelease && item.expiryDate && (
                                      <span className="bg-sig-green text-navy-blue text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-sig-green/35 flex items-center space-x-0.5 animate-pulse">
                                        <Sparkles className="w-2 h-2 shrink-0" />
                                        <span>Recommended Release</span>
                                      </span>
                                    )}
                                  </div>
                                  {item.expiryDate && (
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      <span className="text-red-500 flex items-center">
                                        <Clock className="w-3 h-3 shrink-0 mr-1" />
                                        Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-gray-500 capitalize">{item.category}</td>
                                <td className="py-3 px-2 font-semibold text-navy-blue">
                                  <div>
                                    {displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)}
                                  </div>
                                  {item.groupUnit && item.groupUnit !== 'none' && item.piecesPerUnit && (
                                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                      {item.quantity} Total {formatUnit(item.quantity, item.unit)} | {item.piecesPerUnit} {formatUnit(item.piecesPerUnit, item.unit)} per {formatUnit(1, item.groupUnit)}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-2">
                                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${item.status === 'available' ? 'bg-green-50 text-green-700 border border-green-200' :
                                    item.status === 'low stock' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                      item.status === 'expired' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                        'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => {
                                        setItemEditing(item);
                                        setItemName(item.name);
                                        setItemCategory(item.category);
                                        setItemUnit(item.unit);
                                        setItemQty(item.quantity.toString());
                                        setItemExpiry(item.expiryDate || '');
                                        setItemPiecesPerUnit(item.piecesPerUnit ? item.piecesPerUnit.toString() : '');
                                        setItemGroupUnit(item.groupUnit || 'none');
                                      }}
                                      className="p-1 text-gray-400 hover:text-navy-blue transition cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteInventory(item.id)}
                                      className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {inventoryList.length === 0 && (
                            <tr>
                              <td colSpan="5" className="text-center py-6 text-gray-400">No inventory entries available.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Modal Overlay for Add Catalog Item */}
                {isAddModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-navy-blue text-sm">Add Catalog Item</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddModalOpen(false);
                            setItemName('');
                            setItemUnit('');
                            setItemQty('');
                            setItemExpiry('');
                            setItemPiecesPerUnit('');
                            setItemGroupUnit('none');
                          }}
                          className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveInventory} className="space-y-4">
                        {/* Item Name Suggestions */}
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Item Name</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={itemName}
                              onChange={(e) => {
                                setItemName(e.target.value);
                                clearFieldValError('itemName');
                                setShowItemNameSuggestions(true);
                              }}
                              onFocus={() => setShowItemNameSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowItemNameSuggestions(false), 200)}
                              placeholder="e.g. Corned Beef, Notebooks"
                              className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('itemName') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                              style={{ height: '40px' }}
                            />
                            {showItemNameSuggestions && itemName && (
                              <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                {(() => {
                                  const matching = inventoryList.filter(item =>
                                    item.name.toLowerCase().includes(itemName.toLowerCase())
                                  );
                                  const uniqueNames = [...new Set(matching.map(item => item.name))];
                                  if (uniqueNames.length === 0) return null;
                                  return (
                                    <div className="py-1">
                                      {uniqueNames.map(name => {
                                        const originalItem = matching.find(item => item.name === name);
                                        return (
                                          <div
                                            key={name}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                              setItemName(name);
                                              if (originalItem) {
                                                setItemCategory(originalItem.category);
                                                setItemUnit(originalItem.unit);
                                                if (originalItem.piecesPerUnit) {
                                                  setItemPiecesPerUnit(originalItem.piecesPerUnit.toString());
                                                }
                                                if (originalItem.groupUnit) {
                                                  setItemGroupUnit(originalItem.groupUnit);
                                                }
                                              }
                                              setShowItemNameSuggestions(false);
                                            }}
                                            className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left animate-fade-in"
                                          >
                                            {name} {originalItem?.category && <span className="text-[10px] text-gray-400 font-normal">({originalItem.category})</span>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category Searchable Dropdown */}
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Category</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={itemCategory}
                              onFocus={() => {
                                prevAddCategoryRef.current = itemCategory;
                                setItemCategory('');
                                setShowAddCategoryDropdown(true);
                              }}
                              onBlur={() => setTimeout(() => {
                                setShowAddCategoryDropdown(false);
                                setItemCategory(current => current ? current : prevAddCategoryRef.current);
                              }, 200)}
                              onChange={(e) => setItemCategory(e.target.value)}
                              placeholder="Select or type category"
                              className="w-full pl-2.5 pr-16 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                              style={{ height: '40px' }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                              <div className="pointer-events-none text-gray-400">
                                <ChevronRight className="w-4 h-4 transform rotate-90" />
                              </div>
                            </div>
                            {showAddCategoryDropdown && (
                              <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                {activeCategories
                                  .filter(cat => !itemCategory || cat.toLowerCase().includes(itemCategory.toLowerCase()))
                                  .map(cat => (
                                    <div
                                      key={cat}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setItemCategory(cat);
                                        prevAddCategoryRef.current = cat;
                                        setShowAddCategoryDropdown(false);
                                      }}
                                      className="flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                    >
                                      <span className="truncate">{cat}</span>
                                    </div>
                                  ))}
                                {activeCategories.filter(cat => !itemCategory || cat.toLowerCase().includes(itemCategory.toLowerCase())).length === 0 && (
                                  <div
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowAddCategoryDropdown(false)}
                                    className="p-2.5 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer text-left font-semibold"
                                  >
                                    Use custom: "{itemCategory}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Unit Searchable Dropdown */}
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Unit</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={itemUnit}
                              onFocus={() => {
                                prevAddUnitRef.current = itemUnit;
                                setItemUnit('');
                                setShowAddUnitDropdown(true);
                              }}
                              onBlur={() => setTimeout(() => {
                                setShowAddUnitDropdown(false);
                                setItemUnit(current => current ? current : prevAddUnitRef.current);
                              }, 200)}
                              onChange={(e) => setItemUnit(e.target.value)}
                              placeholder="Select or type unit"
                              className="w-full pl-2.5 pr-16 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                              style={{ height: '40px' }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                              {itemUnit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemUnit('');
                                    prevAddUnitRef.current = '';
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                  tabIndex={-1}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <div className="pointer-events-none text-gray-400">
                                <ChevronRight className="w-4 h-4 transform rotate-90" />
                              </div>
                            </div>
                            {showAddUnitDropdown && (
                              <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                {allUnits
                                  .filter(u => !itemUnit || u.toLowerCase().includes(itemUnit.toLowerCase()))
                                  .map(u => (
                                    <div
                                      key={u}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setItemUnit(u);
                                        prevAddUnitRef.current = u;
                                        setShowAddUnitDropdown(false);
                                      }}
                                      className="flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                    >
                                      <span className="truncate">{u}</span>
                                    </div>
                                  ))}
                                {allUnits.filter(u => !itemUnit || u.toLowerCase().includes(itemUnit.toLowerCase())).length === 0 && (
                                  <div
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowAddUnitDropdown(false)}
                                    className="p-2.5 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer text-left font-semibold"
                                  >
                                    Use custom: "{itemUnit}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Quantity</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={itemQty}
                              onFocus={() => {
                                prevAddQtyRef.current = itemQty;
                                setItemQty('');
                                setShowAddQtyDropdown(true);
                              }}
                              onBlur={() => setTimeout(() => {
                                setShowAddQtyDropdown(false);
                                setItemQty(current => current ? current : prevAddQtyRef.current);
                              }, 200)}
                              onChange={(e) => {
                                handleQtyChange(e.target.value);
                                clearFieldValError('itemQty');
                              }}
                              placeholder="Select or enter quantity"
                              className={`w-full pl-2.5 pr-8 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('itemQty') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                              style={{ height: '40px' }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                              <ChevronRight className="w-4 h-4 transform rotate-90" />
                            </div>
                            {showAddQtyDropdown && (
                              <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                {[5, 10, 20, 50, 100, 250, 500]
                                  .filter(q => !itemQty || q.toString().includes(itemQty))
                                  .map(q => (
                                    <div
                                      key={q}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setItemQty(q.toString());
                                        prevAddQtyRef.current = q.toString();
                                        clearFieldValError('itemQty');
                                        setShowAddQtyDropdown(false);
                                      }}
                                      className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
                                    >
                                      {q}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Group Stock & Pieces (if Quantity >= 12) */}
                        {(() => {
                          const parsedQty = parseInt(itemQty, 10);
                          const unitLower = (itemUnit || '').toLowerCase().trim();
                          const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(unitLower);
                          if (!isNaN(parsedQty) && parsedQty >= 12 && !isAlreadyGrouped) {
                            return (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">Group stock into (Optional)</label>
                                  <select
                                    value={itemGroupUnit}
                                    onChange={(e) => {
                                      setItemGroupUnit(e.target.value);
                                      if (e.target.value === 'none') {
                                        setItemPiecesPerUnit('');
                                      } else if (!itemPiecesPerUnit) {
                                        setItemPiecesPerUnit('12');
                                      }
                                    }}
                                    className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer"
                                    style={{ height: '40px' }}
                                  >
                                    <option value="none">Do not group (Individual pieces)</option>
                                    <option value="pack">Packs</option>
                                    <option value="box">Boxes</option>
                                    <option value="bundle">Bundles</option>
                                  </select>
                                </div>
                                {itemGroupUnit !== 'none' && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">Pieces per Pack/Box/Bundle</label>
                                      <input
                                        type="text"
                                        value={itemPiecesPerUnit}
                                        onChange={(e) => handlePiecesPerUnitChange(e.target.value)}
                                        placeholder="e.g. 12"
                                        className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                        style={{ height: '40px' }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">Remaining Pieces</label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={getRemainingPiecesText(itemQty, itemPiecesPerUnit || '12', itemGroupUnit)}
                                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-bold text-navy-blue"
                                        style={{ height: '40px' }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Pieces per Unit (if Unit is already a Pack, Box, or Bundle) */}
                        {(() => {
                          const unitLower = (itemUnit || '').toLowerCase().trim();
                          const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(unitLower);
                          if (isAlreadyGrouped) {
                            return (
                              <div className="animate-fade-in">
                                <label className="block text-gray-700 text-xs font-semibold mb-1">
                                  Pieces per Unit <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={itemPiecesPerUnit}
                                  onChange={(e) => handlePiecesPerUnitChange(e.target.value)}
                                  placeholder="e.g. 12"
                                  className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('itemPiecesPerUnit') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Expiration Date */}
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                            Expiration Date {itemCategory.toLowerCase().trim() !== 'school supplies' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="date"
                            value={itemExpiry ? itemExpiry.split('T')[0] : ''}
                            disabled={itemCategory.toLowerCase().trim() === 'school supplies'}
                            onChange={(e) => setItemExpiry(e.target.value)}
                            className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 disabled:bg-gray-100 disabled:text-gray-400 font-semibold"
                            style={{ height: '40px' }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition flex items-center justify-center cursor-pointer animate-fade-in"
                          style={{ height: '40px' }}
                        >
                          {loading ? 'Saving...' : 'Add Item'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Modal Overlay for Edit */}
                {itemEditing && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 w-full max-w-md space-y-4 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-navy-blue text-sm">Modify Catalog Item</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setItemEditing(null);
                            setItemName('');
                            setItemUnit('');
                            setItemQty('');
                            setItemExpiry('');
                            setItemPiecesPerUnit('');
                            setItemGroupUnit('none');
                          }}
                          className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveInventory} className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Item Name</label>
                          <input
                            type="text"
                            value={itemName}
                            onChange={(e) => {
                              setItemName(e.target.value);
                              clearFieldValError('itemName');
                            }}
                            placeholder="e.g. Corned Beef, Notebooks"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('itemName') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Category</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={itemCategory}
                              onFocus={() => {
                                prevEditCategoryRef.current = itemCategory;
                                setItemCategory('');
                                setShowEditCategoryDropdown(true);
                              }}
                              onBlur={() => setTimeout(() => {
                                setShowEditCategoryDropdown(false);
                                setItemCategory(current => current ? current : prevEditCategoryRef.current);
                              }, 200)}
                              onChange={(e) => setItemCategory(e.target.value)}
                              placeholder="Select or type category"
                              className="w-full pl-2.5 pr-16 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                              style={{ height: '40px' }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                              <div className="pointer-events-none text-gray-400">
                                <ChevronRight className="w-4 h-4 transform rotate-90" />
                              </div>
                            </div>
                            {showEditCategoryDropdown && (
                              <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                {activeCategories
                                  .filter(cat => !itemCategory || cat.toLowerCase().includes(itemCategory.toLowerCase()))
                                  .map(cat => (
                                    <div
                                      key={cat}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setItemCategory(cat);
                                        prevEditCategoryRef.current = cat;
                                        setShowEditCategoryDropdown(false);
                                      }}
                                      className="flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                    >
                                      <span className="truncate">{cat}</span>
                                    </div>
                                  ))}
                                {activeCategories.filter(cat => !itemCategory || cat.toLowerCase().includes(itemCategory.toLowerCase())).length === 0 && (
                                  <div
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowEditCategoryDropdown(false)}
                                    className="p-2.5 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer text-left font-semibold"
                                  >
                                    Use custom: "{itemCategory}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Unit Searchable Dropdown */}
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Unit</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={itemUnit}
                              onFocus={() => {
                                prevEditUnitRef.current = itemUnit;
                                setItemUnit('');
                                setShowEditUnitDropdown(true);
                              }}
                              onBlur={() => setTimeout(() => {
                                setShowEditUnitDropdown(false);
                                setItemUnit(current => current ? current : prevEditUnitRef.current);
                              }, 200)}
                              onChange={(e) => setItemUnit(e.target.value)}
                              placeholder="Select or type unit"
                              className="w-full pl-2.5 pr-16 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                              style={{ height: '40px' }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                              {itemUnit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemUnit('');
                                    prevEditUnitRef.current = '';
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                  tabIndex={-1}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <div className="pointer-events-none text-gray-400">
                                <ChevronRight className="w-4 h-4 transform rotate-90" />
                              </div>
                            </div>
                            {showEditUnitDropdown && (
                              <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                {allUnits
                                  .filter(u => !itemUnit || u.toLowerCase().includes(itemUnit.toLowerCase()))
                                  .map(u => (
                                    <div
                                      key={u}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setItemUnit(u);
                                        prevEditUnitRef.current = u;
                                        setShowEditUnitDropdown(false);
                                      }}
                                      className="flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                    >
                                      <span className="truncate">{u}</span>
                                    </div>
                                  ))}
                                {allUnits.filter(u => !itemUnit || u.toLowerCase().includes(itemUnit.toLowerCase())).length === 0 && (
                                  <div
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowEditUnitDropdown(false)}
                                    className="p-2.5 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer text-left font-semibold"
                                  >
                                    Use custom: "{itemUnit}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity (directly below Unit) */}
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Quantity</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={itemQty}
                              onFocus={() => {
                                prevEditQtyRef.current = itemQty;
                                setItemQty('');
                                setShowEditQtyDropdown(true);
                              }}
                              onBlur={() => setTimeout(() => {
                                setShowEditQtyDropdown(false);
                                setItemQty(current => current ? current : prevEditQtyRef.current);
                              }, 200)}
                              onChange={(e) => {
                                handleQtyChange(e.target.value);
                                clearFieldValError('itemQty');
                              }}
                              placeholder="Select or enter quantity"
                              className={`w-full pl-2.5 pr-8 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('itemQty') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                              style={{ height: '40px' }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                              <ChevronRight className="w-4 h-4 transform rotate-90" />
                            </div>
                            {showEditQtyDropdown && (
                              <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                {[5, 10, 20, 50, 100, 250, 500]
                                  .filter(q => !itemQty || q.toString().includes(itemQty))
                                  .map(q => (
                                    <div
                                      key={q}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setItemQty(q.toString());
                                        prevEditQtyRef.current = q.toString();
                                        clearFieldValError('itemQty');
                                        setShowEditQtyDropdown(false);
                                      }}
                                      className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
                                    >
                                      {q}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Group Stock & Pieces (if Quantity >= 12) */}
                        {(() => {
                          const parsedQty = parseInt(itemQty, 10);
                          const unitLower = (itemUnit || '').toLowerCase().trim();
                          const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(unitLower);
                          if (!isNaN(parsedQty) && parsedQty >= 12 && !isAlreadyGrouped) {
                            return (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">Group stock into (Optional)</label>
                                  <select
                                    value={itemGroupUnit}
                                    onChange={(e) => {
                                      setItemGroupUnit(e.target.value);
                                      if (e.target.value === 'none') {
                                        setItemPiecesPerUnit('');
                                      } else if (!itemPiecesPerUnit) {
                                        setItemPiecesPerUnit('12');
                                      }
                                    }}
                                    className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer"
                                    style={{ height: '40px' }}
                                  >
                                    <option value="none">Do not group (Individual pieces)</option>
                                    <option value="pack">Packs</option>
                                    <option value="box">Boxes</option>
                                    <option value="bundle">Bundles</option>
                                  </select>
                                </div>
                                {itemGroupUnit !== 'none' && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">Pieces per Pack/Box/Bundle</label>
                                      <input
                                        type="text"
                                        value={itemPiecesPerUnit}
                                        onChange={(e) => handlePiecesPerUnitChange(e.target.value)}
                                        placeholder="e.g. 12"
                                        className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                        style={{ height: '40px' }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">Remaining Pieces</label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={getRemainingPiecesText(itemQty, itemPiecesPerUnit || '12', itemGroupUnit)}
                                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-bold text-navy-blue"
                                        style={{ height: '40px' }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Pieces per Unit (if Unit is already a Pack, Box, or Bundle) */}
                        {(() => {
                          const unitLower = (itemUnit || '').toLowerCase().trim();
                          const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(unitLower);
                          if (isAlreadyGrouped) {
                            return (
                              <div className="animate-fade-in">
                                <label className="block text-gray-700 text-xs font-semibold mb-1">
                                  Pieces per Unit <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={itemPiecesPerUnit}
                                  onChange={(e) => handlePiecesPerUnitChange(e.target.value)}
                                  placeholder="e.g. 12"
                                  className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('itemPiecesPerUnit') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                  style={{ height: '40px' }}
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Expiration Date */}
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">
                            Expiration Date {itemCategory.toLowerCase().trim() !== 'school supplies' && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="date"
                            value={itemExpiry ? itemExpiry.split('T')[0] : ''}
                            disabled={itemCategory.toLowerCase().trim() === 'school supplies'}
                            onChange={(e) => setItemExpiry(e.target.value)}
                            className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 disabled:bg-gray-100 disabled:text-gray-400 font-semibold"
                            style={{ height: '40px' }}
                          />
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setItemEditing(null);
                              setItemName('');
                              setItemUnit('');
                              setItemQty('');
                              setItemExpiry('');
                              setItemPiecesPerUnit('');
                              setItemGroupUnit('none');
                            }}
                            className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition flex items-center justify-center cursor-pointer"
                          >
                            {loading ? 'Saving...' : 'Update Item'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Modal Overlay for Release Item */}
                {isReleaseModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-navy-blue text-sm">Release Item</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setIsReleaseModalOpen(false);
                            setReleaseItemId('');
                            setReleaseQty('');
                            setReleaseSearch('');
                            setReleaseUnitType('base');
                          }}
                          className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleAddPendingReleaseItem} className="space-y-4">
                        {/* Select Item */}
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Select Item</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={releaseSearch}
                              onFocus={() => {
                                prevReleaseSearchRef.current = releaseSearch;
                                setReleaseSearch('');
                                setShowReleaseDropdown(true);
                              }}
                              onBlur={() => setTimeout(() => {
                                setShowReleaseDropdown(false);
                                setReleaseSearch(() => {
                                  if (releaseItemId) {
                                    const item = inventoryList.find(i => i.id === releaseItemId);
                                    if (item) {
                                      return `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} left ${item.expiryDate ? `(Exp: ${new Date(item.expiryDate).toLocaleDateString()})` : ''}`;
                                    }
                                  }
                                  return '';
                                });
                              }, 200)}
                              onChange={(e) => {
                                setReleaseSearch(e.target.value);
                                if (!e.target.value) {
                                  setReleaseItemId('');
                                }
                              }}
                              placeholder="Type to search stock item..."
                              className={`w-full pl-2.5 pr-16 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('releaseItemId') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                              style={{ height: '40px' }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                              {releaseSearch && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReleaseSearch('');
                                    setReleaseItemId('');
                                    prevReleaseSearchRef.current = '';
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                  tabIndex={-1}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <div className="pointer-events-none text-gray-400">
                                <ChevronRight className="w-4 h-4 transform rotate-90" />
                              </div>
                            </div>
                            {showReleaseDropdown && (
                              <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                {inventoryList
                                  .filter(item => item.quantity > 0)
                                  .filter(item => !releaseSearch || item.name.toLowerCase().includes(releaseSearch.toLowerCase()))
                                  .map(item => {
                                    const optionText = `${item.name} (${item.category}) - ${displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)} left ${item.expiryDate ? `(Exp: ${new Date(item.expiryDate).toLocaleDateString()})` : ''}`;
                                    return (
                                      <div
                                        key={item.id}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          setReleaseItemId(item.id);
                                          setReleaseSearch(optionText);
                                          prevReleaseSearchRef.current = optionText;
                                          clearFieldValError('releaseItemId');
                                          setShowReleaseDropdown(false);
                                        }}
                                        className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
                                      >
                                        {item.name} <span className="text-gray-400 font-normal">({item.category})</span> - <span className="text-navy-blue font-bold">{displayStock(item.quantity, item.unit, item.groupUnit, item.piecesPerUnit)}</span> left {item.expiryDate ? <span className="text-red-500 font-semibold">(Exp: {new Date(item.expiryDate).toLocaleDateString()})</span> : ''}
                                      </div>
                                    );
                                  })}
                                {inventoryList.filter(item => item.quantity > 0).filter(item => item.name.toLowerCase().includes(releaseSearch.toLowerCase())).length === 0 && (
                                  <div className="p-2.5 text-xs text-gray-400 text-left font-semibold">
                                    No matching items found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantities to Release */}
                        {(() => {
                          const item = inventoryList.find(i => i.id === releaseItemId);
                          const hasGroup = item && item.groupUnit && item.groupUnit !== 'none' && item.piecesPerUnit;
                          if (hasGroup) {
                            const groupLabel = item.groupUnit === 'box' ? 'Boxes' : item.groupUnit === 'bundle' ? 'Bundles' : 'Packs';
                            return (
                              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">Quantity ({groupLabel})</label>
                                  <input
                                    type="text"
                                    value={releaseQtyGroup}
                                    onChange={(e) => {
                                      if (/^\d*$/.test(e.target.value)) {
                                        setReleaseQtyGroup(e.target.value);
                                        clearFieldValError('releaseQtyGroup');
                                      }
                                    }}
                                    placeholder="e.g. 2"
                                    className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('releaseQtyGroup') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                    style={{ height: '40px' }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-700 text-xs font-semibold mb-1">Quantity (Pieces)</label>
                                  <input
                                    type="text"
                                    value={releaseQtyPieces}
                                    onChange={(e) => {
                                      if (/^\d*$/.test(e.target.value)) {
                                        setReleaseQtyPieces(e.target.value);
                                        clearFieldValError('releaseQtyPieces');
                                      }
                                    }}
                                    placeholder="e.g. 2"
                                    className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('releaseQtyPieces') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                    style={{ height: '40px' }}
                                  />
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div className="animate-fade-in">
                              <label className="block text-gray-700 text-xs font-semibold mb-1">Quantity (Pieces)</label>
                              <input
                                type="text"
                                value={releaseQtyPieces}
                                onChange={(e) => {
                                  if (/^\d*$/.test(e.target.value)) {
                                    setReleaseQtyPieces(e.target.value);
                                    clearFieldValError('releaseQtyPieces');
                                  }
                                }}
                                placeholder="e.g. 10"
                                className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('releaseQtyPieces') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                style={{ height: '40px' }}
                              />
                            </div>
                          );
                        })()}

                        <button
                          type="submit"
                          className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition flex items-center justify-center cursor-pointer animate-fade-in"
                          style={{ height: '40px' }}
                        >
                          Add to Release List
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Modal Overlay for Release Review List */}
                {isReviewModalOpen && pendingReleaseItems.length > 0 && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-sig-green"></div>
                      <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-3">
                        <h3 className="font-bold text-navy-blue text-sm flex items-center space-x-2">
                          <span>Release Review List</span>
                          <span className="text-[10px] bg-navy-blue/10 text-navy-blue px-2 py-0.5 rounded-full font-bold">
                            {pendingReleaseItems.length}
                          </span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsReviewModalOpen(false)}
                          className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1 pt-4">
                        {pendingReleaseItems.map((pItem) => (
                          <div key={pItem.id} className="flex justify-between items-center border border-gray-50 p-2.5 rounded-xl bg-gray-50/50 hover:bg-white transition">
                            <div className="flex-1 min-w-0 pr-3">
                              <div className="font-bold text-navy-blue text-xs truncate">{pItem.name}</div>
                              <div className="text-[10px] text-gray-400 capitalize">{pItem.category}</div>
                            </div>
                            <div className="flex items-center space-x-3 shrink-0">
                              <div className="text-right">
                                <div className="text-xs font-bold text-navy-blue capitalize">
                                  {(() => {
                                    const hasGroup = pItem.groupUnit && pItem.groupUnit !== 'none' && pItem.piecesPerUnit;
                                    if (hasGroup) {
                                      const groupName = pItem.qtyGroup === 1 ? pItem.groupUnit : (pItem.groupUnit === 'box' ? 'boxes' : pItem.groupUnit === 'bundle' ? 'bundles' : 'packs');
                                      const parts = [];
                                      if (pItem.qtyGroup > 0) parts.push(`${pItem.qtyGroup} ${groupName}`);
                                      if (pItem.qtyPieces > 0) parts.push(`${pItem.qtyPieces} Pieces`);
                                      return parts.join(' + ') || '0 Pieces';
                                    }
                                    return `${pItem.qtyPieces} ${formatUnit(pItem.qtyPieces, pItem.baseUnit)}`;
                                  })()}
                                </div>
                                <div className="text-[9px] text-gray-400 font-medium">
                                  ({pItem.baseQty} Total Pieces)
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePendingItem(pItem.id)}
                                className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                title="Remove item"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex space-x-2 pt-3 border-t border-dashed border-gray-150 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPendingReleaseItems([]);
                            setIsReviewModalOpen(false);
                          }}
                          className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-gray-50 transition cursor-pointer text-center"
                        >
                          Clear List
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleConfirmRelease}
                          className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer text-center"
                        >
                          {loading ? 'Confirming...' : 'Confirm Release'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* DONORS & DONATIONS TAB PANEL */}
            {/* ==================================================== */}
            {activeTab === 'donations' && user.role === 'admin' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h1 className="text-2xl font-bold text-navy-blue">Donors & Donations Logs</h1>
                  <p className="text-gray-500 text-xs mt-1">Track contributions from DCT departments and external sponsors.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Form columns */}
                  <div className="space-y-6">
                    {/* Donor form */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-navy-blue text-sm">
                          {editingDonor ? 'Edit Donor Profile' : 'Log Donor Profile'}
                        </h3>
                        {editingDonor && (
                          <button
                            type="button"
                            onClick={handleCancelDonorEdit}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Cancel Edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <form onSubmit={handleCreateDonor} className="space-y-3">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Donor Name</label>
                          <input
                            type="text"
                            value={donorName}
                            onChange={(e) => {
                              setDonorName(e.target.value);
                              clearFieldValError('donorName');
                            }}
                            placeholder="Jollibee Tarlac, Junior High Dept"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('donorName') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Donor Type</label>
                          <select
                            value={donorType}
                            onChange={(e) => setDonorType(e.target.value)}
                            className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none font-semibold text-navy-blue"
                            style={{ height: '40px' }}
                          >
                            <option value="external_sponsor">External Sponsor</option>
                            <option value="internal_department">School Department</option>
                            <option value="individual">Individual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Email (Optional)</label>
                          <input
                            type="email"
                            value={donorEmail}
                            onChange={(e) => setDonorEmail(e.target.value)}
                            placeholder="sponsor@gmail.com"
                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none font-semibold text-navy-blue"
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Contact Phone</label>
                          <input
                            type="text"
                            value={donorPhone}
                            onChange={(e) => setDonorPhone(e.target.value)}
                            placeholder="09123456789"
                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none font-semibold text-navy-blue"
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Date of Registration</label>
                          <input
                            type="date"
                            value={donorRegistrationDate}
                            onChange={(e) => setDonorRegistrationDate(e.target.value)}
                            className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none font-semibold text-navy-blue"
                            style={{ height: '40px' }}
                          />
                        </div>

                        {editingDonor ? (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelDonorEdit}
                              className="w-full bg-gray-100 text-gray-700 rounded-full text-xs font-semibold py-2 px-4 hover:bg-gray-200 transition cursor-pointer"
                              style={{ height: '40px' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer"
                              style={{ height: '40px' }}
                            >
                              Update Profile
                            </button>
                          </div>
                        ) : (
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer pt-1"
                            style={{ height: '40px' }}
                          >
                            Save Donor
                          </button>
                        )}
                      </form>
                    </div>

                    {/* Registered Donors Directory */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 flex flex-col max-h-[500px]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-2 border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-navy-blue text-sm">
                          Registered Donors
                        </h3>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search donors..."
                            value={donorSearchQuery}
                            onChange={(e) => setDonorSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-full focus:outline-none text-navy-blue font-medium w-full sm:w-40 focus:ring-2 focus:ring-navy-blue/15"
                          />
                          <Search className="absolute left-2.5 top-2 w-3 h-3 text-gray-400" />
                        </div>
                      </div>

                      <div className="overflow-y-auto space-y-3 pr-1" style={{ maxHeight: '350px' }}>
                        {(() => {
                          const filtered = donorsList.filter(d => 
                            d.name.toLowerCase().includes(donorSearchQuery.toLowerCase()) ||
                            d.type.toLowerCase().includes(donorSearchQuery.toLowerCase()) ||
                            (d.contactEmail && d.contactEmail.toLowerCase().includes(donorSearchQuery.toLowerCase())) ||
                            (d.contactPhone && d.contactPhone.toLowerCase().includes(donorSearchQuery.toLowerCase()))
                          );

                          if (filtered.length === 0) {
                            return (
                              <div className="text-center py-6 text-gray-400 text-xs">
                                No registered donors found.
                              </div>
                            );
                          }

                          return filtered.map(d => {
                            // Format Type Badge Color
                            let badgeClass = "bg-gray-100 text-gray-600 border-gray-200/50";
                            let typeLabel = "Donor";
                            if (d.type === 'external_sponsor') {
                              badgeClass = "bg-blue-50 text-blue-600 border-blue-100";
                              typeLabel = "External Sponsor";
                            } else if (d.type === 'internal_department') {
                              badgeClass = "bg-purple-50 text-purple-600 border-purple-100";
                              typeLabel = "School Dept";
                            } else if (d.type === 'individual') {
                              badgeClass = "bg-orange-50 text-orange-600 border-orange-100";
                              typeLabel = "Individual";
                            }

                            // Format date of registration
                            let regDate = 'Unknown';
                            if (d.createdAt) {
                              try {
                                regDate = new Date(d.createdAt).toLocaleDateString();
                              } catch (e) {}
                            }

                            return (
                              <div key={d.id} className="p-3 border border-gray-100 rounded-2xl hover:bg-gray-50/50 transition flex justify-between items-start space-x-3 shadow-xs">
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-navy-blue text-xs truncate max-w-[150px]" title={d.name}>
                                      {d.name}
                                    </span>
                                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-md border font-bold ${badgeClass}`}>
                                      {typeLabel}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-500 font-medium">
                                    {d.contactEmail && <div className="truncate">{d.contactEmail}</div>}
                                    {d.contactPhone && <div>{d.contactPhone}</div>}
                                    <div className="text-[9px] text-gray-400 mt-0.5">Reg: {regDate}</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 shrink-0">
                                  <button
                                    onClick={() => handleEditDonorClick(d)}
                                    className="p-1 text-navy-blue hover:bg-navy-blue/5 rounded-lg cursor-pointer inline-flex items-center"
                                    title="Edit Donor Profile"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDonor(d.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer inline-flex items-center"
                                    title="Delete Donor Profile"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Donation batch compiler */}
                  <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">Log Donation Batch</h3>

                    <form onSubmit={handleCreateDonation} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Source Donor</label>
                          <select
                            value={donDonorId}
                            onChange={(e) => {
                              setDonDonorId(e.target.value);
                              clearFieldValError('donDonorId');
                            }}
                            className={`w-full px-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('donDonorId') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          >
                            <option value="">-- Choose Donor --</option>
                            {donorsList.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.type.replace('_', ' ')})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Donation Date</label>
                          <input
                            type="date"
                            value={donDate}
                            onChange={(e) => setDonDate(e.target.value)}
                            className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none"
                            style={{ height: '40px' }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Purpose / Outreach Drive</label>
                          <input
                            type="text"
                            value={donPurpose}
                            onChange={(e) => {
                              setDonPurpose(e.target.value);
                              clearFieldValError('donPurpose');
                            }}
                            placeholder="Pamaskong Handog, Relief Drive"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('donPurpose') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">General Description</label>
                          <input
                            type="text"
                            value={donDesc}
                            onChange={(e) => setDonDesc(e.target.value)}
                            placeholder="Hygiene soap packages donated"
                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none"
                            style={{ height: '40px' }}
                          />
                        </div>
                      </div>

                      {/* Batch items list inputs */}
                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold text-navy-blue">Items Contributed</h4>
                          <button
                            type="button"
                            onClick={handleAddDonItemLine}
                            className="text-xs font-semibold text-sig-green hover:text-navy-blue flex items-center space-x-1 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Item Line</span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          {donItems.map((item, idx) => {
                            const parsedQty = parseInt(item.quantity, 10);
                            const unitLower = (item.unit || '').toLowerCase().trim();
                            const isAlreadyGrouped = ['pack', 'packs', 'box', 'boxes', 'bundle', 'bundles'].includes(unitLower);
                            const isSchoolSupplies = (item.category || '').toLowerCase().trim() === 'school supplies';

                            return (
                              <div key={idx} className="border border-gray-150 rounded-2xl p-4 bg-gray-50/30 space-y-4 relative shadow-sm">
                                {/* Card Header */}
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                  <span className="text-xs font-bold text-navy-blue">Item #{idx + 1}</span>
                                  {donItems.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDonItemLine(idx)}
                                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Remove</span>
                                    </button>
                                  )}
                                </div>

                                {/* Form Grid Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Item Name */}
                                  <div>
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">Item Name</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => {
                                          handleDonItemChange(idx, 'name', e.target.value);
                                          clearFieldValError(`donItem-${idx}-name`);
                                          setActiveDonItemSuggestionsIdx(idx);
                                        }}
                                        onFocus={() => setActiveDonItemSuggestionsIdx(idx)}
                                        onBlur={() => setTimeout(() => setActiveDonItemSuggestionsIdx(null), 200)}
                                        placeholder="e.g. Corned Beef, Notebooks"
                                        className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes(`donItem-${idx}-name`) ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                        style={{ height: '40px' }}
                                      />
                                      {activeDonItemSuggestionsIdx === idx && item.name && (
                                        <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                          {(() => {
                                            const matching = inventoryList.filter(invItem =>
                                              invItem.name.toLowerCase().includes(item.name.toLowerCase())
                                            );
                                            const uniqueNames = [...new Set(matching.map(invItem => invItem.name))];
                                            if (uniqueNames.length === 0) return null;
                                            return (
                                              <div className="py-1">
                                                {uniqueNames.map(name => {
                                                  const originalItem = matching.find(invItem => invItem.name === name);
                                                  return (
                                                    <div
                                                      key={name}
                                                      onMouseDown={(e) => e.preventDefault()}
                                                      onClick={() => {
                                                        const list = [...donItems];
                                                        list[idx].name = name;
                                                        if (originalItem) {
                                                          list[idx].category = originalItem.category || '';
                                                          list[idx].unit = originalItem.unit || '';
                                                          list[idx].piecesPerUnit = originalItem.piecesPerUnit ? originalItem.piecesPerUnit.toString() : '';
                                                          list[idx].groupUnit = originalItem.groupUnit || 'none';
                                                        }
                                                        setDonItems(list);
                                                        clearFieldValError(`donItem-${idx}-name`);
                                                        clearFieldValError(`donItem-${idx}-quantity`);
                                                        clearFieldValError(`donItem-${idx}-expiryDate`);
                                                        clearFieldValError(`donItem-${idx}-piecesPerUnit`);
                                                        setActiveDonItemSuggestionsIdx(null);
                                                      }}
                                                      className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left animate-fade-in"
                                                    >
                                                      {name} {originalItem?.category && <span className="text-[10px] text-gray-400 font-normal">({originalItem.category})</span>}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Category Searchable Dropdown */}
                                  <div>
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">Category</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={item.category}
                                        onFocus={() => {
                                          prevDonCategoryRef.current = { idx, value: item.category };
                                          handleDonItemChange(idx, 'category', '');
                                          setActiveDonItemCategoryIdx(idx);
                                        }}
                                        onBlur={() => setTimeout(() => {
                                          setActiveDonItemCategoryIdx(null);
                                          if (prevDonCategoryRef.current.idx === idx) {
                                            const currentItem = donItems[idx];
                                            if (currentItem) {
                                              handleDonItemChange(idx, 'category', currentItem.category ? currentItem.category : prevDonCategoryRef.current.value);
                                            }
                                          }
                                        }, 200)}
                                        onChange={(e) => handleDonItemChange(idx, 'category', e.target.value)}
                                        placeholder="Select or type category"
                                        className="w-full pl-2.5 pr-16 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                        style={{ height: '40px' }}
                                      />
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                        {item.category && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDonItemChange(idx, 'category', '');
                                              prevDonCategoryRef.current = { idx, value: '' };
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                            tabIndex={-1}
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <div className="pointer-events-none text-gray-400">
                                          <ChevronRight className="w-4 h-4 transform rotate-90" />
                                        </div>
                                      </div>
                                      {activeDonItemCategoryIdx === idx && (
                                        <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                          {activeCategories
                                            .filter(cat => !item.category || cat.toLowerCase().includes(item.category.toLowerCase()))
                                            .map(cat => (
                                              <div
                                                key={cat}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                  handleDonItemChange(idx, 'category', cat);
                                                  prevDonCategoryRef.current = { idx, value: cat };
                                                  setActiveDonItemCategoryIdx(null);
                                                }}
                                                className="flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                              >
                                                <span className="truncate">{cat}</span>
                                              </div>
                                            ))}
                                          {activeCategories.filter(cat => !item.category || cat.toLowerCase().includes(item.category.toLowerCase())).length === 0 && (
                                            <div
                                              onMouseDown={(e) => e.preventDefault()}
                                              onClick={() => setActiveDonItemCategoryIdx(null)}
                                              className="p-2.5 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer text-left font-semibold"
                                            >
                                              Use custom: "{item.category}"
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Unit Searchable Dropdown */}
                                  <div>
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">Unit</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={item.unit}
                                        onFocus={() => {
                                          prevDonUnitRef.current = { idx, value: item.unit };
                                          handleDonItemChange(idx, 'unit', '');
                                          setActiveDonItemUnitIdx(idx);
                                        }}
                                        onBlur={() => setTimeout(() => {
                                          setActiveDonItemUnitIdx(null);
                                          if (prevDonUnitRef.current.idx === idx) {
                                            const currentItem = donItems[idx];
                                            if (currentItem) {
                                              handleDonItemChange(idx, 'unit', currentItem.unit ? currentItem.unit : prevDonUnitRef.current.value);
                                            }
                                          }
                                        }, 200)}
                                        onChange={(e) => handleDonItemChange(idx, 'unit', e.target.value)}
                                        placeholder="Select or type unit"
                                        className="w-full pl-2.5 pr-16 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                        style={{ height: '40px' }}
                                      />
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                        {item.unit && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDonItemChange(idx, 'unit', '');
                                              prevDonUnitRef.current = { idx, value: '' };
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                            tabIndex={-1}
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <div className="pointer-events-none text-gray-400">
                                          <ChevronRight className="w-4 h-4 transform rotate-90" />
                                        </div>
                                      </div>
                                      {activeDonItemUnitIdx === idx && (
                                        <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                          {allUnits
                                            .filter(u => !item.unit || u.toLowerCase().includes(item.unit.toLowerCase()))
                                            .map(u => (
                                              <div
                                                key={u}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                  handleDonItemChange(idx, 'unit', u);
                                                  prevDonUnitRef.current = { idx, value: u };
                                                  setActiveDonItemUnitIdx(null);
                                                }}
                                                className="flex items-center justify-between p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold capitalize text-left"
                                              >
                                                <span className="truncate">{u}</span>
                                              </div>
                                            ))}
                                          {allUnits.filter(u => !item.unit || u.toLowerCase().includes(item.unit.toLowerCase())).length === 0 && (
                                            <div
                                              onMouseDown={(e) => e.preventDefault()}
                                              onClick={() => setActiveDonItemUnitIdx(null)}
                                              className="p-2.5 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer text-left font-semibold"
                                            >
                                              Use custom: "{item.unit}"
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quantity */}
                                  <div>
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">Quantity</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={item.quantity}
                                        onFocus={() => {
                                          prevDonQtyRef.current = { idx, value: item.quantity };
                                          handleDonItemChange(idx, 'quantity', '');
                                          setActiveDonItemQtyIdx(idx);
                                        }}
                                        onBlur={() => setTimeout(() => {
                                          setActiveDonItemQtyIdx(null);
                                          if (prevDonQtyRef.current.idx === idx) {
                                            const currentItem = donItems[idx];
                                            if (currentItem) {
                                              handleDonItemChange(idx, 'quantity', currentItem.quantity ? currentItem.quantity : prevDonQtyRef.current.value);
                                            }
                                          }
                                        }, 200)}
                                        onChange={(e) => {
                                          handleDonItemChange(idx, 'quantity', e.target.value);
                                          clearFieldValError(`donItem-${idx}-quantity`);
                                        }}
                                        placeholder="Select or enter quantity"
                                        className={`w-full pl-2.5 pr-8 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes(`donItem-${idx}-quantity`) ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                        style={{ height: '40px' }}
                                      />
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronRight className="w-4 h-4 transform rotate-90" />
                                      </div>
                                      {activeDonItemQtyIdx === idx && (
                                        <div className="absolute z-60 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                          {[5, 10, 20, 50, 100, 250, 500]
                                            .filter(q => !item.quantity || q.toString().includes(item.quantity))
                                            .map(q => (
                                              <div
                                                key={q}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                  handleDonItemChange(idx, 'quantity', q.toString());
                                                  prevDonQtyRef.current = { idx, value: q.toString() };
                                                  clearFieldValError(`donItem-${idx}-quantity`);
                                                  setActiveDonItemQtyIdx(null);
                                                }}
                                                className="p-2.5 text-xs text-navy-blue hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none font-semibold text-left"
                                              >
                                                {q}
                                              </div>
                                            ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Pieces per Unit (if Unit is already pack/box/bundle) */}
                                  {isAlreadyGrouped && (
                                    <div className="animate-fade-in">
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">
                                        Pieces per Unit <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={item.piecesPerUnit}
                                        onChange={(e) => {
                                          if (/^\d*$/.test(e.target.value)) {
                                            handleDonItemChange(idx, 'piecesPerUnit', e.target.value);
                                            clearFieldValError(`donItem-${idx}-piecesPerUnit`);
                                          }
                                        }}
                                        placeholder="e.g. 12"
                                        className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes(`donItem-${idx}-piecesPerUnit`) ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                        style={{ height: '40px' }}
                                      />
                                    </div>
                                  )}

                                  {/* Group Stock Option (only if Quantity >= 12 and Unit is not pack/box/bundle) */}
                                  {!isNaN(parsedQty) && parsedQty >= 12 && !isAlreadyGrouped && (
                                    <div>
                                      <label className="block text-gray-700 text-xs font-semibold mb-1">Group stock into (Optional)</label>
                                      <select
                                        value={item.groupUnit}
                                        onChange={(e) => {
                                          const list = [...donItems];
                                          list[idx].groupUnit = e.target.value;
                                          if (e.target.value === 'none') {
                                            list[idx].piecesPerUnit = '';
                                          } else if (!list[idx].piecesPerUnit) {
                                            list[idx].piecesPerUnit = '12';
                                          }
                                          setDonItems(list);
                                        }}
                                        className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue cursor-pointer"
                                        style={{ height: '40px' }}
                                      >
                                        <option value="none">Do not group (Individual pieces)</option>
                                        <option value="pack">Packs</option>
                                        <option value="box">Boxes</option>
                                        <option value="bundle">Bundles</option>
                                      </select>
                                    </div>
                                  )}

                                  {/* Pieces per pack/box/bundle input and remaining pieces display */}
                                  {!isAlreadyGrouped && item.groupUnit && item.groupUnit !== 'none' && (
                                    <>
                                      <div>
                                        <label className="block text-gray-700 text-xs font-semibold mb-1">Pieces per Pack/Box/Bundle</label>
                                        <input
                                          type="text"
                                          value={item.piecesPerUnit}
                                          onChange={(e) => {
                                            if (/^\d*$/.test(e.target.value)) {
                                              handleDonItemChange(idx, 'piecesPerUnit', e.target.value);
                                            }
                                          }}
                                          placeholder="e.g. 12"
                                          className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                                          style={{ height: '40px' }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-gray-700 text-xs font-semibold mb-1">Remaining Pieces</label>
                                        <input
                                          type="text"
                                          readOnly
                                          value={getRemainingPiecesText(item.quantity, item.piecesPerUnit || '12', item.groupUnit)}
                                          className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-bold text-navy-blue"
                                          style={{ height: '40px' }}
                                        />
                                      </div>
                                    </>
                                  )}

                                  {/* Expiration Date */}
                                  <div>
                                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                                      Expiration Date {!isSchoolSupplies && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                      type="date"
                                      value={item.expiryDate ? item.expiryDate.split('T')[0] : ''}
                                      disabled={isSchoolSupplies}
                                      onChange={(e) => {
                                        handleDonItemChange(idx, 'expiryDate', e.target.value);
                                        clearFieldValError(`donItem-${idx}-expiryDate`);
                                      }}
                                      className={`w-full px-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 disabled:bg-gray-100 disabled:text-gray-400 font-semibold ${validationError?.fields.includes(`donItem-${idx}-expiryDate`) ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                      style={{ height: '40px' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition flex items-center justify-center cursor-pointer"
                        style={{ height: '42px' }}
                      >
                        {loading ? 'Registering Batch...' : 'Register Donation Batch'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Donations History log */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">Donation Audit History Logs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-2">Donor Source</th>
                          <th className="py-3 px-2">Purpose</th>
                          <th className="py-3 px-2">Items Array</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs">
                        {donationsList.map(d => {
                          const donor = donorsList.find(donorObj => donorObj.id === d.donorId);
                          return (
                            <tr key={d.id} className="hover:bg-gray-50/50 transition">
                              <td className="py-3 px-3 font-semibold">{new Date(d.dateOfDonation).toLocaleDateString()}</td>
                              <td className="py-3 px-2 text-navy-blue font-semibold">{donor ? donor.name : 'Unknown Donor'}</td>
                              <td className="py-3 px-2 text-gray-600 font-medium">{d.purpose}</td>
                              <td className="py-3 px-2">
                                <div className="space-y-1">
                                  {d.items.map((i, idx) => (
                                    <span key={idx} className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-lg border border-gray-200/50 mr-1.5">
                                      {i.name} ({i.quantity} {formatUnit(i.quantity, i.unit)})
                                      {i.expiryDate && <span className="text-red-500 font-bold ml-1">Exp: {new Date(i.expiryDate).toLocaleDateString()}</span>}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {donationsList.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center py-6 text-gray-400">No donations logs available.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* EVENTS & SCHEDULER TAB PANEL */}
            {/* ==================================================== */}
            {activeTab === 'events' && user.role === 'admin' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h1 className="text-2xl font-bold text-navy-blue">Event Scheduler</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Event board scheduler form */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">
                      {editingEvent ? 'Edit Outreach Event' : 'Schedule Outreach Event'}
                    </h3>

                    <form onSubmit={handleCreateEvent} className="space-y-4">
                      <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1">Event Name</label>
                        <input
                          type="text"
                          value={evtName}
                          onChange={(e) => {
                            setEvtName(e.target.value);
                            clearFieldValError('evtName');
                          }}
                          placeholder="Basic Computer Literacy, Relief Gift-Giving"
                          className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('evtName') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                          style={{ height: '40px' }}
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1">Description</label>
                        <textarea
                          value={evtDesc}
                          onChange={(e) => setEvtDesc(e.target.value)}
                          placeholder="Brief narrative of the event purpose..."
                          className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none resize-none"
                          rows="3"
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Scheduled Date & Time</label>
                          <input
                            type="datetime-local"
                            value={evtDate}
                            onChange={(e) => {
                              setEvtDate(e.target.value);
                              clearFieldValError('evtDate');
                            }}
                            className={`w-full px-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('evtDate') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Target Location</label>
                          <input
                            type="text"
                            value={evtLoc}
                            onChange={(e) => setEvtLoc(e.target.value)}
                            placeholder="Brgy. Tibag, Tarlac"
                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none"
                            style={{ height: '40px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1">Assigned Department (Co-organizer)</label>
                        <select
                          value={evtOrgId}
                          onChange={(e) => {
                            setEvtOrgId(e.target.value);
                            clearFieldValError('evtOrgId');
                          }}
                          className={`w-full px-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('evtOrgId') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                          style={{ height: '40px' }}
                        >
                          <option value="">-- Choose Assigned Org --</option>
                          {orgsList.map(o => (
                            <option key={o.id} value={o.id}>{o.name} ({o.abbreviation})</option>
                          ))}
                        </select>
                      </div>

                      {editingEvent && (
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Status</label>
                          <select
                            value={evtStatus}
                            onChange={(e) => setEvtStatus(e.target.value)}
                            className="w-full px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                            style={{ height: '40px' }}
                          >
                            <option value="planned">Planned</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition flex items-center justify-center cursor-pointer"
                        style={{ height: '42px' }}
                      >
                        {editingEvent ? 'Update Outreach Event' : 'Schedule Monthly Event'}
                      </button>

                      {editingEvent && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(null);
                            setEvtName('');
                            setEvtDesc('');
                            setEvtDate('');
                            setEvtLoc('');
                            setEvtOrgId('');
                            setEvtStatus('planned');
                          }}
                          className="w-full bg-gray-100 text-gray-700 rounded-full text-xs font-semibold py-2 px-4 hover:bg-gray-200 transition flex items-center justify-center cursor-pointer"
                          style={{ height: '42px' }}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </form>
                  </div>

                  {/* List of planned events */}
                  <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">Scheduled Events & Status Board</h3>

                    {/* Search & Month Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search events by name, description, venue..."
                          value={eventSearchQuery}
                          onChange={(e) => setEventSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-medium text-navy-blue"
                          style={{ height: '38px' }}
                        />
                      </div>
                      <div className="relative w-full sm:w-48">
                        <select
                          value={eventMonthFilter}
                          onChange={(e) => setEventMonthFilter(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                          style={{ height: '38px' }}
                        >
                          <option value="">All Months</option>
                          <option value="0">January</option>
                          <option value="1">February</option>
                          <option value="2">March</option>
                          <option value="3">April</option>
                          <option value="4">May</option>
                          <option value="5">June</option>
                          <option value="6">July</option>
                          <option value="7">August</option>
                          <option value="8">September</option>
                          <option value="9">October</option>
                          <option value="10">November</option>
                          <option value="11">December</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const filtered = eventsList.filter(evt => {
                          const matchesSearch =
                            evt.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                            (evt.description && evt.description.toLowerCase().includes(eventSearchQuery.toLowerCase())) ||
                            (evt.location && evt.location.toLowerCase().includes(eventSearchQuery.toLowerCase()));

                          let matchesMonth = true;
                          if (eventMonthFilter !== '') {
                            const dateObj = new Date(evt.scheduleDate);
                            matchesMonth = dateObj.getMonth() === parseInt(eventMonthFilter);
                          }

                          return matchesSearch && matchesMonth;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="col-span-2 text-center py-12 text-gray-400 text-xs">
                              {eventsList.length === 0 ? "No scheduled outreach events." : "No events match your search or filter criteria."}
                            </div>
                          );
                        }

                        return filtered.map(evt => {
                          const org = orgsList.find(o => o.id === evt.assignedOrganizationId);
                          return (
                            <div key={evt.id} className="border border-gray-100 p-5 rounded-2xl bg-gray-50/50 hover:bg-white hover:border-sig-green/30 transition duration-200 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${evt.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      evt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        evt.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                    }`}>
                                    {evt.status}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-navy-blue font-bold tracking-wider">{org ? org.abbreviation : 'All'}</span>
                                    <button
                                      onClick={() => handleEditClick(evt)}
                                      className="text-navy-blue hover:text-sig-green transition p-1 rounded hover:bg-gray-100 cursor-pointer"
                                      title="Edit Event"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <h4 className="font-bold text-navy-blue text-sm mb-1 leading-tight">{evt.name}</h4>
                                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{evt.description}</p>
                              </div>

                              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-[10px] text-gray-400">
                                <div className="flex items-center space-x-1.5">
                                  <Clock className="w-3.5 h-3.5 text-navy-blue" />
                                  <span>{new Date(evt.scheduleDate).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-sig-green" />
                                  <span className="truncate">{evt.location}</span>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* ORGANIZATION TAB PANEL */}
            {/* ==================================================== */}
            {activeTab === 'organization' && user.role === 'admin' && (
              <div className="space-y-6 animate-fade-in">
                {/* Organization Header Dashboard */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-navy-blue flex items-center gap-2">
                      <FolderOpen className="w-6 h-6 text-sig-green" /> Organization & Departments
                    </h1>
                    <p className="text-gray-500 text-xs mt-1">Configure academic organization profiles and track their outreach activities under the Dominican College of Tarlac (DCT).</p>
                  </div>

                  {/* Top-Right Add Buttons */}
                  {selectedOrgSubTab === 'organization' && (
                    <button
                      onClick={() => {
                        handleCancelOrgEdit();
                        setIsAddOrgModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-navy-blue text-white text-xs font-semibold px-4 py-2.5 rounded-full border-b-2 border-sig-green hover:bg-navy-blue/90 transition cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" /> Add Organization
                    </button>
                  )}
                  {selectedOrgSubTab === 'department' && (
                    <button
                      onClick={() => {
                        handleCancelOrgEdit();
                        setIsAddDeptModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-navy-blue text-white text-xs font-semibold px-4 py-2.5 rounded-full border-b-2 border-sig-green hover:bg-navy-blue/90 transition cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" /> Add Department
                    </button>
                  )}
                </div>

                {/* Sub Navigation Bar */}
                <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrgSubTab('organization');
                      handleCancelOrgEdit();
                    }}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      selectedOrgSubTab === 'organization'
                        ? 'border-sig-green text-navy-blue'
                        : 'border-transparent text-gray-400 hover:text-navy-blue'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" /> Organization
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrgSubTab('department');
                      handleCancelOrgEdit();
                    }}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      selectedOrgSubTab === 'department'
                        ? 'border-sig-green text-navy-blue'
                        : 'border-transparent text-gray-400 hover:text-navy-blue'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Department
                  </button>
                  {orgsList.filter(o => o.type === 'organization').map(org => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setSelectedOrgSubTab(org.id);
                        handleCancelOrgEdit();
                      }}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                        selectedOrgSubTab === org.id
                          ? 'border-sig-green text-navy-blue'
                          : 'border-transparent text-gray-400 hover:text-navy-blue'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sig-green" /> {org.name}
                    </button>
                  ))}
                </div>

                {/* KPI Cards for General tabs */}
                {(selectedOrgSubTab === 'organization' || selectedOrgSubTab === 'department') && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center space-x-4">
                      <div className="p-3.5 bg-navy-blue/5 rounded-2xl">
                        {selectedOrgSubTab === 'department' ? (
                          <Users className="w-5 h-5 text-navy-blue" />
                        ) : (
                          <FolderOpen className="w-5 h-5 text-navy-blue" />
                        )}
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                          Total {selectedOrgSubTab === 'department' ? 'Departments' : 'Organizations'}
                        </p>
                        <h3 className="text-xl font-bold text-navy-blue">
                          {selectedOrgSubTab === 'department' 
                            ? orgsList.filter(o => o.type === 'department' || !o.type).length 
                            : orgsList.filter(o => o.type === 'organization').length}
                        </h3>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center space-x-4">
                      <div className="p-3.5 bg-sig-green/10 rounded-2xl">
                        <Calendar className="w-5 h-5 text-sig-green" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Scheduled Events</p>
                        <h3 className="text-xl font-bold text-navy-blue">
                          {eventsList.filter(e => {
                            const o = orgsList.find(org => org.id === e.assignedOrganizationId);
                            const isMatch = selectedOrgSubTab === 'department' 
                              ? (!o || o.type === 'department' || !o.type)
                              : (o && o.type === 'organization');
                            return isMatch && e.status !== 'completed';
                          }).length} Active
                        </h3>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center space-x-4">
                      <div className="p-3.5 bg-green-50 rounded-2xl">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Completed Activities</p>
                        <h3 className="text-xl font-bold text-navy-blue">
                          {eventsList.filter(e => {
                            const o = orgsList.find(org => org.id === e.assignedOrganizationId);
                            const isMatch = selectedOrgSubTab === 'department' 
                              ? (!o || o.type === 'department' || !o.type)
                              : (o && o.type === 'organization');
                            return isMatch && e.status === 'completed';
                          }).length} Total
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                {/* Organization Tab View (Card Grid Layout) */}
                {selectedOrgSubTab === 'organization' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="font-bold text-navy-blue text-sm">Registered Organizations Directory</h3>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search organizations..."
                          value={orgSearchQuery}
                          onChange={(e) => setOrgSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none text-navy-blue font-medium w-48 sm:w-60 focus:ring-2 focus:ring-navy-blue/15"
                        />
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>

                    {(() => {
                      const filtered = orgsList.filter(o => o.type === 'organization').filter(o =>
                        o.id.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
                        o.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
                        o.abbreviation.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
                        (o.description || '').toLowerCase().includes(orgSearchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return <p className="text-center py-10 text-gray-400 text-xs font-semibold">No organizations registered yet.</p>;
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filtered.map(org => {
                            const coord = usersList.find(u => u.organizationId === org.id);
                            return (
                              <div key={org.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition duration-200">
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between">
                                    <div className="p-3 bg-sig-green/10 rounded-2xl">
                                      <Sparkles className="w-6 h-6 text-sig-green" />
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                      {org.id}
                                    </span>
                                  </div>

                                  <div>
                                    <h3 className="text-lg font-bold text-navy-blue line-clamp-1" title={org.name}>
                                      {org.name}
                                    </h3>
                                    <p className="text-xs font-semibold text-navy-blue/70 mt-0.5">
                                      Abbreviation: <span className="font-bold text-navy-blue">{org.abbreviation}</span>
                                    </p>
                                  </div>

                                  <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed h-8" title={org.description}>
                                    {org.description || 'No description provided.'}
                                  </p>

                                  <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] font-medium text-gray-600">
                                    <div>
                                      <span className="text-gray-400">Coordinator:</span>{' '}
                                      <span className="font-semibold text-navy-blue">
                                        {coord ? coord.name : 'Unassigned'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                                  <button
                                    onClick={() => setSelectedOrgSubTab(org.id)}
                                    className="px-3 py-1.5 bg-navy-blue/5 hover:bg-navy-blue/10 text-navy-blue text-xs font-bold rounded-xl transition cursor-pointer"
                                  >
                                    View Tab
                                  </button>

                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleEditOrgClick(org)}
                                      className="p-1.5 text-navy-blue hover:bg-navy-blue/5 rounded-xl cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOrg(org.id)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Department Tab View (Table Layout) */}
                {/* Department Tab View (Card Grid Layout) */}
                {selectedOrgSubTab === 'department' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="font-bold text-navy-blue text-sm">Registered Departments Directory</h3>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search departments..."
                          value={orgSearchQuery}
                          onChange={(e) => setOrgSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none text-navy-blue font-medium w-48 sm:w-60 focus:ring-2 focus:ring-navy-blue/15"
                        />
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>

                    {(() => {
                      const filtered = orgsList.filter(o => o.type === 'department' || !o.type).filter(o =>
                        o.id.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
                        o.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
                        o.abbreviation.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
                        (o.description || '').toLowerCase().includes(orgSearchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return <p className="text-center py-10 text-gray-400 text-xs font-semibold">No departments registered yet.</p>;
                      }

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {filtered.map(org => {
                            return (
                              <div
                                key={org.id}
                                onClick={() => setSelectedOrgSubTab(org.id)}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-sig-green/45 transition duration-200 cursor-pointer group space-y-4 relative"
                              >
                                {/* Logo Display */}
                                <div className="w-20 h-20 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-all duration-200">
                                  {org.logo ? (
                                    <img src={org.logo} alt={`${org.name} logo`} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xl font-bold text-navy-blue/70">{org.abbreviation}</span>
                                  )}
                                </div>

                                <div>
                                  <h4 className="text-xs font-bold text-navy-blue group-hover:text-sig-green transition-all duration-200 line-clamp-2 leading-tight px-1">
                                    {org.name}
                                  </h4>
                                  <span className="text-[10px] font-mono text-gray-400 mt-1 block uppercase">
                                    {org.abbreviation}
                                  </span>
                                </div>

                                {/* Absolute controls to edit/delete to not disrupt clicking details */}
                                <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleEditOrgClick(org)}
                                    className="p-1 text-navy-blue hover:bg-navy-blue/5 rounded-lg cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrg(org.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Specific Organization / Department Tab Panel Content */}
                {selectedOrgSubTab !== 'organization' && selectedOrgSubTab !== 'department' && (
                  (() => {
                    const selectedOrgObj = orgsList.find(o => o.id === selectedOrgSubTab);
                    if (!selectedOrgObj) return <p className="text-center py-10 text-gray-400">Profile not found.</p>;
                    
                    const isDept = selectedOrgObj.type === 'department';
                    const coord = usersList.find(u => u.uid === selectedOrgObj.coordinatorId || u.organizationId === selectedOrgObj.id);

                    // Filters for events
                    const ongoingActivities = eventsList.filter(e => e.assignedOrganizationId === selectedOrgObj.id && e.status === 'ongoing');
                    const upcomingActivities = eventsList.filter(e => e.assignedOrganizationId === selectedOrgObj.id && e.status === 'scheduled');
                    const completedActivities = eventsList.filter(e => e.assignedOrganizationId === selectedOrgObj.id && e.status === 'completed');

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Profile Details Card */}
                        <div className="lg:col-span-2 space-y-6">
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col space-y-4">
                            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                              <h3 className="font-bold text-navy-blue text-sm flex items-center gap-2">
                                {isDept ? (
                                  <Users className="w-4 h-4 text-sig-green" />
                                ) : (
                                  <Sparkles className="w-4 h-4 text-sig-green" />
                                )}
                                {isDept ? 'Department Profile Details' : 'Organization Profile Details'}
                              </h3>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    handleEditOrgClick(selectedOrgObj);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-blue/5 hover:bg-navy-blue/10 text-navy-blue text-xs font-semibold rounded-xl transition cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                                </button>
                                <button
                                  onClick={() => handleDeleteOrg(selectedOrgObj.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-xl transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete {isDept ? 'Department' : 'Organization'}
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                              {isDept && (
                                <div className="w-24 h-24 rounded-3xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                                  {selectedOrgObj.logo ? (
                                    <img src={selectedOrgObj.logo} alt={`${selectedOrgObj.name} logo`} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl font-bold text-navy-blue/70">{selectedOrgObj.abbreviation}</span>
                                  )}
                                </div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-gray-400">{isDept ? 'Department Name' : 'Organization Name'}</p>
                                  <p className="text-sm font-semibold text-navy-blue mt-0.5">{selectedOrgObj.name}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-gray-400">Abbreviation</p>
                                  <p className="text-sm font-semibold text-navy-blue mt-0.5">{selectedOrgObj.abbreviation}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-gray-400">ID / Slug Code</p>
                                  <p className="text-xs font-mono text-gray-600 mt-0.5 bg-gray-50 px-2 py-1 rounded-md w-fit">{selectedOrgObj.id}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-gray-400">{isDept ? 'Department Coordinator' : 'Assigned Coordinator'}</p>
                                  <p className="text-xs font-semibold text-navy-blue mt-0.5">
                                    {coord ? `${coord.name} (${coord.email || coord.username})` : 'No coordinator assigned'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50">
                              <p className="text-[10px] uppercase font-bold text-gray-400">Description</p>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed font-medium">
                                {selectedOrgObj.description || 'No description provided.'}
                              </p>
                            </div>
                          </div>

                          {/* Ongoing and Upcoming Activities lists */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Ongoing Activities */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                              <h4 className="font-bold text-navy-blue text-xs border-b border-gray-100 pb-2 flex items-center justify-between">
                                <span>Ongoing Activities</span>
                                <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                  {ongoingActivities.length} Active
                                </span>
                              </h4>
                              {ongoingActivities.length === 0 ? (
                                <p className="text-center py-6 text-gray-400 text-xs font-medium">No ongoing activities.</p>
                              ) : (
                                <div className="space-y-3">
                                  {ongoingActivities.map(act => (
                                    <div key={act.id} className="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center">
                                      <div>
                                        <p className="text-xs font-bold text-navy-blue">{act.title}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{act.date} • {act.location}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Upcoming Activities */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                              <h4 className="font-bold text-navy-blue text-xs border-b border-gray-100 pb-2 flex items-center justify-between">
                                <span>Upcoming Activities</span>
                                <span className="bg-blue-100 text-blue-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                  {upcomingActivities.length} Scheduled
                                </span>
                              </h4>
                              {upcomingActivities.length === 0 ? (
                                <p className="text-center py-6 text-gray-400 text-xs font-medium">No upcoming activities.</p>
                              ) : (
                                <div className="space-y-3">
                                  {upcomingActivities.map(act => (
                                    <div key={act.id} className="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center">
                                      <div>
                                        <p className="text-xs font-bold text-navy-blue">{act.title}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{act.date} • {act.location}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Return directory & quick actions */}
                        <div className="space-y-6">
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                            <div>
                              <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-2 mb-2">Outreach Actions</h3>
                              <p className="text-gray-500 text-xs">Manage outreach activities and view schedule summaries for this profile.</p>
                            </div>
                            <button
                              onClick={() => setSelectedOrgSubTab(isDept ? 'department' : 'organization')}
                              className="w-full bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              Return to {isDept ? 'Department Directory' : 'Organization Directory'}
                            </button>
                          </div>

                          {/* Quick statistics */}
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                            <h4 className="font-bold text-navy-blue text-xs border-b border-gray-100 pb-2">Outreach Statistics</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-navy-blue/5 p-3 rounded-2xl flex flex-col justify-between h-20">
                                <span className="text-[9px] font-bold text-navy-blue uppercase">Total Scheduled</span>
                                <span className="text-xl font-bold text-navy-blue">{upcomingActivities.length + ongoingActivities.length}</span>
                              </div>
                              <div className="bg-sig-green/10 p-3 rounded-2xl flex flex-col justify-between h-20">
                                <span className="text-[9px] font-bold text-navy-blue uppercase">Completed Outreach</span>
                                <span className="text-xl font-bold text-navy-blue">{completedActivities.length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* ADD / EDIT ORGANIZATION MODAL */}
                {isAddOrgModalOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-scale-up space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-navy-blue text-base">
                          {editingOrg ? 'Update Organization Profile' : 'Register New Organization'}
                        </h3>
                        <button
                          onClick={handleCancelOrgEdit}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <form onSubmit={handleCreateOrg} className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Slug ID Code (unique)</label>
                          <input
                            type="text"
                            value={orgId}
                            disabled={editingOrg !== null}
                            onChange={(e) => {
                              setOrgId(e.target.value);
                              clearFieldValError('orgId');
                            }}
                            placeholder="org-ssc, org-redcross"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${editingOrg ? 'opacity-65 bg-gray-50 border-gray-200' : validationError?.fields.includes('orgId') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Organization Name</label>
                          <input
                            type="text"
                            value={orgName}
                            onChange={(e) => {
                              setOrgName(e.target.value);
                              clearFieldValError('orgName');
                            }}
                            placeholder="Supreme Student Council"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('orgName') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Abbreviation</label>
                          <input
                            type="text"
                            value={orgAbbr}
                            onChange={(e) => {
                              setOrgAbbr(e.target.value);
                              clearFieldValError('orgAbbr');
                            }}
                            placeholder="SSC"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('orgAbbr') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Description</label>
                          <textarea
                            value={orgDesc}
                            onChange={(e) => setOrgDesc(e.target.value)}
                            placeholder="Student leadership and outreach programs"
                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-medium text-navy-blue h-20 resize-none"
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={handleCancelOrgEdit}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-full text-xs transition cursor-pointer text-center"
                            style={{ height: '40px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer flex items-center justify-center gap-1.5"
                            style={{ height: '40px' }}
                          >
                            {editingOrg ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {editingOrg ? 'Save Changes' : 'Save Organization'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* ADD / EDIT DEPARTMENT MODAL */}
                {isAddDeptModalOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-scale-up space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-navy-blue text-base">
                          {editingOrg ? 'Update Department Profile' : 'Register New Department'}
                        </h3>
                        <button
                          onClick={handleCancelOrgEdit}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <form onSubmit={handleCreateOrg} className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Slug ID Code (unique)</label>
                          <input
                            type="text"
                            value={orgId}
                            disabled={editingOrg !== null}
                            onChange={(e) => {
                              setOrgId(e.target.value);
                              clearFieldValError('orgId');
                            }}
                            placeholder="dept-cba, dept-cs"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${editingOrg ? 'opacity-65 bg-gray-50 border-gray-200' : validationError?.fields.includes('orgId') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Department Name</label>
                          <input
                            type="text"
                            value={orgName}
                            onChange={(e) => {
                              setOrgName(e.target.value);
                              clearFieldValError('orgName');
                            }}
                            placeholder="College of Business Administration"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('orgName') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Abbreviation</label>
                          <input
                            type="text"
                            value={orgAbbr}
                            onChange={(e) => {
                              setOrgAbbr(e.target.value);
                              clearFieldValError('orgAbbr');
                            }}
                            placeholder="CBA"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${validationError?.fields.includes('orgAbbr') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Description</label>
                          <textarea
                            value={orgDesc}
                            onChange={(e) => setOrgDesc(e.target.value)}
                            placeholder="IT Literacy Extension services"
                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-medium text-navy-blue h-20 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Department Logo</label>
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                              {deptLogo ? (
                                <img src={deptLogo} alt="Logo preview" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <label
                              htmlFor="dept-logo-upload"
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-navy-blue text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                              Upload Logo
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setDeptLogo(reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                              id="dept-logo-upload"
                            />
                            {deptLogo && (
                              <button
                                type="button"
                                onClick={() => setDeptLogo('')}
                                className="text-red-500 text-xs font-bold cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Assign Coordinator</label>
                          <select
                            value={deptCoordinatorId}
                            onChange={(e) => setDeptCoordinatorId(e.target.value)}
                            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue"
                            style={{ height: '40px' }}
                          >
                            <option value="">Unassigned</option>
                            {usersList.filter(u => u.role === 'department_coordinator' || u.role === 'coordinator').map(u => (
                              <option key={u.uid} value={u.uid}>
                                {u.name} ({u.username})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={handleCancelOrgEdit}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-full text-xs transition cursor-pointer text-center"
                            style={{ height: '40px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer flex items-center justify-center gap-1.5"
                            style={{ height: '40px' }}
                          >
                            {editingOrg ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {editingOrg ? 'Save Changes' : 'Save Department'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Events & Activities Tracking Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                  <div className="border-b border-gray-100 pb-3 flex flex-col md:flex-row md:items-center md:justify-between justify-start gap-4">
                    <div>
                      <h3 className="font-bold text-navy-blue text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-navy-blue" /> Events & Outreach Activities Tracker
                      </h3>
                      <p className="text-gray-400 text-[11px] font-medium mt-0.5">Filter, search, and track events status and narrative report completion states.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Department Select Filter */}
                      {selectedOrgSubTab === 'department' && (
                        <select
                          value={trackerDeptFilter}
                          onChange={(e) => setTrackerDeptFilter(e.target.value)}
                          className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-semibold text-navy-blue focus:ring-2 focus:ring-navy-blue/15"
                        >
                          <option value="all">All Departments</option>
                          {orgsList.filter(o => o.type === 'department' || !o.type).map(o => (
                            <option key={o.id} value={o.id}>{o.abbreviation}</option>
                          ))}
                        </select>
                      )}

                      {/* Organization Select Filter */}
                      {selectedOrgSubTab === 'organization' && (
                        <select
                          value={trackerDeptFilter}
                          onChange={(e) => setTrackerDeptFilter(e.target.value)}
                          className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-semibold text-navy-blue focus:ring-2 focus:ring-navy-blue/15"
                        >
                          <option value="all">All Organizations</option>
                          {orgsList.filter(o => o.type === 'organization').map(o => (
                            <option key={o.id} value={o.id}>{o.abbreviation}</option>
                          ))}
                        </select>
                      )}

                      {/* Month Filter */}
                      <select
                        value={trackerMonthFilter}
                        onChange={(e) => setTrackerMonthFilter(e.target.value)}
                        className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-semibold text-navy-blue focus:ring-2 focus:ring-navy-blue/15"
                      >
                        <option value="all">All Months</option>
                        <option value="0">January</option>
                        <option value="1">February</option>
                        <option value="2">March</option>
                        <option value="3">April</option>
                        <option value="4">May</option>
                        <option value="5">June</option>
                        <option value="6">July</option>
                        <option value="7">August</option>
                        <option value="8">September</option>
                        <option value="9">October</option>
                        <option value="10">November</option>
                        <option value="11">December</option>
                      </select>

                      {/* Search Tracker Input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search activities..."
                          value={trackerSearchQuery}
                          onChange={(e) => setTrackerSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-navy-blue font-medium w-40 sm:w-48 focus:ring-2 focus:ring-navy-blue/15"
                        />
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Activity List table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Outreach / Event Name</th>
                          <th className="py-3 px-3">{selectedOrgSubTab === 'department' ? 'Department' : 'Organization'}</th>
                          <th className="py-3 px-3">Location</th>
                          <th className="py-3 px-3">Event Status</th>
                          <th className="py-3 px-3">Narrative Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs">
                        {(() => {
                          const list = eventsList.filter(evt => {
                            const matchedDept = orgsList.find(o => o.id === evt.assignedOrganizationId);
                            if (selectedOrgSubTab === 'department') {
                              // Show only departments
                              if (matchedDept && matchedDept.type === 'organization') return false;
                              if (trackerDeptFilter !== 'all' && evt.assignedOrganizationId !== trackerDeptFilter) return false;
                            } else if (selectedOrgSubTab === 'organization') {
                              // Show only organizations
                              if (!matchedDept || matchedDept.type !== 'organization') return false;
                              if (trackerDeptFilter !== 'all' && evt.assignedOrganizationId !== trackerDeptFilter) return false;
                            } else {
                              // Specific organization tab selected - show only events assigned to it
                              if (evt.assignedOrganizationId !== selectedOrgSubTab) return false;
                            }

                            if (trackerMonthFilter !== 'all') {
                              try {
                                const m = new Date(evt.scheduleDate).getMonth();
                                if (m !== parseInt(trackerMonthFilter)) return false;
                              } catch {
                                return false;
                              }
                            }
                            if (trackerSearchQuery.trim() !== '') {
                              const q = trackerSearchQuery.toLowerCase();
                              return (
                                (evt.name || '').toLowerCase().includes(q) ||
                                (evt.description || '').toLowerCase().includes(q) ||
                                (evt.location || '').toLowerCase().includes(q)
                              );
                            }
                            return true;
                          });

                          if (list.length === 0) {
                            return (
                              <tr>
                                <td colSpan="6" className="text-center py-8 text-gray-400">No activities or outreach events match the filter parameters.</td>
                              </tr>
                            );
                          }

                          return list.map(evt => {
                            const relatedReport = reportsList.find(r => r.eventId === evt.id);
                            const matchedDept = orgsList.find(o => o.id === evt.assignedOrganizationId);

                            return (
                              <tr key={evt.id} className="hover:bg-gray-50/50 transition">
                                <td className="py-3.5 px-3 font-semibold text-navy-blue whitespace-nowrap">
                                  {new Date(evt.scheduleDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="font-semibold text-gray-800">{evt.name}</div>
                                  <div className="text-[10px] text-gray-400 max-w-[250px] truncate" title={evt.description}>
                                    {evt.description}
                                  </div>
                                </td>
                                <td className="py-3.5 px-3 font-bold text-navy-blue">
                                  {matchedDept ? matchedDept.abbreviation : 'N/A'}
                                </td>
                                <td className="py-3.5 px-3 text-gray-500 max-w-[150px] truncate" title={evt.location}>
                                  {evt.location || 'No location'}
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    evt.status === 'completed' 
                                      ? 'bg-green-50 text-green-600' 
                                      : 'bg-yellow-50 text-yellow-600'
                                  }`}>
                                    {evt.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3">
                                  {relatedReport ? (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      relatedReport.status === 'approved' 
                                        ? 'bg-sig-green/20 text-navy-blue' 
                                        : relatedReport.status === 'returned'
                                        ? 'bg-red-50 text-red-500'
                                        : relatedReport.status === 'submitted'
                                        ? 'bg-blue-50 text-blue-500'
                                        : 'bg-gray-50 text-gray-500'
                                    }`}>
                                      {relatedReport.status}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 font-semibold italic">No report filed</span>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* NARRATIVES REVIEW QUEUE TAB PANEL */}
            {/* ==================================================== */}
            {activeTab === 'reports' && user.role === 'admin' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h1 className="text-2xl font-bold text-navy-blue">Narrative Reports Queue</h1>
                  <p className="text-gray-500 text-xs mt-1">Review activity documentation submitted by department coordinators.</p>
                </div>

                {/* List panel */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">Pending Review Queue</h3>

                  <div className="space-y-3">
                    {reportsList.filter(r => r.status === 'submitted' || r.status === 'approved' || r.status === 'returned').map(rep => {
                      const event = eventsList.find(e => e.id === rep.eventId);
                      const org = orgsList.find(o => o.id === rep.organizationId);
                      const author = usersList.find(u => u.uid === rep.authorId);

                      return (
                        <div key={rep.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-sig-green/30 rounded-2xl transition duration-200">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${rep.status === 'approved' ? 'bg-green-100 text-green-800' :
                                rep.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {rep.status}
                              </span>
                              <span className="text-[10px] text-navy-blue font-bold">
                                {org ? org.name : (rep.organizationId ? 'Unknown Department' : 'CES Office')} ({org ? org.abbreviation : (rep.organizationId ? '' : 'CES')})
                              </span>
                              <span className="text-[10px] text-gray-400">·</span>
                              <span className="text-[10px] text-gray-500">{rep.semester} | {rep.academicYear}</span>
                            </div>
                            <h4 className="font-bold text-navy-blue text-sm">{event ? event.name : (rep.activityTitle || 'Outreach Activity')}</h4>
                            <div className="text-[10px] text-gray-400">Submitted by {author ? author.name : 'Coordinator'} on {new Date(rep.updatedAt).toLocaleDateString()}</div>
                          </div>

                          <div className="flex items-center space-x-2 mt-4 md:mt-0">
                            <button
                              onClick={() => { setSelectedReport(rep); setFeedbackNote(''); }}
                              className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-1.5 px-3 rounded-full text-[11px] flex items-center space-x-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Report</span>
                            </button>
                            {rep.status === 'approved' && (
                              <button
                                onClick={() => compileReportPDF(rep)}
                                className="bg-sig-green text-navy-blue font-semibold py-1.5 px-3 rounded-full text-[11px] flex items-center space-x-1 hover:opacity-90 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export PDF</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {reportsList.filter(r => r.status === 'submitted' || r.status === 'approved' || r.status === 'returned').length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-xs">No reports submitted for review yet.</div>
                    )}
                  </div>
                </div>

                {/* Inspect Report Modal */}
                {selectedReport && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl border border-gray-100 overflow-y-auto max-h-[90vh]">
                      <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
                        <div>
                          <span className="text-[10px] text-sig-green font-bold uppercase tracking-wider">Report Assessment</span>
                          <h3 className="text-lg font-bold text-navy-blue">
                            {eventsList.find(e => e.id === selectedReport.eventId)?.name || selectedReport.activityTitle || 'Outreach Narrative'}
                          </h3>
                        </div>
                        <button
                          onClick={() => setSelectedReport(null)}
                          className="text-gray-400 hover:text-gray-600 font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Report Details layout */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-gray-50 p-4 rounded-2xl bg-gray-50/50 text-xs text-gray-600 mb-4">
                        <div>
                          <strong>Academic Year:</strong>
                          <div>{selectedReport.academicYear}</div>
                        </div>
                        <div>
                          <strong>Semester:</strong>
                          <div>{selectedReport.semester}</div>
                        </div>
                        <div>
                          <strong>Assigned Org:</strong>
                          <div>{orgsList.find(o => o.id === selectedReport.organizationId)?.name || (selectedReport.organizationId ? 'Unknown' : 'CES Office')}</div>
                        </div>
                        <div>
                          <strong>Activity Category:</strong>
                          <div className="capitalize">{selectedReport.type?.replace('_', ' ')}</div>
                        </div>
                        {selectedReport.activityDate && (
                          <div>
                            <strong>Activity Date:</strong>
                            <div>{new Date(selectedReport.activityDate).toLocaleDateString()}</div>
                          </div>
                        )}
                        {selectedReport.location && (
                          <div className="col-span-1 md:col-span-2">
                            <strong>Venue / Location:</strong>
                            <div className="truncate">{selectedReport.location}</div>
                          </div>
                        )}
                        {selectedReport.beneficiaries && (
                          <div className="col-span-1 md:col-span-2">
                            <strong>Target Beneficiaries:</strong>
                            <div className="truncate">{selectedReport.beneficiaries}</div>
                          </div>
                        )}
                      </div>

                      {/* Narrative document */}
                      <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-inner max-h-[300px] overflow-y-auto prose prose-sm text-xs mb-4 text-gray-700">
                        <div dangerouslySetInnerHTML={{ __html: selectedReport.narrative }} />
                      </div>

                      {/* Photos Carousel Grid */}
                      {selectedReport.photos && selectedReport.photos.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <h4 className="text-xs font-bold text-navy-blue">Attached Photographic Evidence (Max 10)</h4>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {selectedReport.photos.map((p, idx) => (
                              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group bg-black">
                                <img src={p.url} className="w-full h-full object-cover group-hover:scale-105 transition" alt="outreach" />
                                <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-1 text-[8px] text-white">
                                  Image {idx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review Actions Panel */}
                      <div className="border-t border-gray-100 pt-4 space-y-4">
                        {selectedReport.status === 'submitted' && (
                          <>
                            <div>
                              <label className="block text-gray-700 text-xs font-semibold mb-1">Feedback/Revision Instructions (required if returning)</label>
                              <textarea
                                value={feedbackNote}
                                onChange={(e) => setFeedbackNote(e.target.value)}
                                placeholder="Add clear feedback details to guide the coordinator through revisions..."
                                className="w-full p-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none"
                                rows="2"
                              ></textarea>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleReviewReport('returned')}
                                className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-full font-bold text-xs py-2 cursor-pointer"
                              >
                                Return with Feedback
                              </button>
                              <button
                                onClick={() => handleReviewReport('approved')}
                                className="flex-1 bg-navy-blue text-white rounded-full font-bold text-xs py-2 border-b-2 border-sig-green hover:bg-navy-blue/95 cursor-pointer"
                              >
                                Approve & Lock
                              </button>
                            </div>
                          </>
                        )}
                        {selectedReport.status === 'approved' && (
                          <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-200 text-xs">
                            <Check className="w-4.5 h-4.5 shrink-0 bg-green-600 text-white rounded-full p-0.5" />
                            <span>This report has been reviewed, approved, and locked. Editing is disabled.</span>
                          </div>
                        )}
                        {selectedReport.status === 'returned' && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
                              <Clock className="w-4.5 h-4.5 shrink-0 text-amber-600" />
                              <span>This report has been returned to the coordinator for revisions.</span>
                            </div>
                            <div className="text-xs border border-gray-100 p-3 rounded-xl bg-gray-50 text-gray-600">
                              <strong>Active Feedback Note:</strong>
                              <p className="mt-1 font-medium">{selectedReport.adminFeedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* USER ACCOUNT MANAGEMENT TAB PANEL */}
            {/* ==================================================== */}
            {activeTab === 'accounts' && user.role === 'admin' && (
              <div className="space-y-6 animate-fade-in w-full">
                {/* Header section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-navy-blue">User Account Management</h1>
                    <p className="text-gray-500 text-xs mt-1">Establish, modify, suspend, or delete administrator and coordinator credentials.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Creator/Editor form */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit space-y-4">
                    <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3">
                      {editingUser ? 'Modify User Account' : 'Create User Account'}
                    </h3>

                    <form onSubmit={handleSaveUser} className="space-y-3">
                      <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1">Role</label>
                        <select
                          value={coordRole}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            setCoordRole(newRole);
                            if (newRole !== 'department_coordinator') {
                              setCoordOrgId('');
                            }
                            setCoordErrors(prev => {
                              const copy = { ...prev };
                              delete copy.coordRole;
                              if (newRole !== 'department_coordinator') {
                                delete copy.coordOrgId;
                              }
                              return copy;
                            });
                          }}
                          className={`w-full px-2 text-xs bg-white border rounded-xl focus:outline-none ${coordErrors.coordRole ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                          style={{ height: '40px' }}
                        >
                          <option value="admin">Admin</option>
                          <option value="office_coordinator">Office Coordinator</option>
                          <option value="department_coordinator">Other Department Coordinator</option>
                        </select>
                        {coordErrors.coordRole && (
                          <p className="text-red-500 text-[10px] mt-1 font-semibold">{coordErrors.coordRole}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">First Name</label>
                          <input
                            type="text"
                            value={coordFirstName}
                            onChange={(e) => {
                              setCoordFirstName(e.target.value);
                              if (coordErrors.coordFirstName) {
                                setCoordErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy.coordFirstName;
                                  return copy;
                                });
                              }
                            }}
                            placeholder="e.g. Alan"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${coordErrors.coordFirstName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                          {coordErrors.coordFirstName && (
                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{coordErrors.coordFirstName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Last Name</label>
                          <input
                            type="text"
                            value={coordLastName}
                            onChange={(e) => {
                              setCoordLastName(e.target.value);
                              if (coordErrors.coordLastName) {
                                setCoordErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy.coordLastName;
                                  return copy;
                                });
                              }
                            }}
                            placeholder="e.g. Turing"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${coordErrors.coordLastName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                          {coordErrors.coordLastName && (
                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{coordErrors.coordLastName}</p>
                          )}
                        </div>
                      </div>

                      {coordRole === 'department_coordinator' && (
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Assigned Department</label>
                          <select
                            value={coordOrgId}
                            onChange={(e) => {
                              setCoordOrgId(e.target.value);
                              if (coordErrors.coordOrgId) {
                                setCoordErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy.coordOrgId;
                                  return copy;
                                });
                              }
                            }}
                            className={`w-full px-2 text-xs bg-white border rounded-xl focus:outline-none ${coordErrors.coordOrgId ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          >
                            <option value="">-- Choose Org --</option>
                            {orgsList.map(o => (
                              <option key={o.id} value={o.id}>{o.name} ({o.abbreviation})</option>
                            ))}
                          </select>
                          {coordErrors.coordOrgId && (
                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{coordErrors.coordOrgId}</p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1">Email</label>
                        <input
                          type="email"
                          value={coordEmail}
                          onChange={(e) => {
                            setCoordEmail(e.target.value);
                            if (coordErrors.coordEmail) {
                              setCoordErrors(prev => {
                                const copy = { ...prev };
                                delete copy.coordEmail;
                                return copy;
                              });
                            }
                          }}
                          placeholder="turing@dct.edu.ph"
                          className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${coordErrors.coordEmail ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                          style={{ height: '40px' }}
                        />
                        {coordErrors.coordEmail && (
                          <p className="text-red-500 text-[10px] mt-1 font-semibold">{coordErrors.coordEmail}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1">
                          {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                        </label>
                        <input
                          type="password"
                          value={coordPassword}
                          onChange={(e) => {
                            setCoordPassword(e.target.value);
                            if (coordErrors.coordPassword) {
                              setCoordErrors(prev => {
                                const copy = { ...prev };
                                delete copy.coordPassword;
                                return copy;
                              });
                            }
                          }}
                          placeholder="••••••••"
                          className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${coordErrors.coordPassword ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                          style={{ height: '40px' }}
                        />
                        {coordErrors.coordPassword && (
                          <p className="text-red-500 text-[10px] mt-1 font-semibold">{coordErrors.coordPassword}</p>
                        )}
                      </div>

                      {(!editingUser || coordPassword.length > 0) && (
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Confirm Password</label>
                          <input
                            type="password"
                            value={coordConfirmPassword}
                            onChange={(e) => {
                              setCoordConfirmPassword(e.target.value);
                              if (coordErrors.coordConfirmPassword) {
                                setCoordErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy.coordConfirmPassword;
                                  return copy;
                                });
                              }
                            }}
                            placeholder="••••••••"
                            className={`w-full p-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue ${coordErrors.coordConfirmPassword ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                            style={{ height: '40px' }}
                          />
                          {coordErrors.coordConfirmPassword && (
                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{coordErrors.coordConfirmPassword}</p>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2 pt-2">
                        {editingUser && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(null);
                              setCoordName('');
                              setCoordFirstName('');
                              setCoordLastName('');
                              setCoordEmail('');
                              setCoordUsername('');
                              setCoordPassword('');
                              setCoordConfirmPassword('');
                              setCoordOrgId('');
                              setCoordRole('department_coordinator');
                              setCoordErrors({});
                            }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-navy-blue rounded-full text-xs font-semibold py-2 px-4 transition cursor-pointer"
                            style={{ height: '40px' }}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-2 bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-4 border-b-2 border-sig-green hover:bg-navy-blue/95 transition flex items-center justify-center cursor-pointer"
                          style={{ height: '40px' }}
                        >
                          {editingUser ? 'Update Account' : 'Create User Account'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Data Table list */}
                  <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">
                      User Accounts Directory
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                            <th className="py-3 px-3">Full Name</th>
                            <th className="py-3 px-2">Role</th>
                            <th className="py-3 px-2">Assigned Org</th>
                            <th className="py-3 px-2">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs">
                          {usersList.map(u => {
                            const org = orgsList.find(o => o.id === u.organizationId);
                            const isSelf = u.uid === user.uid;
                            return (
                              <tr key={u.uid} className="hover:bg-gray-50/50 transition">
                                <td className="py-3 px-3 font-semibold text-navy-blue">
                                  <div>{u.name} {isSelf && <span className="text-[9px] bg-navy-blue/10 text-navy-blue px-1.5 py-0.2 rounded font-bold ml-1">You</span>}</div>
                                  <span className="text-[10px] text-gray-400 font-normal">{u.email}</span>
                                </td>
                                <td className="py-3 px-2 text-gray-500 capitalize">{u.role.replace('_', ' ')}</td>
                                <td className="py-3 px-2 font-medium">{org ? org.abbreviation : u.role === 'admin' ? 'System Admin' : 'CES Office'}</td>
                                <td className="py-3 px-2">
                                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${u.status === 'inactive' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                                    }`}>
                                    {u.status || 'active'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUser(u);
                                      const nameParts = (u.name || '').trim().split(' ');
                                      let first = '';
                                      let last = '';
                                      if (nameParts.length > 1) {
                                        last = nameParts.pop();
                                        first = nameParts.join(' ');
                                      } else {
                                        first = u.name || '';
                                        last = '';
                                      }
                                      setCoordFirstName(first);
                                      setCoordLastName(last);
                                      setCoordName(u.name || '');
                                      setCoordEmail(u.email || '');
                                      setCoordUsername(u.username || '');
                                      setCoordPassword('');
                                      setCoordConfirmPassword('');
                                      setCoordRole(u.role);
                                      setCoordOrgId(u.organizationId || '');
                                      setCoordErrors({});
                                    }}
                                    className="py-1 px-2.5 rounded-full text-[10px] font-semibold border bg-white border-gray-200 text-navy-blue hover:bg-gray-50 transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSelf}
                                    onClick={() => handleToggleStatus(u.uid, u.status || 'active')}
                                    className={`py-1 px-2.5 rounded-full text-[10px] font-semibold border transition cursor-pointer ${isSelf ? 'opacity-50 cursor-not-allowed' :
                                      u.status === 'inactive'
                                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                        : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                      }`}
                                  >
                                    {u.status === 'inactive' ? 'Activate' : 'Deactivate'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSelf}
                                    onClick={() => handleDeleteUser(u)}
                                    className={`py-1 px-2.5 rounded-full text-[10px] font-semibold border transition cursor-pointer ${isSelf ? 'opacity-50 cursor-not-allowed' : 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                                      }`}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>


        </div>
      </main>


      {/* ==================================================== */}
      {/* HIDDEN CES OFFICIAL PDF TEMPLATE CONVERTER */}
      {/* ==================================================== */}
      {exportingReport && (
        <div className="absolute top-[-9999px] left-[-9999px]">
          <div
            id="report-pdf-target"
            className="w-[800px] bg-white p-12 text-gray-900 font-poppins relative"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Header Block */}
            <div className="text-center border-b-2 border-sig-green pb-4 mb-6">
              <h2 className="text-xl font-bold text-navy-blue tracking-wide">DOMINICAN COLLEGE OF TARLAC, INC.</h2>
              <h3 className="text-sm font-semibold text-gray-700">Community Extension & Services (CES) Office</h3>
              <p className="text-[10px] text-gray-400">Tarlac, Philippines · Official Document Archive</p>
            </div>

            {/* Document Details Metadata */}
            <div className="grid grid-cols-2 gap-4 border border-gray-100 p-4 rounded-xl bg-gray-50/50 text-xs mb-6">
              <div>
                <strong className="text-navy-blue">Extension Outreach Program:</strong>
                <p className="text-sm font-bold text-gray-800">{eventsList.find(e => e.id === exportingReport.eventId)?.name || exportingReport.activityTitle || 'Outreach'}</p>
              </div>
              <div>
                <strong className="text-navy-blue">Academic Schedule:</strong>
                <p className="text-xs font-semibold text-gray-800">{exportingReport.semester} | AY {exportingReport.academicYear}</p>
              </div>
              <div>
                <strong className="text-navy-blue">Department / Organization:</strong>
                <p className="text-xs font-semibold text-gray-800">{orgsList.find(o => o.id === exportingReport.organizationId)?.name || (exportingReport.organizationId ? 'Unknown' : 'CES Office')}</p>
              </div>
              <div>
                <strong className="text-navy-blue">Activity Details:</strong>
                <p className="text-xs font-semibold text-gray-800">
                  {exportingReport.activityDate ? new Date(exportingReport.activityDate).toLocaleDateString() : ''} 
                  {exportingReport.location ? ` @ ${exportingReport.location}` : ''}
                </p>
              </div>
            </div>

            {/* Narrative text description */}
            <div className="space-y-4 text-xs leading-relaxed text-gray-800 border-b border-gray-100 pb-6 mb-6">
              <h4 className="text-sm font-bold text-navy-blue mb-2">Activity Description Narrative</h4>
              <div
                className="prose prose-sm text-xs max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: exportingReport.narrative }}
              />
            </div>

            {/* Photos collage */}
            {exportingReport.photos && exportingReport.photos.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-navy-blue mb-3">Photographic Documentation</h4>
                <div className="grid grid-cols-2 gap-3">
                  {exportingReport.photos.map((p, idx) => (
                    <div key={idx} className="border border-gray-100 p-1.5 rounded-lg bg-gray-50">
                      <img src={p.url} className="w-full h-44 object-cover rounded" alt="evidence" />
                      <p className="text-center text-[9px] text-gray-400 font-semibold mt-1">Photo Documentation {idx + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CHRONOLOGICAL REPORT HISTORY PREVIEW OVERLAY */}
      {/* ==================================================== */}
      {showReportPreview && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-navy-blue/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-3xl w-full flex flex-col space-y-4 max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-navy-blue text-sm uppercase tracking-wide">
                Inventory History Report Preview
              </h3>
              <button
                type="button"
                onClick={() => setShowReportPreview(false)}
                className="text-gray-400 hover:text-navy-blue transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-[250px] max-h-[50vh] border border-gray-100 rounded-2xl p-2 bg-gray-50/30">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {txHistory.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-gray-50/50 transition">
                      <td className="py-2.5 px-3 font-semibold text-gray-600">
                        {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${tx.action === 'added' ? 'bg-green-50 text-green-700 border border-green-200' :
                          tx.action === 'released' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                          {tx.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-navy-blue">{tx.itemName}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{tx.quantity}</td>
                      <td className="py-2.5 px-3 text-gray-500 capitalize">{tx.unit}</td>
                      <td className="py-2.5 px-3 text-gray-400 font-medium truncate max-w-[150px]" title={tx.details}>
                        {tx.details || '-'}
                      </td>
                    </tr>
                  ))}
                  {txHistory.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">
                        No transaction history recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowReportPreview(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-full text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={handleConfirmDownloadPDF}
                className="flex-1 bg-navy-blue text-white rounded-full text-xs font-semibold py-2.5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer"
              >
                Confirm Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* HIDDEN INVENTORY HISTORY PDF PRINT TARGET */}
      {/* ==================================================== */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div
          id="inventory-history-pdf-target"
          className="w-[800px] bg-white p-12 text-gray-900 font-poppins relative"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Header Block */}
          <div className="text-center border-b-2 border-sig-green pb-4 mb-6">
            <h2 className="text-xl font-bold text-navy-blue tracking-wide">DOMINICAN COLLEGE OF TARLAC, INC.</h2>
            <h3 className="text-sm font-semibold text-gray-700">Community Extension & Services (CES) Office</h3>
            <p className="text-[10px] text-gray-400">Tarlac, Philippines · Official Document Archive</p>
          </div>

          <h3 className="text-lg font-bold text-navy-blue text-center mb-6 uppercase tracking-wider">
            Chronological Inventory Transaction History Log
          </h3>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-navy-blue bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {txHistory.map((tx, idx) => (
                <tr key={tx.id || idx} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-semibold text-gray-600">
                    {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 capitalize">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${tx.action === 'added' ? 'bg-green-100 text-green-800 border border-green-200' :
                      tx.action === 'released' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                      {tx.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-navy-blue">{tx.itemName}</td>
                  <td className="py-2.5 px-3 text-right font-bold">{tx.quantity}</td>
                  <td className="py-2.5 px-3 capitalize">{tx.unit}</td>
                  <td className="py-2.5 px-3 text-gray-500 font-medium">{tx.details || '-'}</td>
                </tr>
              ))}
              {txHistory.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-400">
                    No transaction records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
