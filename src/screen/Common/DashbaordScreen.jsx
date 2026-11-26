import axios from 'axios';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Loader from '../../util/Loader';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebaseConfig';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { getAuthToken } from '../../services/SecureTokenStorage';


import {
  makeTelnyxCall,
  endTelnyxCall,
} from '../../services/telnyxCallService';
import FAQModal from '../../util/FAQModal';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// MAIN COMPONENT
// ============================================================
const DashbaordScreen = ({ navigation }) => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  const [showActivitySearch, setShowActivitySearch] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [contacts, setContacts] = useState([]);

  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMoreContacts, setIsLoadingMoreContacts] = useState(false);

  const [contactsCurrentPage, setContactsCurrentPage] = useState(1);
  const [contactsHasMorePages, setContactsHasMorePages] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [activitySort, setActivitySort] = useState('newest');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [clearingMessages, setClearingMessages] = useState(false);

  const [contactModalTab, setContactModalTab] = useState('contacts');

  // Tab and navigation states
  const [activityTimeFilter, setActivityTimeFilter] = useState('all');
  const activityTimeFilters = [
    { id: 'all', label: 'All activity' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last24hours', label: 'Last 24 hours' },
    { id: 'last7days', label: 'Last 7 days' },
    { id: 'thisweek', label: 'This week' },
    { id: 'last30days', label: 'Last 30 days' },
    { id: 'thismonth', label: 'This month' },
    { id: 'lastmonth', label: 'Last month' },
    { id: 'lastyear', label: 'Last year' },
  ];
  const [activityData, setActivityData] = useState([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [avatarError, setAvatarError] = useState({});

  const [activeTab, setActiveTab] = useState('directory');
  const [showSideNav, setShowSideNav] = useState(false);
  const [showMessageSidebar, setShowMessageSidebar] = useState(false);

  // Filter states for Directory
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('recent');
  const [showUnread, setShowUnread] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // User list states
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSubType, setSelectedSubType] = useState('');

  const [userList, setUserList] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);

  // Activity Feed states
  const [activityFilter, setActivityFilter] = useState('all');

  const [activitySearch, setActivitySearch] = useState('');
  const [showActivityTimeModal, setShowActivityTimeModal] = useState(false);

  // Activity Quick Filter states
  const [showActivityQuickFilterModal, setShowActivityQuickFilterModal] =
    useState(false);
  const [activityQuickSearch, setActivityQuickSearch] = useState('');
  const [activityReadStatus, setActivityReadStatus] = useState('all');
  const [activityRole, setActivityRole] = useState('all');
  const [activityThread, setActivityThread] = useState('all');
  const [activityChannel, setActivityChannel] = useState('all');
  const [activitySortBy, setActivitySortBy] = useState('recent');
  const [activityMinUnread, setActivityMinUnread] = useState('0');

  const [totalReadCount, setTotalReadCount] = useState(0);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Dropdown states for quick filter
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Message sidebar states
  const [messages, setMessages] = useState([]);

  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  // Modal management states
  const [showDialModal, setShowDialModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showContactFilter, setShowContactFilter] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showAddSignatureModal, setShowAddSignatureModal] = useState(false);
  const [pendingModal, setPendingModal] = useState(null);
  const [parentModal, setParentModal] = useState(null);

  const [conversationSearch, setConversationSearch] = useState('');

  // Dial modal states
  const [dialTab, setDialTab] = useState('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('+1');

  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countryCodes, setCountryCodes] = useState([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [selectedCountryName, setSelectedCountryName] =
    useState('United States');
  const [selectedCountryCode, setSelectedCountryCode] = useState('US');

  // Contact filter states
  const [contactSearch, setContactSearch] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [countrySearch, setCountrySearch] = useState('');

  // Email states
  const [emailTo, setEmailTo] = useState('');
  const [emailFrom, setEmailFrrom] = useState('user@leafcom.com');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedSignature, setSelectedSignature] = useState('');
  const [signatures, setSignatures] = useState([]);
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureContent, setSignatureContent] = useState('');

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [showInCallModal, setShowInCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [callPhoneNumber, setCallPhoneNumber] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const [isWPCalling, setIsWPCalling] = useState(false);

  const [isSMSCalling, setIsSMSCalling] = useState(false);

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [showTutorialModal, setShowTutorialModal] = useState(false);

  const [deletingMessageId, setDeletingMessageId] = useState(null);

  const TUTORIAL_PDF_URL =
    'https://leafnet.us/assets/sample-documents/LEAFCOM-Training-Tutorial.pdf';

  const [profileInfo, setProfileInfo] = useState({
    user_name: '',
    email: '',
    profile_picture: '',
  });

  // Email history
  const [emailHistory, setEmailHistory] = useState([
    {
      id: '1',
      to: 'client@example.com',
      subject: 'Project Update',
      date: '2024-01-15',
      status: 'Sent',
    },
    {
      id: '2',
      to: 'team@example.com',
      subject: 'Meeting Notes',
      date: '2024-01-14',
      status: 'Draft',
    },
    {
      id: '3',
      to: 'john@example.com',
      subject: 'Proposal Review',
      date: '2024-01-13',
      status: 'Sent',
    },
  ]);
  const [showEmailHistory, setShowEmailHistory] = useState(false);

  // Communication filter for email section
  const [communicationFilter, setCommunicationFilter] = useState('email');

  // Dropdown options for quick filter
  const readStatusOptions = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread Only' },
    { id: 'read', label: 'Read Only' },
  ];

  // const roleOptions = [
  //   { id: 'all', label: 'All Roles' },
  //   { id: 'admin', label: 'Admin' },
  //   { id: 'client', label: 'Client' },
  //   { id: 'team', label: 'Team' },
  //   { id: 'system_admin', label: 'System Admin' },
  // ];

  const roleOptions = useMemo(() => {
    const roles = new Set();

    activityData.forEach(item => {
      const role = (item.userTag || '').trim();

      if (role) {
        roles.add(role);
      }
    });

    return [
      {
        id: 'all',
        label: 'All Roles',
      },
      ...Array.from(roles).map(role => ({
        id: role,
        label: role,
      })),
    ];
  }, [activityData]);

  const threadOptions = [
    { id: 'all', label: 'All Threads' },
    { id: 'main', label: 'Direct' },
    { id: 'group', label: 'Group' },
    // { id: 'reply', label: 'Replies' },
  ];

  const channelOptions = [
    { id: 'all', label: 'All Channels' },
    { id: 'whatsapp', label: 'Whatsapp' },
    { id: 'email', label: 'Email' },
    { id: 'sms', label: 'SMS' },
    { id: 'inapp', label: 'Internal' },
  ];

  const sortOptions = [
    { id: 'most_unread', label: 'Unread First' },
    { id: 'recent', label: 'Recent First' },
  ];

  const minUnreadOptions = [
    { id: '0', label: 'Any' },
    { id: '1', label: '1+' },
    { id: '3', label: '3+' },
    { id: '5', label: '5+' },
    { id: '10', label: '10+' },
  ];

  // ============================================================
  // ACTIVITY TIME FILTER OPTIONS
  // ============================================================

  // ============================================================
  // ANIMATION FOR SIDEBAR
  // ============================================================
  const sidebarAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    if (showMessageSidebar) {
      Animated.spring(sidebarAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(sidebarAnim, {
        toValue: SCREEN_WIDTH,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [showMessageSidebar]);

  useEffect(() => {
    fetchProfileInfo();
    fetchUsers(1, false);
    fetchContacts(1, false);
    fetchUserTypes();
  }, []);

  useEffect(() => {
    fetchSignatures();
  }, []);

  // useEffect(() => {
  //   fetchContacts(1, false);
  // }, []);

  const handleOpenTutorial = async () => {
    const pdfUrl =
      'https://leafnet.us/assets/sample-documents/LEAFCOM-Training-Tutorial.pdf';

    try {
      await Linking.openURL(pdfUrl);
    } catch (error) {
      console.log('Tutorial PDF Error:', error);
      Alert.alert('Error', 'Unable to open the tutorial PDF.');
    }
  };

  useEffect(() => {
    let unsubscribeUser = null;
    let unsubscribeGroup = null;

    const loadFirebaseNotifications = async () => {
      try {
        const userId = 2467;

        if (!userId) {
          console.log('User ID not found');
          setActivityData([]);
          setIsLoadingActivity(false);
          return;
        }

        // ============================================
        // FIREBASE REFERENCES
        // ============================================

        const userNotificationRef = ref(
          database,
          `leafnet_notifications/User_${userId}_2`,
        );

        const groupNotificationRef = ref(
          database,
          `leafnet_notifications/Group_2_${userId}`,
        );

        let userNotifications = {};
        let groupNotifications = {};

        let userLoaded = false;
        let groupLoaded = false;

        // ============================================
        // PROCESS USER + GROUP NOTIFICATIONS
        // ============================================

        const processNotifications = () => {
          // Wait until both Firebase listeners return data.
          if (!userLoaded || !groupLoaded) {
            return;
          }

          try {
            const allRecords = [
              ...Object.entries(userNotifications || {}).map(
                ([firebaseKey, item]) => ({
                  ...item,
                  firebaseKey,
                  source: 'user',
                }),
              ),

              ...Object.entries(groupNotifications || {}).map(
                ([firebaseKey, item]) => ({
                  ...item,
                  firebaseKey,
                  source: 'group',
                }),
              ),
            ];

            const groupedNotifications = {};

            // ============================================
            // GROUP MESSAGES USER-WISE
            // ============================================

            allRecords.forEach(item => {
              if (!item) {
                return;
              }

              const senderId =
                item.sender_id != null ? String(item.sender_id) : '';

              // A sender ID is required for user-wise grouping.
              if (!senderId) {
                return;
              }

              const isGroup = item.source === 'group';

              const groupName = item.group_name || 'Unknown Group';

              // For normal notifications, group by sender.
              // For group notifications, group by group + sender.
              const groupingKey = isGroup
                ? `group_${groupName}_${senderId}`
                : `user_${senderId}`;

              // ==========================================
              // CARD TITLE
              // ==========================================

              const displayName = isGroup
                ? groupName
                : item.sender_name || 'Unknown User';

              // ==========================================
              // DESCRIPTION / LATEST MESSAGE
              // ==========================================

              const lastMessage =
                item.description || item.title || 'New notification';

              const displayMessage = isGroup
                ? `${item.sender_name || 'Unknown User'}: ${lastMessage}`
                : lastMessage;

              // ==========================================
              // TIMESTAMP
              // ==========================================

              const itemDateTime = item.dateTime || '';

              const itemTimestamp = itemDateTime
                ? new Date(itemDateTime).getTime() || 0
                : 0;

              // ==========================================
              // UNREAD STATUS
              // ==========================================

              const isUnread = Number(item.is_read_status) === 0;

              // ==========================================
              // FIRST MESSAGE FROM THIS USER
              // ==========================================

              if (!groupedNotifications[groupingKey]) {
                groupedNotifications[groupingKey] = {
                  id: groupingKey,

                  senderId: item.sender_id,

                  source: item.source,

                  // Group card title = group_name.
                  // Normal card title = sender_name.
                  userName: displayName,
                  sender_profile_type_details:
                    item.sender_profile_type_details || '',

                  userTag:
                    item.sender_profile_type_details ||
                    item.sender_profile_type ||
                    '',

                  // Group: sender name + last message.
                  // User: existing message description.
                  message: displayMessage,

                  dateTime: itemDateTime,

                  date: item.date || '',

                  time: item.time || '',

                  latestTimestamp: itemTimestamp,

                  notSeenCount: isUnread ? 1 : 0,

                  unreadCount: isUnread ? 1 : 0,

                  avatar:
                    item.sender_profile_picture ||
                    item.receiver_profile_picture ||
                    null,

                  channelTypes: item.type
                    ? [String(item.type).trim().toLowerCase()]
                    : [],

                  type: item.type || 'inapp',

                  title: item.title || '',

                  event: item.event || '',

                  receiverId: item.receiver_id || '',

                  isReadStatus: Number(item.is_read_status),

                  firebaseKey: item.firebaseKey,

                  originalData: item,
                };

                return;
              }

              // ============================================
              // EXISTING USER'S MESSAGE
              // ============================================

              const existing = groupedNotifications[groupingKey];

              // ============================================
              // COUNT ALL UNREAD MESSAGES
              // ============================================

              if (isUnread) {
                existing.unreadCount += 1;
                existing.notSeenCount += 1;
              }

              // ============================================
              // COLLECT CHANNEL TYPES
              // ============================================

              const currentChannel = String(item.type || '')
                .trim()
                .toLowerCase();

              if (
                currentChannel &&
                !existing.channelTypes.includes(currentChannel)
              ) {
                existing.channelTypes.push(currentChannel);
              }

              // ============================================
              // UPDATE LATEST MESSAGE ONLY
              // ============================================

              if (itemTimestamp > existing.latestTimestamp) {
                existing.userName = displayName;

                existing.sender_profile_type_details =
                  item.sender_profile_type_details ||
                  item.sender_profile_type ||
                  existing.userTag ||
                  '';

                existing.userTag =
                  item.sender_profile_type_details ||
                  item.sender_profile_type ||
                  existing.userTag ||
                  '';

                existing.message = displayMessage;

                existing.dateTime = itemDateTime;

                existing.date = item.date || '';

                existing.time = item.time || '';

                existing.latestTimestamp = itemTimestamp;

                existing.avatar =
                  item.sender_profile_picture ||
                  item.receiver_profile_picture ||
                  existing.avatar ||
                  null;

                existing.type = item.type || 'notification';

                existing.title = item.title || '';

                existing.event = item.event || '';

                existing.receiverId = item.receiver_id || '';

                existing.isReadStatus = Number(item.is_read_status);

                existing.firebaseKey = item.firebaseKey;

                existing.originalData = item;
              }
            });

            // ============================================
            // CONVERT TO ARRAY
            // ============================================

            const notifications = Object.values(groupedNotifications);

            // ============================================
            // SORT
            // 1. Unread notifications first.
            // 2. Newest message first.
            // ============================================

            notifications.sort((a, b) => {
              return (
                Number(b.latestTimestamp || 0) - Number(a.latestTimestamp || 0)
              );
            });
            console.log('FINAL ACTIVITY NOTIFICATIONS:', notifications);

            setActivityData(notifications);
            setIsLoadingActivity(false);
          } catch (error) {
            console.log('Error processing Firebase notifications:', error);

            setActivityData([]);
            setIsLoadingActivity(false);
          }
        };

        // ============================================
        // LISTENER 1: NORMAL USER NOTIFICATIONS
        // ============================================

        unsubscribeUser = onValue(
          userNotificationRef,
          snapshot => {
            userNotifications = snapshot.exists() ? snapshot.val() || {} : {};

            userLoaded = true;

            processNotifications();
          },
          error => {
            console.log('User notification listener error:', error);

            userNotifications = {};
            userLoaded = true;

            processNotifications();
          },
        );

        // ============================================
        // LISTENER 2: GROUP NOTIFICATIONS
        // ============================================

        unsubscribeGroup = onValue(
          groupNotificationRef,
          snapshot => {
            groupNotifications = snapshot.exists() ? snapshot.val() || {} : {};

            groupLoaded = true;

            processNotifications();
          },
          error => {
            console.log('Group notification listener error:', error);

            groupNotifications = {};
            groupLoaded = true;

            processNotifications();
          },
        );
      } catch (error) {
        console.log('Error loading Firebase notifications:', error);

        setActivityData([]);
        setIsLoadingActivity(false);
      }
    };

    loadFirebaseNotifications();

    // ============================================
    // CLEANUP FIREBASE LISTENERS
    // ============================================

    return () => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }

      if (unsubscribeGroup) {
        unsubscribeGroup();
      }
    };
  }, []);

  // useEffect(() => {
  //   const userId = 2467; // Replace with logged-in user ID

  //   const userNotificationRef = ref(
  //     database,
  //     `leafnet_notifications/User_${userId}_2`,
  //   );

  //   const groupNotificationRef = ref(
  //     database,
  //     `leafnet_notifications/Group_2_${userId}`,
  //   );

  //   let userNotifications = {};
  //   let groupNotifications = {};
  //   let userLoaded = false;
  //   let groupLoaded = false;

  //   const updateUnreadCount = () => {
  //     const userUnreadCount = Object.values(userNotifications).filter(
  //       item => item && Number(item.is_read_status) === 0,
  //     ).length;

  //     const groupUnreadCount = Object.values(groupNotifications).filter(
  //       item => item && Number(item.is_read_status) === 0,
  //     ).length;

  //     setUnreadNotificationCount(userUnreadCount + groupUnreadCount);
  //   };

  //   const processMessages = () => {
  //     // Wait until both Firebase listeners have returned data.
  //     if (!userLoaded || !groupLoaded) {
  //       return;
  //     }

  //     const allRecords = [
  //       ...Object.entries(userNotifications).map(([key, item]) => ({
  //         ...item,
  //         firebaseKey: key,
  //         source: 'user',
  //       })),
  //       ...Object.entries(groupNotifications).map(([key, item]) => ({
  //         ...item,
  //         firebaseKey: key,
  //         source: 'group',
  //       })),
  //     ];

  //     const groupedMessages = {};

  //     allRecords.forEach(item => {
  //       if (!item || item.sender_id == null) {
  //         return;
  //       }

  //       // Keep user and group conversations separate.
  //       const senderId = String(item.sender_id);
  //       const conversationId = `${item.source}_${senderId}`;

  //       const rawDateTime = item.dateTime || '';
  //       const timestamp = rawDateTime
  //         ? new Date(rawDateTime).getTime() || 0
  //         : 0;

  //       const isUnread = Number(item.is_read_status) === 0;
  //       const messageText =
  //         item.description || item.title || 'New notification';

  //       if (!groupedMessages[conversationId]) {
  //         groupedMessages[conversationId] = {
  //           id: conversationId,
  //           senderId,
  //           source: item.source,
  //           userName:
  //             item.source === 'group'
  //               ? item.group_name || 'Unknown Group'
  //               : item.sender_name || 'Unknown User',
  //           userImage: item.sender_profile_picture
  //             ? { uri: item.sender_profile_picture }
  //             : require('../../asset/dummyuser.png'),
  //           lastMessage: messageText,
  //           dateTime: rawDateTime,
  //           timestamp,
  //           isRead: !isUnread,
  //           unreadCount: isUnread ? 1 : 0,
  //           firebaseKey: item.firebaseKey,
  //           originalData: item,
  //         };
  //         return;
  //       }

  //       const existing = groupedMessages[conversationId];

  //       if (isUnread) {
  //         existing.unreadCount += 1;
  //       }

  //       if (timestamp > existing.timestamp) {
  //         existing.userName =
  //           item.source === 'group'
  //             ? item.group_name || existing.userName || 'Unknown Group'
  //             : item.sender_name || existing.userName || 'Unknown User';
  //         existing.userImage = item.sender_profile_picture
  //           ? { uri: item.sender_profile_picture }
  //           : existing.userImage;
  //         existing.lastMessage = messageText;
  //         existing.dateTime = rawDateTime;
  //         existing.timestamp = timestamp;
  //         existing.isRead = !isUnread;
  //         existing.firebaseKey = item.firebaseKey;
  //         existing.originalData = item;
  //       }
  //     });

  //     const sortedMessages = Object.values(groupedMessages).sort((a, b) => {
  //       // Unread conversations first.
  //       const aUnread = a.unreadCount > 0;
  //       const bUnread = b.unreadCount > 0;

  //       if (aUnread !== bUnread) {
  //         return aUnread ? -1 : 1;
  //       }

  //       // Then newest message first.
  //       return b.timestamp - a.timestamp;
  //     });

  //     setMessages(sortedMessages);
  //     setIsLoadingMessages(false);
  //   };

  //   const unsubscribeUser = onValue(
  //     userNotificationRef,
  //     snapshot => {
  //       userNotifications = snapshot.exists() ? snapshot.val() || {} : {};
  //       userLoaded = true;
  //       processMessages();
  //     },
  //     error => {
  //       console.log('User notification listener error:', error);
  //       userNotifications = {};
  //       userLoaded = true;
  //       processMessages();
  //     },
  //   );

  //   const unsubscribeGroup = onValue(
  //     groupNotificationRef,
  //     snapshot => {
  //       groupNotifications = snapshot.exists() ? snapshot.val() || {} : {};
  //       groupLoaded = true;
  //       processMessages();
  //     },
  //     error => {
  //       console.log('Group notification listener error:', error);
  //       groupNotifications = {};
  //       groupLoaded = true;
  //       processMessages();
  //     },
  //   );

  //   return () => {
  //     unsubscribeUser();
  //     unsubscribeGroup();
  //   };
  // }, []);

  useEffect(() => {
    // Replace with the actual logged-in user's ID when available.
    const userId = 2467;

    const userNotificationRef = ref(
      database,
      `leafnet_notifications/User_${userId}_2`,
    );

    const groupNotificationRef = ref(
      database,
      `leafnet_notifications/Group_2_${userId}`,
    );

    let userNotifications = {};
    let groupNotifications = {};

    let userLoaded = false;
    let groupLoaded = false;

    // ============================================
    // UPDATE UNREAD BADGE COUNT
    // ============================================
    const updateUnreadCount = () => {
      const userUnreadCount = Object.values(userNotifications).filter(
        item => item && Number(item.is_read_status) === 0,
      ).length;

      const groupUnreadCount = Object.values(groupNotifications).filter(
        item => item && Number(item.is_read_status) === 0,
      ).length;

      const totalUnread = userUnreadCount + groupUnreadCount;

      console.log('User unread count:', userUnreadCount);
      console.log('Group unread count:', groupUnreadCount);
      console.log('Total unread count:', totalUnread);

      setUnreadNotificationCount(totalUnread);
    };

    // ============================================
    // PROCESS MESSAGES FOR SIDEBAR
    // ============================================
    const processMessages = () => {
      if (!userLoaded || !groupLoaded) {
        return;
      }

      const allRecords = [
        ...Object.entries(userNotifications).map(([key, item]) => ({
          ...item,
          firebaseKey: key,
          source: 'user',
        })),
        ...Object.entries(groupNotifications).map(([key, item]) => ({
          ...item,
          firebaseKey: key,
          source: 'group',
        })),
      ];

      const groupedMessages = {};

      allRecords.forEach(item => {
        if (!item || item.sender_id == null) {
          return;
        }

        const senderId = String(item.sender_id);
        const conversationId = `${item.source}_${senderId}`;

        const rawDateTime = item.dateTime || '';

        const parsedTimestamp = rawDateTime
          ? new Date(rawDateTime).getTime()
          : 0;

        const timestamp = Number.isFinite(parsedTimestamp)
          ? parsedTimestamp
          : 0;

        const isUnread = Number(item.is_read_status) === 0;

        const messageText =
          item.description || item.title || 'New notification';

        if (!groupedMessages[conversationId]) {
          groupedMessages[conversationId] = {
            id: conversationId,
            senderId,
            source: item.source,

            userName:
              item.source === 'group'
                ? item.group_name || 'Unknown Group'
                : item.sender_name || 'Unknown User',

            sender_profile_type_details: item.sender_profile_type_details || '',

            userImage: item.sender_profile_picture
              ? { uri: item.sender_profile_picture }
              : require('../../asset/dummyuser.png'),

            lastMessage: messageText,
            dateTime: rawDateTime,
            timestamp,
            isRead: !isUnread,
            unreadCount: isUnread ? 1 : 0,
            firebaseKey: item.firebaseKey,

            originalData: item,
          };

          return;
        }

        const existing = groupedMessages[conversationId];

        if (isUnread) {
          existing.unreadCount += 1;
        }

        // Keep the newest message as the conversation preview.
        if (timestamp > existing.timestamp) {
          existing.userName =
            item.source === 'group'
              ? item.group_name || existing.userName || 'Unknown Group'
              : item.sender_name || existing.userName || 'Unknown User';

          existing.sender_profile_type_details =
            item.sender_profile_type_details ||
            existing.sender_profile_type_details ||
            '';

          existing.userImage = item.sender_profile_picture
            ? { uri: item.sender_profile_picture }
            : existing.userImage;

          existing.lastMessage = messageText;
          existing.dateTime = rawDateTime;
          existing.timestamp = timestamp;
          existing.isRead = !isUnread;
          existing.firebaseKey = item.firebaseKey;
          existing.originalData = item;
        }
      });

      // Unread conversations first, newest messages next.
      const sortedMessages = Object.values(groupedMessages).sort((a, b) => {
        const aUnread = a.unreadCount > 0;
        const bUnread = b.unreadCount > 0;

        if (aUnread !== bUnread) {
          return aUnread ? -1 : 1;
        }

        return b.timestamp - a.timestamp;
      });

      setMessages(sortedMessages);
      setIsLoadingMessages(false);
    };

    // ============================================
    // USER NOTIFICATION LISTENER
    // ============================================
    const unsubscribeUser = onValue(
      userNotificationRef,
      snapshot => {
        userNotifications = snapshot.exists() ? snapshot.val() || {} : {};

        userLoaded = true;

        // IMPORTANT: Refresh the bell badge.
        updateUnreadCount();

        // Refresh the message sidebar.
        processMessages();
      },
      error => {
        console.log('User notification listener error:', error);

        userNotifications = {};
        userLoaded = true;

        updateUnreadCount();
        processMessages();
      },
    );

    // ============================================
    // GROUP NOTIFICATION LISTENER
    // ============================================
    const unsubscribeGroup = onValue(
      groupNotificationRef,
      snapshot => {
        groupNotifications = snapshot.exists() ? snapshot.val() || {} : {};

        groupLoaded = true;

        // IMPORTANT: Refresh the bell badge.
        updateUnreadCount();

        // Refresh the message sidebar.
        processMessages();
      },
      error => {
        console.log('Group notification listener error:', error);

        groupNotifications = {};
        groupLoaded = true;

        updateUnreadCount();
        processMessages();
      },
    );

    // ============================================
    // CLEAN UP LISTENERS
    // ============================================
    return () => {
      unsubscribeUser();
      unsubscribeGroup();
    };
  }, []);

  const handleRecentFirst = () => {
    setSelectedTimeFilter('recent');

    setMessages(prevMessages =>
      [...prevMessages].sort((a, b) => {
        const dateA = new Date(a.dateTime || 0).getTime();
        const dateB = new Date(b.dateTime || 0).getTime();

        return dateB - dateA; // Latest date/time first
      }),
    );

    setShowTimeModal(false);
  };

  const createNotificationDateTime = (date, time) => {
    if (!date) {
      return new Date().toISOString();
    }

    try {
      // Firebase:
      // date = "2026-02-03"
      // time = "07:58 AM"

      if (time) {
        const [timeValue, period] = time.split(' ');

        let [hours, minutes] = timeValue.split(':').map(Number);

        if (period === 'PM' && hours !== 12) {
          hours += 12;
        }

        if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        const [year, month, day] = date.split('-').map(Number);

        const notificationDate = new Date(year, month - 1, day, hours, minutes);

        return notificationDate.toISOString();
      }

      return new Date(date).toISOString();
    } catch (error) {
      console.log('Date conversion error:', error);

      return new Date().toISOString();
    }
  };

  const createNotificationDateTimeForUI = (date, time) => {
    return {
      date: date || '',
      time: time || '',
    };
  };

  // ============================================================
  // CATEGORIES DATA
  // ============================================================

  // ============================================================
  // TIME FILTERS DATA
  // ============================================================
  const timeFilters = [
    {
      id: 'recent',
      name: 'Recent First',
      icon: require('../../asset/time.png'),
      color: '#6C63FF',
    },
    {
      id: 'oldest',
      name: 'Oldest First',
      icon: require('../../asset/time.png'),
      color: '#FF9800',
    },
    {
      id: 'newest_unread',
      name: 'Newest Unread First',
      icon: require('../../asset/email.png'),
      color: '#4CAF50',
    },
    {
      id: 'oldest_unread',
      name: 'Oldest Unread First',
      icon: require('../../asset/email.png'),
      color: '#FF4757',
    },
  ];

  // ============================================================
  // USER TYPES DATA FOR FILTERS
  // ============================================================
  const [userTypes, setUserTypes] = useState([]);
  const [subUserTypes, setSubUserTypes] = useState({});
  // ============================================================
  // COMMUNICATION OPTIONS
  // ============================================================
  const communicationOptions = [
    {
      id: 'email',
      icon: require('../../asset/email.png'),
      label: 'Email',
      color: '#6C63FF',
    },
  ];

  // ============================================================
  // DASHBOARD OPTIONS
  // ============================================================
  const dashboardOptions = [
    {
      id: 'dashboard',
      icon: require('../../asset/grid.png'),
      label: 'Dashboard',
    },
    {
      id: 'tutorial',
      icon: require('../../asset/help-circle.png'),
      label: 'Tutorial',
    },
    {
      id: 'faq',
      icon: require('../../asset/information-circle.png'),
      label: 'FAQ',
    },
  ];

  // ============================================================
  // DIALPAD NUMBERS
  // ============================================================
  const dialpadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const toggleCategoryExpand = categoryId => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // const loadMoreUsers = () => {
  //   setVisibleCount(prev => Math.min(prev + 5, userList.length));
  // };

  const getFilteredUsers = () => {
    let filtered = userList;

    if (selectedCategory !== 'All') {
      const categoryMap = {
        'System Admin': 'System Admin',
        'Dialer Contact': 'Dialer Contact',
        Clients: 'Client',
        Team: 'Team',
      };

      filtered = filtered.filter(user =>
        user.tag.includes(categoryMap[selectedCategory] || ''),
      );
    }

    if (showUnread) {
      filtered = filtered.filter(user => user.unread > 0);
    }

    const search = conversationSearch.trim().toLowerCase();

    if (search) {
      filtered = filtered.filter(user => {
        const name = String(user.name || user.user_name || '').toLowerCase();
        const email = String(user.email || '').toLowerCase();
        const tag = String(user.tag || '').toLowerCase();

        return (
          name.includes(search) ||
          email.includes(search) ||
          tag.includes(search)
        );
      });
    }

    return filtered;
  };

  // const getFilteredContacts = type => {
  //   let filtered = contacts;

  //   if (type === 'whatsapp') {
  //     filtered = filtered.filter(c => c.hasWhatsApp);
  //   } else if (type === 'message') {
  //     filtered = filtered.filter(c => c.hasMessage);
  //   }

  //   if (selectedUserType !== 'all') {
  //     filtered = filtered.filter(c => c.type === selectedUserType);
  //     if (selectedSubType !== 'All Users') {
  //       filtered = filtered.filter(c => c.subType === selectedSubType);
  //     }
  //   }

  //   if (contactSearch) {
  //     filtered = filtered.filter(
  //       c =>
  //         c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
  //         c.number.includes(contactSearch),
  //     );
  //   }
  //   return filtered;
  // };

  const handleSortChange = value => {
    console.log('Selected Sort Filter:', value);
    setActivitySortBy(value);
    setActiveDropdown(null);
  };

  const getFilteredContacts = type => {
    let filtered = contacts;

    if (type === 'whatsapp') {
      filtered = filtered.filter(c => c.hasWhatsApp);
    } else if (type === 'message') {
      filtered = filtered.filter(c => c.hasMessage);
    }

    if (selectedUserType !== 'all') {
      filtered = filtered.filter(
        c => c.type?.toLowerCase() === selectedUserType?.toLowerCase(),
      );

      if (selectedSubType !== 'All Users') {
        filtered = filtered.filter(
          c => c.subType?.toLowerCase() === selectedSubType?.toLowerCase(),
        );
      }
    }

    if (contactSearch) {
      const search = contactSearch.toLowerCase().trim();

      filtered = filtered.filter(
        c =>
          (c.name || '').toLowerCase().includes(search) ||
          (c.number || '').toLowerCase().includes(search) ||
          (c.email || '').toLowerCase().includes(search),
      );
    }

    return filtered;
  };
  const getFilteredActivityWithQuickFilters = () => {
    let filtered = [...activityData];

    // --------------------------------------------------
    // 1. QUICK SEARCH
    // --------------------------------------------------
    if (activityQuickSearch) {
      const searchText = activityQuickSearch.toLowerCase().trim();

      filtered = filtered.filter(item => {
        const userName = (item.userName || '').toLowerCase();
        const message = (item.message || '').toLowerCase();
        const userTag = (item.userTag || '').toLowerCase();

        return (
          userName.includes(searchText) ||
          message.includes(searchText) ||
          userTag.includes(searchText)
        );
      });
    }

    // --------------------------------------------------
    // 2. READ / UNREAD FILTER
    // --------------------------------------------------
    if (activityReadStatus === 'read') {
      filtered = filtered.filter(item => Number(item.unreadCount || 0) === 0);
    } else if (activityReadStatus === 'unread') {
      filtered = filtered.filter(item => Number(item.unreadCount || 0) > 0);
    }

    // --------------------------------------------------
    // 3. ROLE FILTER
    // Uses dynamic item.userTag
    // --------------------------------------------------
    if (activityRole !== 'all') {
      const selectedRole = (activityRole || '').trim().toLowerCase();

      filtered = filtered.filter(item => {
        const itemRole = (item.userTag || '').trim().toLowerCase();

        return itemRole === selectedRole;
      });
    }

    // --------------------------------------------------
    // 4. THREAD FILTER
    // --------------------------------------------------
    if (activityThread === 'main') {
      filtered = filtered.filter(item => {
        const itemType = (item.type || 'inapp').trim().toLowerCase();

        return itemType !== 'reply' && item.source !== 'group';
      });
    } else if (activityThread === 'group') {
      filtered = filtered.filter(item => {
        const groupRef = item.groupref ?? item.originalData?.groupref;

        return (
          item.source === 'group' ||
          (groupRef !== null &&
            groupRef !== undefined &&
            String(groupRef).trim() !== '')
        );
      });
    } else if (activityThread === 'reply') {
      filtered = filtered.filter(item => {
        const itemType = (item.type || 'inapp').trim().toLowerCase();

        return itemType === 'reply';
      });
    }

    // --------------------------------------------------
    // 5. CHANNEL FILTER
    //
    // item.type values:
    // whatsapp -> Whatsapp
    // email    -> Email
    // sms      -> SMS
    // inapp    -> Internal
    // --------------------------------------------------
    if (activityChannel !== 'all') {
      const normalizeChannel = value => {
        const channel = String(value || '')
          .trim()
          .toLowerCase();

        if (channel === 'sms') return 'messaging';

        return channel;
      };

      const selectedChannel = normalizeChannel(activityChannel);

      filtered = filtered.filter(item => {
        const latestEvent = normalizeChannel(
          item.latestEvent ?? item.latestChannel ?? item.type ?? '',
        );

        return latestEvent === selectedChannel;
      });
    }

    // --------------------------------------------------
    // 6. MINIMUM UNREAD FILTER
    // --------------------------------------------------
    const minCount = parseInt(activityMinUnread, 10) || 0;

    if (minCount > 0) {
      filtered = filtered.filter(item => {
        return Number(item.unreadCount || 0) >= minCount;
      });
    }

    // --------------------------------------------------
    // 7. SORT
    // --------------------------------------------------
    switch (activitySortBy) {
      case 'most_unread':
        filtered.sort((a, b) => {
          const unreadA = Number(a.unreadCount ?? 0);
          const unreadB = Number(b.unreadCount ?? 0);

          // Highest unread count first
          if (unreadA !== unreadB) {
            return unreadB - unreadA;
          }

          // If unread counts match, newest message first
          return (
            Number(b.latestTimestamp ?? 0) - Number(a.latestTimestamp ?? 0)
          );
        });
        break;

      case 'recent':
        filtered.sort(
          (a, b) =>
            Number(b.latestTimestamp || 0) - Number(a.latestTimestamp || 0),
        );
        console.log('click', activitySortBy);
        break;

      case 'oldest':
        filtered.sort(
          (a, b) =>
            Number(a.latestTimestamp || 0) - Number(b.latestTimestamp || 0),
        );
        console.log('click', activitySortBy);
        break;
    }

    console.log(
      'Sorted activity:',
      filtered.map(item => ({
        name: item.userName,
        unreadCount: item.unreadCount,
        latestTimestamp: item.latestTimestamp,
      })),
    );
    return filtered;
  };

  const resetActivityFilters = () => {
    setActivityQuickSearch('');
    setActivityReadStatus('all');
    setActivityRole('all');
    setActivityThread('all');
    setActivityChannel('all');
    setActivitySortBy('recent');
    setActivityMinUnread('0');
    setActiveDropdown(null);
  };

  const isActivityWithinTimeFilter = (dateTime, filterId) => {
    if (filterId === 'all') return true;

    if (!dateTime) return false;

    const activityDate = new Date(dateTime);

    if (Number.isNaN(activityDate.getTime())) return false;

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(
      weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
    );

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const hours24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filterId) {
      case 'today':
        return activityDate >= todayStart && activityDate < tomorrowStart;

      case 'yesterday':
        return activityDate >= yesterdayStart && activityDate < todayStart;

      case 'last24hours':
        return activityDate >= hours24Ago && activityDate <= now;

      case 'last7days':
        return activityDate >= days7Ago && activityDate <= now;

      case 'thisweek':
        return activityDate >= weekStart && activityDate <= now;

      case 'last30days':
        return activityDate >= days30Ago && activityDate <= now;

      case 'thismonth':
        return activityDate >= monthStart && activityDate <= now;

      case 'lastmonth':
        return activityDate >= lastMonthStart && activityDate < monthStart;

      case 'lastyear':
        return activityDate >= lastYearStart && activityDate < thisYearStart;

      default:
        return true;
    }
  };

  // const getFilteredActivity = () => {
  //   let filteredData = activityData.filter(item =>
  //     isActivityWithinTimeFilter(item.dateTime, activityTimeFilter),
  //   );

  //   // Apply your existing quick filters
  //   const quickFilteredData = getFilteredActivityWithQuickFilters();

  //   const quickFilteredIds = new Set(quickFilteredData.map(item => item.id));

  //   filteredData = filteredData.filter(item => quickFilteredIds.has(item.id));

  //   // Apply search filter
  //   if (activityQuickSearch?.trim()) {
  //     const searchText = activityQuickSearch.trim().toLowerCase();

  //     filteredData = filteredData.filter(item =>
  //       [
  //         item.sender_name,
  //         item.receiver_name,
  //         item.description,
  //         item.action,
  //         item.group_name,
  //       ]
  //         .filter(Boolean)
  //         .some(value => String(value).toLowerCase().includes(searchText)),
  //     );
  //   }

  //   return filteredData;
  // };

  const getFilteredActivity = () => {
    // Start with quick-filtered data so the selected sort order is preserved.
    let filteredData = getFilteredActivityWithQuickFilters();

    // Apply the time filter without changing the sorted order.
    filteredData = filteredData.filter(item =>
      isActivityWithinTimeFilter(item.dateTime, activityTimeFilter),
    );

    // Apply search filter
    if (activityQuickSearch?.trim()) {
      const searchText = activityQuickSearch.trim().toLowerCase();

      filteredData = filteredData.filter(item =>
        [
          item.sender_name,
          item.receiver_name,
          item.description,
          item.action,
          item.group_name,
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(searchText)),
      );
    }

    return filteredData;
  };

  const getTotalActivityCount = () => {
    return activityData.length;
  };

  const getUnreadActivityCount = () => {
    return activityData.filter(item => item.notSeenCount > 0).length;
  };

  const getTotalMessages = () => {
    return messages.length;
  };

  const getUnreadMessagesCount = () => {
    return messages.filter(msg => !msg.isRead).length;
  };

  const getTimeAgo = dateTime => {
    if (!dateTime) return '';

    // Firebase format: "2026-10-06T07:13:52"
    const messageDate = new Date(dateTime);

    if (isNaN(messageDate.getTime())) return '';

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - messageDate.getTime());

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'Just now';
    if (minutes === 1) return 'a minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours === 1) return 'an hour ago';
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'a day ago';
    if (days < 7) return `${days} days ago`;
    if (weeks === 1) return 'a week ago';
    if (days < 30) return `${weeks} weeks ago`;
    if (months === 1) return 'a month ago';
    if (days < 365) return `${months} months ago`;
    if (years === 1) return 'a year ago';

    return `${years} years ago`;
  };

  const deleteMessage = async item => {
    if (deletingMessageId !== null) return;

    const firebaseKey = item.firebaseKey;

    if (!firebaseKey) {
      Alert.alert('Error', 'Firebase notification key not found.');
      return;
    }

    try {
      setDeletingMessageId(item.id);

      const token = await getAuthToken();

      const payload = {
        type: 2,
        user_identifier: 'User_2467_2',
        field_name: firebaseKey,
      };
      console.log('delete payload', payload);

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/removeNotification',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data?.success) {
        setMessages(prev => prev.filter(msg => msg.id !== item.id));
      } else {
        Alert.alert(
          'Error',
          response.data?.message || 'Unable to delete the message.',
        );
      }
    } catch (error) {
      console.log(
        'DELETE NOTIFICATION ERROR:',
        error.response?.data || error.message,
      );

      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Failed to delete the message. Please try again.',
      );
    } finally {
      setDeletingMessageId(null);
    }
  };

  const clearAllMessages = async () => {
    if (clearingMessages) return;

    try {
      setClearingMessages(true);

      const token = await getAuthToken();

      const payload = {
        type: 1,
        user_identifier: 'Group_2_2467',
      };

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/removeNotification',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('REMOVE NOTIFICATION RESPONSE:', response.data);

      if (response.data?.success) {
        setMessages([]);
      } else {
        Alert.alert(
          'Error',
          response.data?.message || 'Failed to clear messages.',
        );
      }
    } catch (error) {
      console.log(
        'REMOVE NOTIFICATION ERROR:',
        error.response?.data || error.message,
      );

      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Unable to clear messages. Please try again.',
      );
    } finally {
      setClearingMessages(false);
    }
  };

  const toggleMute = () => {
    alert('Mute toggled');
  };

  const getSortByValue = filterId => {
    switch (filterId) {
      case 'recent':
        return 'date_sent_desc';

      case 'oldest':
        return 'date_sent_asc';

      case 'newest_unread':
        return 'new_unread';

      case 'oldest_unread':
        return 'oldest_unread';

      default:
        return 'date_sent_desc';
    }
  };

  const getFilterName = filterId => {
    switch (filterId) {
      case 'recent':
        return 'Recent';

      case 'oldest':
        return 'Oldest First';

      case 'newest_unread':
        return 'Newest Unread First';

      case 'oldest_unread':
        return 'Oldest Unread First';

      default:
        return 'Recent';
    }
  };

  const handleTimeFilterPress = filterId => {
    const sortBy = getSortByValue(filterId);

    console.log('SELECTED TIME FILTER:', filterId);
    console.log('SORT BY:', sortBy);

    // Update selected filter
    setSelectedTimeFilter(filterId);

    // Start from page 1
    setCurrentPage(1);
    setHasMorePages(false);

    // Clear old users
    setUserList([]);

    // Reset unread count
    setTotalUnreadCount(0);

    // Call API with new sorting
    fetchUsers(1, false, selectedType, selectedSubType, sortBy, false);
  };

  // const fetchUserTypes = async () => {
  //   try {
  //     setIsLoadingCategories(true);

  //     const token = '5822|e7zRcuxQfcbYLe0G3BALDcHkHB45pqHDpFDbLhH4009f29a0';

  //     const response = await axios.get(
  //       'https://leafcom.us/backend/api/chat-application/userType',
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${token}`,
  //         },
  //       },
  //     );

  //     const res = response.data;

  //     if (res.success && Array.isArray(res.data)) {
  //       const dynamicCategories = res.data.map((item, index) => ({
  //         id: item.type.toLowerCase().replace(/\s+/g, '_'),

  //         name: item.type,

  //         readCount: Number(item.user_count || 0),

  //         unreadCount: Number(item.unread_count || 0),

  //         // Generic icon for every category
  //         icon: require('../../asset/people.png'),

  //         color: '#76577F',

  //         subtitle: `${item.type} Contacts`,

  //         // Dynamic sub-categories from API
  //         children: (item.sub_types || []).map((subType, childIndex) => ({
  //           id: `${item.type.toLowerCase().replace(/\s+/g, '_')}_${childIndex}`,

  //           name: subType,

  //           // Generic icon for every sub-category
  //           icon: require('../../asset/people.png'),
  //         })),
  //       }));

  //       setCategories(dynamicCategories);

  //       const apiData = res.data;

  //       const formattedUserTypes = apiData.map((item, index) => {
  //         let icon = require('../../asset/people.png');

  //         if (item.type === 'All') {
  //           icon = require('../../asset/people.png');
  //         } else if (item.type === 'Clients') {
  //           icon = require('../../asset/business.png');
  //         } else if (item.type === 'Users') {
  //           icon = require('../../asset/people.png');
  //         } else if (item.type === 'Sales Agent') {
  //           icon = require('../../asset/group-chat.png');
  //         } else if (item.type === 'Department') {
  //           icon = require('../../asset/business.png');
  //         } else if (item.type === 'Support') {
  //           icon = require('../../asset/settings.png');
  //         } else if (item.type === 'Leads') {
  //           icon = require('../../asset/people.png');
  //         } else {
  //           icon = require('../../asset/people.png');
  //         }

  //         return {
  //           id: item.type.toLowerCase().replace(/\s+/g, '_'),
  //           name: item.type,
  //           icon,
  //           userCount: Number(item.user_count || 0),
  //           unreadCount: Number(item.unread_count || 0),
  //         };
  //       });

  //       // Dynamic sub user types
  //       const formattedSubUserTypes = {};

  //       apiData.forEach(item => {
  //         const typeId = item.type.toLowerCase().replace(/\s+/g, '_');

  //         formattedSubUserTypes[typeId] = [...(item.sub_types || [])];
  //       });

  //       setUserTypes(formattedUserTypes);
  //       setSubUserTypes(formattedSubUserTypes);
  //     } else {
  //       setCategories([]);
  //       setUserTypes([]);
  //       setSubUserTypes({});
  //     }
  //   } catch (error) {
  //     console.log(
  //       'User Type API Error:',
  //       error.response?.data || error.message,
  //     );

  //     setCategories([]);
  //   } finally {
  //     setIsLoadingCategories(false);
  //   }
  // };

  // ============================================================
  // LOAD MORE USERS
  // ============================================================

  // Use your existing authentication token variable here.

  const fetchUserTypes = async () => {
    try {
      setIsLoadingCategories(true);

      const token = await getAuthToken();

      if (!token) {
        console.log('Authentication token not found');
        setCategories([]);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Call both APIs simultaneously
      const [userTypeResponse, groupResponse] = await Promise.all([
        axios.get('https://leafcom.us/backend/api/chat-application/userType', {
          headers,
        }),

        axios.post(
          'https://leafcom.us/backend/api/chat-application/listOfChatGroup',
          {
            group_id: '',
            search_text: '',
          },
          { headers },
        ),
      ]);

      const userTypeData = userTypeResponse.data;
      const groupData = groupResponse.data;

      // ------------------------------------------
      // 1. USER TYPE API
      // ------------------------------------------
      const userTypeCategories =
        userTypeData.success && Array.isArray(userTypeData.data)
          ? userTypeData.data.map(item => {
              const typeId = item.type.toLowerCase().replace(/\s+/g, '_');

              return {
                id: typeId,
                name: item.type,
                readCount: Number(item.user_count || 0),
                unreadCount: Number(item.unread_count || 0),
                icon: require('../../asset/people.png'),
                color: '#76577F',
                subtitle: `${item.type} Contacts`,
                children: (item.sub_types || []).map((subType, index) => ({
                  id: `${typeId}_${index}`,
                  name: subType,
                  icon: require('../../asset/people.png'),
                })),
              };
            })
          : [];

      // ------------------------------------------
      // 2. GROUP API
      // ------------------------------------------
      const groupList =
        groupData.success && Array.isArray(groupData.data)
          ? groupData.data
          : [];

      let groupsCategory = [];

      // Add Groups only when at least one group exists
      if (groupList.length > 0) {
        const totalUnreadMessages = groupList.reduce(
          (total, group) =>
            total + Number(group.total_unread_message_count || 0),
          0,
        );

        groupsCategory = [
          {
            id: 'groups',
            name: 'Groups',

            // Total number of groups
            readCount: groupList.length,

            // Sum of unread messages across all groups
            unreadCount: totalUnreadMessages,

            icon: require('../../asset/group-chat.png'),
            color: '#76577F',
            subtitle: `${groupList.length} Groups`,
            isChatGroup: true,

            // Individual groups are children of Groups
            children: groupList.map(group => ({
              id: `group_${group.id}`,
              groupId: group.group_id,
              name: group.group_name,
              readCount: Number(group.total_leads || 0),
              unreadCount: Number(group.total_unread_message_count || 0),
              icon: require('../../asset/group-chat.png'),
              isChatGroup: true,
              groupImage: group.group_image,
              description: group.description,
              assignedUsers: group.assigned_users,
              users: group.users || [],
              leads: group.leads || [],
            })),
          },
        ];
      }

      // ------------------------------------------
      // 3. COMBINE BOTH API RESULTS
      // ------------------------------------------
      const dynamicCategories = [...userTypeCategories, ...groupsCategory];

      setCategories(dynamicCategories);

      // ------------------------------------------
      // 4. UPDATE EXISTING USER TYPE STATES
      // ------------------------------------------
      if (userTypeData.success && Array.isArray(userTypeData.data)) {
        const formattedUserTypes = userTypeData.data.map(item => {
          let icon = require('../../asset/people.png');

          if (item.type === 'Clients' || item.type === 'Department') {
            icon = require('../../asset/business.png');
          } else if (item.type === 'Sales Agent') {
            icon = require('../../asset/group-chat.png');
          } else if (item.type === 'Support') {
            icon = require('../../asset/settings.png');
          }

          return {
            id: item.type.toLowerCase().replace(/\s+/g, '_'),
            name: item.type,
            icon,
            userCount: Number(item.user_count || 0),
            unreadCount: Number(item.unread_count || 0),
          };
        });

        const formattedSubUserTypes = {};

        userTypeData.data.forEach(item => {
          const typeId = item.type.toLowerCase().replace(/\s+/g, '_');

          formattedSubUserTypes[typeId] = [...(item.sub_types || [])];
        });

        setUserTypes(formattedUserTypes);
        setSubUserTypes(formattedSubUserTypes);
      }

      console.log('Categories loaded:', dynamicCategories);
      console.log('Total groups:', groupList.length);
      console.log(
        'Total unread group messages:',
        groupList.reduce(
          (total, group) =>
            total + Number(group.total_unread_message_count || 0),
          0,
        ),
      );
    } catch (error) {
      console.log(
        'Fetch Categories API Error:',
        error.response?.data || error.message,
      );
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchCountryCodes = async () => {
    try {
      const COUNTRY_CODES_API =
        'https://leafcom.us/backend/api/chat-application/countryCodes';

      const token = await getAuthToken();
      setCountryLoading(true);

      const response = await axios.get(COUNTRY_CODES_API, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        const countries = response.data.data || [];

        setCountryCodes(
          countries.filter(
            item =>
              item.name &&
              item.country_phone_code &&
              item.country_phone_code.trim() !== '',
          ),
        );
      } else {
        Alert.alert('Error', 'Unable to fetch country codes.');
      }
    } catch (error) {
      console.log(
        'Country codes API error:',
        error.response?.data || error.message,
      );
      Alert.alert('Error', 'Failed to load country codes.');
    } finally {
      setCountryLoading(false);
    }
  };

  const openCountryModal = () => {
    setCountryModalVisible(true);

    if (countryCodes.length === 0) {
      fetchCountryCodes();
    }
  };

  const handleCountrySelect = item => {
    setSelectedCountry(item.country_phone_code);
    setSelectedCountryName(item.name);
    setSelectedCountryCode(item.country_code);
    setCountryModalVisible(false);
    setCountrySearch('');
  };

  const fetchProfileInfo = async () => {
    try {
      setIsLoadingCategories(true);
      const token = await getAuthToken();

       
      console.log('Fetched auth token:', token);

      if (!token) {
        console.log('Authentication token not found');
        return;
      }

      const response = await axios.get(
        'https://leafcom.us/backend/api/chat-application/profileInfo',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );
      console.log('profile api', response);

      if (response.data?.success && response.data?.user_info) {
        setProfileInfo(response.data.user_info);
      }
    } catch (error) {
      console.log('Profile API error:', error.response?.data || error.message);
    }
  };
  const fetchUsers = async (
    pageNumber = 1,
    loadMore = false,
    type = selectedType,
    subType = selectedSubType,
    sortBy = getSortByValue(selectedTimeFilter),
    isShowAll = false,
  ) => {
    try {
      if (loadMore) {
        setIsLoadingMoreUsers(true);
      } else {
        setIsLoadingUsers(true);
      }

      const token = await getAuthToken();

      const payload = {
        type: type || 'All',
        sub_type: subType || '',
        search_text: '',
        is_show_all: isShowAll ? 1 : false,
        per_page: 10,
        page: pageNumber,
        sort_by: sortBy,
      };

      console.log('USER LIST PAYLOAD:', payload);

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/usersList',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const res = response.data;

      console.log('USERLIST API RESPONSE:', response.data);

      if (res.success && Array.isArray(res.data)) {
        const newUsers = res.data.map(item => ({
          id: String(item.sender_id),
          name: item.user_name || '',
          user_name: item.user_name || '',

          avatar: item.profile_picture
            ? { uri: item.profile_picture }
            : require('../../asset/dummyuser.png'),

          tag: item.user_type_details || item.user_type || '',

          unread: Number(item.total_unread_message_count || 0),

          sender_id: item.sender_id,
          user_type: item.user_type,
          user_type_details: item.user_type_details,
          user_specifics: item.user_specifics,
          email: item.email,
          whatsapp_number: item.whatsapp_number,
          mobile_no: item.mobile_no,
          user_id_other_software: item.user_id_other_software,
          main_id: item.main_id,
          sub_id: item.sub_id,
          sub_details: item.sub_details,
          main_details: item.main_details,
          last_message_date: item.last_message_date,
          brand_name: item.brand_name,
          office_name: item.office_name,
        }));

        if (loadMore) {
          setUserList(prev => [...prev, ...newUsers]);
        } else {
          setUserList(newUsers);
        }

        // Total user count
        const pagination = res.pagination;

        setTotalReadCount(Number(pagination?.total || 0));

        // Add unread count for each loaded page
        const pageUnreadCount = res.data.reduce(
          (total, item) => total + Number(item.total_unread_message_count || 0),
          0,
        );

        if (loadMore) {
          setTotalUnreadCount(prev => prev + pageUnreadCount);
        } else {
          setTotalUnreadCount(pageUnreadCount);
        }

        setCurrentPage(Number(pagination?.current_page || pageNumber));

        setHasMorePages(Boolean(pagination?.has_more_pages));
      } else {
        if (!loadMore) {
          setUserList([]);
          setTotalUnreadCount(0);
        }

        setHasMorePages(false);
      }
    } catch (error) {
      console.log(
        'Users List API Error:',
        error.response?.data || error.message,
      );

      if (!loadMore) {
        setUserList([]);
        setTotalUnreadCount(0);
      }
    } finally {
      setIsLoadingUsers(false);
      setIsLoadingMoreUsers(false);
    }
  };
  const loadMoreUsers = () => {
    if (isLoadingMoreUsers || !hasMorePages) {
      return;
    }

    const nextPage = currentPage + 1;

    console.log('Loading page:', nextPage);

    fetchUsers(nextPage, true);
  };

  const handleSubTypePress = (parentType, subType, isShowAll = false) => {
    setSelectedType(parentType);
    setSelectedSubType(subType);

    setCurrentPage(1);
    setHasMorePages(false);

    // Reset previous filter's unread total
    setTotalUnreadCount(0);

    setUserList([]);

    setShowFilterModal(false);

    fetchUsers(1, false, parentType, subType, undefined, isShowAll);
  };

  const handleSaveSignature = async () => {
    if (!signatureName.trim()) {
      Alert.alert('Validation', 'Please enter signature name.');
      return;
    }

    if (!signatureContent.trim()) {
      Alert.alert('Validation', 'Please enter signature content.');
      return;
    }

    try {
      setIsSavingSignature(true);

      
      const token = await getAuthToken();

      if (!token) {
        Alert.alert('Error', 'Authentication token not found.');
        return;
      }

      const payload = {
        name: signatureName.trim(),
        content: signatureContent.trim(),
      };

      console.log('CREATE SIGNATURE PAYLOAD:', payload);

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/createSignature',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('CREATE SIGNATURE RESPONSE:', response.data);

      if (response.data?.success) {
        const createdSignature = response.data.data;

        // Add the newly created signature to local list
        fetchSignatures();

        // Clear fields
        setSignatureName('');
        setSignatureContent('');

        // Close modal
        setShowAddSignatureModal(false);

        Alert.alert(
          'Success',
          response.data.message || 'Signature created successfully.',
        );
      } else {
        Alert.alert(
          'Error',
          response.data?.message || 'Failed to create signature.',
        );
      }
    } catch (error) {
      console.log(
        'CREATE SIGNATURE API ERROR:',
        error.response?.data || error.message,
      );

      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Something went wrong while creating the signature.',
      );
    } finally {
      setIsSavingSignature(false);
    }
  };

  const fetchSignatures = async () => {
    try {
      setIsLoadingSignatures(true);

     
      const token = await getAuthToken();

      if (!token) {
        console.log('Authentication token not found');
        return;
      }

      const response = await axios.get(
        'https://leafcom.us/backend/api/chat-application/getUserSignatureList',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('SIGNATURE LIST RESPONSE:', response.data);

      if (response.data?.success && Array.isArray(response.data?.data)) {
        const formattedSignatures = response.data.data.map(item => ({
          id: String(item.id),
          name: item.name,
          content: '', // API currently does not return content
        }));

        setSignatures(formattedSignatures);
      } else {
        setSignatures([]);
      }
    } catch (error) {
      console.log(
        'GET SIGNATURE LIST API ERROR:',
        error.response?.data || error.message,
      );

      setSignatures([]);
    } finally {
      setIsLoadingSignatures(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      Alert.alert('Validation', 'Please enter recipient email.');
      return;
    }

    if (!emailSubject.trim()) {
      Alert.alert('Validation', 'Please enter subject.');
      return;
    }

    if (!emailBody.trim()) {
      Alert.alert('Validation', 'Please enter email body.');
      return;
    }

    try {
      setIsSendingEmail(true);

      const token = await getAuthToken();

      if (!token) {
        Alert.alert('Error', 'Authentication token not found.');
        return;
      }

      const payload = {
        subject: emailSubject.trim(),
        body: emailBody.trim(),
        send_to: emailTo.trim(),
        signature_id: selectedSignature ? String(selectedSignature) : '',
      };

      console.log('========== EMAIL REQUEST ==========');
      console.log(
        'URL:',
        'https://leafcom.us/backend/api/chat-application/sendUserEmail',
      );
      console.log('PAYLOAD:', JSON.stringify(payload, null, 2));
      console.log('TOKEN EXISTS:', !!token);
      console.log('SIGNATURE ID:', selectedSignature);
      console.log('===================================');

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/sendUserEmail',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('========== EMAIL RESPONSE ==========');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('STATUS:', response.status);
      console.log('====================================');

      if (response.data?.success) {
        Alert.alert(
          'Success',
          response.data.message || 'Email sent successfully.',
        );

        setEmailTo('');
        setEmailSubject('');
        setEmailBody('');
        setSelectedSignature('');
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to send email.');
      }
    } catch (error) {
      console.log('========== EMAIL ERROR ==========');
      console.log('STATUS:', error.response?.status);
      console.log('DATA:', error.response?.data);
      console.log('MESSAGE:', error.message);
      console.log('=================================');

      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Something went wrong while sending email.',
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setIsLoadingUsers(true);
      setUserList([]);
      setHasMorePages(false);

      const token = await getAuthToken();
      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/listOfChatGroup',
        {
          group_id: '',
          search_text: '',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('GROUP API RESPONSE:', response.data);

      if (response.data?.success && Array.isArray(response.data?.data)) {
        const groups = response.data.data.map(group => ({
          id: String(group.id),
          name: group.group_name || 'Unnamed Group',
          user_name: group.group_name || 'Unnamed Group',
          tag: 'Groups',
          type: 'Groups',
          unread: Number(group.total_unread_message_count || 0),
          profile_picture: group.group_image || '',
          group_id: group.group_id,
          group_name: group.group_name,
          users: group.users || [],
          isChatGroup: true,
        }));

        setUserList(groups);
        console.log('MAPPED GROUPS:', groups);
      } else {
        setUserList([]);
        console.log('No groups returned by API');
      }
    } catch (error) {
      console.log('GROUP API ERROR:', error.response?.data || error.message);
      setUserList([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchGroupsForMessageNav = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/listOfChatGroup',
        {
          group_id: '',
          search_text: '',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Check the actual API response first
      console.log(
        'GROUP API RESPONSE:',
        JSON.stringify(response.data, null, 2),
      );

      // Adjust this path if your API response uses another structure
      const apiGroups = response.data?.data;

      if (!Array.isArray(apiGroups)) {
        console.log('Group data is not an array:', apiGroups);
        return [];
      }

      const groups = apiGroups.map((group, index) => ({
        id: String(group.id ?? group.group_id ?? index),
        group_id: group.group_id,
        name: group.group_name ?? group.name ?? 'Unnamed Group',
        group_name: group.group_name ?? group.name ?? 'Unnamed Group',

        // Pass group members to GroupChat
        users: Array.isArray(group.users) ? group.users : [],

        isChatGroup: true,
      }));

      console.log('MAPPED GROUPS:', JSON.stringify(groups, null, 2));

      return groups;
    } catch (error) {
      console.log('FETCH GROUPS ERROR:', error.response?.data ?? error.message);
      return [];
    }
  };
  const fetchContacts = async (
    pageNumber = 1,
    loadMore = false,
    selectedType = selectedUserType,
    selectedSubTypeValue = selectedSubType,
  ) => {
    try {
      if (loadMore) {
        setIsLoadingMoreContacts(true);
      } else {
        //setIsLoadingContacts(true);
        setIsLoadingCategories(true);
      }

     
      const token = await getAuthToken();

      if (!token) {
        console.log('Authentication token not found');
        return;
      }

      const apiType =
        selectedType === 'all'
          ? 'All'
          : userTypes.find(item => item.id === selectedType)?.name || '';

      // For All Users, send empty subtype
      const apiSubType =
        !selectedSubTypeValue || selectedSubTypeValue === 'All Users'
          ? ''
          : selectedSubTypeValue;

      const payload = {
        type: apiType,
        sub_type: apiSubType,
        search_text: '',
        is_show_all: 1,
        per_page: 10,
        page: pageNumber,
        sort_by: '',
      };

      console.log('CONTACT API PAYLOAD:', payload);

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/usersList',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('CONTACT API RESPONSE:', response.data);

      if (response.data?.success && Array.isArray(response.data?.data)) {
        const apiContacts = response.data.data.map(item => ({
          id: String(item.sender_id),
          name: (item.user_name || '').trim(),
          number: item.mobile_no || '',
          type: item.user_type || '',
          subType: item.user_type_details || '',
          tag: item.user_type || '',

          // Same logic as renderUserItem
          hasWhatsApp:
            !!item.whatsapp_number && item.whatsapp_number.trim() !== '',

          hasMessage: !!item.mobile_no && item.mobile_no.trim() !== '',

          email: item.email || '',
          whatsapp_number: item.whatsapp_number || '',
          profile_picture: item.profile_picture || '',
          unread: Number(item.total_unread_message_count || 0),

          sender_id: item.sender_id,
          user_type: item.user_type,
          user_type_details: item.user_type_details,
          user_specifics: item.user_specifics,
          user_id_other_software: item.user_id_other_software,
          main_id: item.main_id,
          sub_id: item.sub_id,
          sub_details: item.sub_details,
          main_details: item.main_details,
          brand_name: item.brand_name,
          office_name: item.office_name,
          last_message_date: item.last_message_date,
        }));

        if (loadMore) {
          setContacts(prev => [...prev, ...apiContacts]);
        } else {
          setContacts(apiContacts);
        }

        const pagination = response.data.pagination;

        setContactsCurrentPage(Number(pagination?.current_page || pageNumber));

        setContactsHasMorePages(Boolean(pagination?.has_more_pages));
      } else {
        if (!loadMore) {
          setContacts([]);
        }

        setContactsHasMorePages(false);
      }
    } catch (error) {
      console.log('CONTACT API ERROR:', error.response?.data || error.message);

      if (!loadMore) {
        setContacts([]);
      }
    } finally {
      setIsLoadingCategories(false);
      setIsLoadingMoreContacts(false);
    }
  };

  const handleUserTypeSelect = typeId => {
    setSelectedUserType(typeId);

    // Reset subtype
    setSelectedSubType('All Users');

    // Fetch selected type
    fetchContacts(1, false, typeId, '');
  };

  const handleSubTypeSelect = subType => {
    setSelectedSubType(subType);

    // Fetch selected type + subtype
    fetchContacts(1, false, selectedUserType, subType);
  };

  const loadMoreContacts = () => {
    if (isLoadingMoreContacts || !contactsHasMorePages) {
      return;
    }

    const nextPage = contactsCurrentPage + 1;

    fetchContacts(
      nextPage,
      true,
      selectedUserType,
      selectedSubType === 'All Users' ? '' : selectedSubType,
    );
  };

  const handleDialerCall = async () => {
    if (!phoneNumber?.trim()) {
      Alert.alert('Validation', 'Please enter a phone number.');
      return;
    }

    if (isCalling) return;

    // Build the international number from the selected country code.
    const enteredNumber = `${selectedCountry || ''}${phoneNumber}`.replace(
      /[\s()-]/g,
      '',
    );

    let modalOpened = false;

    try {
      setIsCalling(true);

      // Use the same authentication token retrieval as your existing API calls.
      const token = await getAuthToken();

      if (!token) {
        Alert.alert('Authentication Error', 'Authentication token not found.');
        return;
      }

      // STEP 1: Find or create the dialer contact.
      const contactResponse = await axios.post(
        'https://leafcom.us/backend/api/chat-application/findOrCreateDialerContact',
        {
          phone: enteredNumber,
          user_type: 'Users',
          channel: 'inapp',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Dialer Contact Response:', contactResponse.data);

      if (!contactResponse.data?.success || !contactResponse.data?.data) {
        throw new Error(
          contactResponse.data?.message || 'Unable to find or create contact.',
        );
      }

      const contact = contactResponse.data.data;

      if (!contact.sender_id) {
        throw new Error('Contact ID is missing from the API response.');
      }

      // STEP 2: Prepare the same in-call UI used by UserChatPage.
      setCallPhoneNumber(enteredNumber);
      setCallStatus('Connecting...');
      setIsMuted(false);
      setShowDialModal(false);
      setShowInCallModal(true);
      modalOpened = true;

      // STEP 3: Start the existing Telnyx call service.
      await makeTelnyxCall({
        receiverId: contact.sender_id,
        receiverName: contact.user_name || enteredNumber,
        receiverType: contact.user_type || 'Users',
        toNumber: enteredNumber,
        authToken: token,

        onCallState: state => {
          const normalizedState = String(state || '').toUpperCase();

          if (normalizedState.includes('ACTIVE')) {
            setCallStatus('Connected');
          } else if (normalizedState.includes('RINGING')) {
            setCallStatus('Ringing...');
          } else if (
            normalizedState.includes('ENDED') ||
            normalizedState.includes('FAILED')
          ) {
            const failed = normalizedState.includes('FAILED');

            setCallStatus(failed ? 'Call failed' : 'Call ended');

            setTimeout(() => {
              setShowInCallModal(false);
            }, 1000);
          } else if (normalizedState.includes('CONNECTING')) {
            setCallStatus('Connecting...');
          }
        },
      });
    } catch (error) {
      console.log(
        'Dialer Call Error:',
        error?.response?.data || error?.message || error,
      );

      if (modalOpened) {
        setShowInCallModal(false);
      }

      Alert.alert(
        'Call Failed',
        error?.response?.data?.message ||
          error?.message ||
          'Unable to initiate the call.',
      );
    } finally {
      setIsCalling(false);
    }
  };

  const handleHangUp = async () => {
    try {
      await endTelnyxCall();
    } catch (error) {
      console.log('Hangup error:', error?.message || error);
    } finally {
      setShowInCallModal(false);
      setIsMuted(false);
      setCallStatus('Call ended');
    }
  };

  const handleToggleMute = async () => {
    const call = getCurrentTelnyxCall();

    if (!call) {
      Alert.alert('Call Unavailable', 'No active call was found.');
      return;
    }

    try {
      if (!isMuted) {
        if (typeof call.muteAudio === 'function') {
          await call.muteAudio();
        } else if (typeof call.mute === 'function') {
          await call.mute();
        } else {
          Alert.alert('Mute Unavailable', 'Mute is not supported.');
          return;
        }

        setIsMuted(true);
      } else {
        if (typeof call.unmuteAudio === 'function') {
          await call.unmuteAudio();
        } else if (typeof call.unmute === 'function') {
          await call.unmute();
        } else {
          Alert.alert('Unmute Unavailable', 'Unmute is not supported.');
          return;
        }

        setIsMuted(false);
      }
    } catch (error) {
      console.log('Mute error:', error?.message || error);
      Alert.alert('Error', 'Unable to change microphone state.');
    }
  };

  const handleDialerWhatsApp = async (item = null) => {
    if (!phoneNumber?.trim()) {
      Alert.alert('Validation', 'Please enter a phone number.');
      return;
    }

    const enteredNumber = `${selectedCountry || ''}${phoneNumber}`.replace(
      /[\s()-]/g,
      '',
    );

    try {
      setIsWPCalling(true);

      // Use the same token as your existing handleDialerCall.
      const token = await getAuthToken();

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/findOrCreateDialerContact',
        {
          phone: enteredNumber,
          user_type: 'Users',
          channel: 'inapp',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Dialer WhatsApp Contact:', response.data);

      if (!response.data?.success || !response.data?.data) {
        throw new Error(
          response.data?.message || 'Unable to find or create contact.',
        );
      }

      const contact = response.data.data;

      if (!contact.sender_id) {
        throw new Error('Contact sender_id is missing from the API response.');
      }

      const whatsappNumber = contact.whatsapp_number || enteredNumber;

      // Close dialer and open UserChatPage.
      setShowDialModal(false);
      setActiveTab('directory');

      navigation.navigate('UserChatPage', {
        senderId: contact.sender_id,
        sender_id: contact.sender_id,
        userName: item?.user_name || contact.user_name || enteredNumber,
        userImage:
          item?.sender_profile_picture || contact.sender_profile_picture || '',
        userType: item?.user_type || contact.user_type || 'Users',
        userTypeDetails:
          item?.user_type_details ||
          contact.user_type_details ||
          'Dialer Contact',

        whatsapp_number:
          item?.whatsapp_number || contact.whatsapp_number || enteredNumber,
        whatsappNumber:
          item?.whatsapp_number || contact.whatsapp_number || enteredNumber,

        phone: enteredNumber,
        commType: 'WP',

        showChatBubble: item?.user_type_details !== 'Dialer Contact',
        showEmailIcon: isValidEmail(item?.email),
        showWhatsAppIcon: !!(
          item?.whatsapp_number && item.whatsapp_number.trim() !== ''
        ),
        showPhoneIcon: true,
        showMessageIcon: true,
        useremail: profileInfo.email,
      });
    } catch (error) {
      console.error(
        'Dialer WhatsApp Error:',
        error.response?.data || error.message,
      );

      Alert.alert(
        'Error',
        error.response?.data?.message ||
          error.message ||
          'Unable to open WhatsApp chat.',
      );
    } finally {
      setIsWPCalling(false);
    }
  };

  const handleDialerMessage = async (item = null) => {
    const enteredNumber = `${selectedCountry || ''}${phoneNumber}`.replace(
      /[\s()-]/g,
      '',
    );

    if (!phoneNumber?.trim()) {
      Alert.alert('Validation', 'Please enter a phone number.');
      return;
    }

    setIsSMSCalling(true);

    try {
      const token = await getAuthToken();

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/findOrCreateDialerContact',
        {
          phone: enteredNumber,
          user_type: 'Users',
          channel: 'inapp',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const contact = response?.data?.data;

      if (!contact?.sender_id) {
        Alert.alert('Error', 'Unable to find or create the contact.');
        return;
      }

      navigation.navigate('UserChatPage', {
        senderId: contact.sender_id,
        sender_id: contact.sender_id,
        userName: item?.user_name || enteredNumber,
        userImage: item?.sender_profile_picture || '',
        userType: item?.user_type || 'Users',
        whatsapp_number: item?.whatsapp_number || enteredNumber,
        whatsappNumber: item?.whatsapp_number || enteredNumber,
        phone: enteredNumber,
        userTypeDetails: item?.user_type_details || 'Dialer Contact',
        commType: 'sms',
        showChatBubble: item?.user_type_details !== 'Dialer Contact',
        showEmailIcon: isValidEmail(item?.email),
        showWhatsAppIcon:
          !!item?.whatsapp_number && item?.whatsapp_number.trim() !== '',
        showPhoneIcon: true,
        showMessageIcon: true,
        useremail: profileInfo.email,
      });
    } catch (error) {
      console.error('Dialer message error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Unable to open the message chat.',
      );
    } finally {
      setIsSMSCalling(false);
    }
  };

  // ============================================================
  // MODAL MANAGEMENT
  // ============================================================

  const closeAllModals = () => {
    setShowFilterModal(false);
    setShowTimeModal(false);
    setShowDialModal(false);
    setShowContactFilter(false);
    setShowWhatsAppModal(false);
    setShowMessageModal(false);
    setShowDashboardModal(false);
    setShowSignatureModal(false);
    setShowAddSignatureModal(false);
    setShowEmailHistory(false);
    setShowActivityTimeModal(false);
    setShowActivityQuickFilterModal(false);
    setActiveDropdown(null);
  };

  const openModal = (modalName, parent = null) => {
    closeAllModals();
    if (parent) {
      setParentModal(parent);
    }
    setTimeout(() => {
      switch (modalName) {
        case 'filter':
          setShowFilterModal(true);
          break;
        case 'time':
          setShowTimeModal(true);
          break;
        case 'dial':
          setShowDialModal(true);
          break;
        case 'contactFilter':
          setShowContactFilter(true);
          break;
        case 'whatsapp':
          setContactModalTab('contacts');
          setShowWhatsAppModal(true);

          break;
        case 'message':
          setContactModalTab('contacts');
          setShowMessageModal(true);
          break;
        case 'dashboard':
          setShowDashboardModal(true);
          break;
        case 'signature':
          setShowSignatureModal(true);
          break;
        case 'addSignature':
          setShowAddSignatureModal(true);
          break;
        case 'emailHistory':
          setShowEmailHistory(true);
          break;
        case 'activityTime':
          setShowActivityTimeModal(true);
          break;
        case 'activityQuickFilter':
          setShowActivityQuickFilterModal(true);
          break;
      }
    }, 300);
  };

  const closeFilterAndOpenParent = () => {
    setShowContactFilter(false);
    setPendingModal(parentModal);
  };

  useEffect(() => {
    if (pendingModal) {
      setTimeout(() => {
        if (pendingModal === 'whatsapp') {
          setShowWhatsAppModal(true);
        } else if (pendingModal === 'message') {
          setShowMessageModal(true);
        } else if (pendingModal === 'dial') {
          setShowDialModal(true);
        }
        setPendingModal(null);
        setParentModal(null);
      }, 400);
    }
  }, [pendingModal]);

  const filteredUsers = getFilteredUsers();
  const insets = useSafeAreaInsets();

  // ============================================================
  // RENDER: TOP BAR - TALLER HEIGHT
  // ============================================================
  const renderTopBar = () => {
    return (
      <View
        style={[
          styles.dashboardHeader,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent={true}
        />

        {/* Colorful Background Overlays */}
        <View style={styles.headerBgContainer}>
          <View style={[styles.headerBgCircle, styles.headerBgCircle1]} />
          <View style={[styles.headerBgCircle, styles.headerBgCircle2]} />
          <View style={[styles.headerBgCircle, styles.headerBgCircle3]} />
          <View style={[styles.headerBgCircle, styles.headerBgCircle4]} />
          <View style={[styles.headerBgCircle, styles.headerBgCircle5]} />
          <View style={[styles.headerBgCircle, styles.headerBgCircle6]} />
        </View>

        <View style={styles.topBarContent}>
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <View>
                <View style={styles.titleContainer}>
                  <View style={styles.logoContainer}>
                    <Image
                      source={require('../../asset/logo.png')}
                      style={styles.topBarLogo}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.topBarProfile}
              onPress={() => setShowSideNav(!showSideNav)}
              activeOpacity={0.8}
            >
              <Image
                source={
                  profileInfo.profile_picture
                    ? { uri: profileInfo.profile_picture }
                    : require('../../asset/user.png')
                }
                style={styles.topBarProfileImage}
                resizeMode="cover"
              />

              <Text style={styles.topBarProfileName} numberOfLines={1}>
                {profileInfo.user_name || 'User'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerIconButton,
                styles.headerIconMenu,
                { height: 30, width: 30, marginRight: 8 },
              ]}
              onPress={() => openModal('dashboard')}
            >
              <Image
                source={require('../../asset/grid.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#FFFFFF',
                }}
              />
            </TouchableOpacity>

            <View style={styles.notificationBellWrapper}>
              <TouchableOpacity
                style={[
                  styles.headerIconButton,
                  styles.headerIconMenu,
                  { height: 30, width: 30, marginRight: 8 },
                ]}
                onPress={() => setShowMessageSidebar(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../asset/bell.png')}
                  style={{
                    width: 24,
                    height: 24,
                    resizeMode: 'contain',
                    tintColor: '#FFFFFF',
                  }}
                />
              </TouchableOpacity>

              {getUnreadMessagesCount() > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {getUnreadMessagesCount() > 99
                      ? '99+'
                      : getUnreadMessagesCount()}
                  </Text>
                </View>
              )}
            </View>

            {/* <TouchableOpacity
              style={[
                styles.headerIconButton,
                styles.headerIconMenu,
                { height: 30, width: 30 },
              ]}
              onPress={() => setShowSideNav(!showSideNav)}
            >
              <Image
                source={require('../../asset/menu.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#FFF',
                }}
              />
            </TouchableOpacity> */}
          </View>
        </View>
      </View>
    );
  };

  // ============================================================
  // RENDER: MESSAGE SIDEBAR
  // ============================================================
  const renderMessageSidebar = () => {
    const totalMessages = getTotalMessages();
    const unreadCount = getUnreadMessagesCount();

    const renderMessageItem = ({ item }) => (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={async () => {
          if (item.source === 'group') {
            try {
              const groups = await fetchGroupsForMessageNav();

              // Stop if the API returns no groups
              if (!Array.isArray(groups) || groups.length === 0) {
                console.log('No groups available from API.');
                return;
              }

              const clickedGroupId =
                item.group_id || item.originalData?.group_id || '';

              const clickedGroupName =
                item.group_name || item.userName || item.name || '';

              // Find the selected group by ID or name
              const selectedGroup = groups.find(group => {
                const idMatches =
                  clickedGroupId &&
                  String(group.group_id) === String(clickedGroupId);

                const nameMatches =
                  clickedGroupName &&
                  String(group.name || group.group_name)
                    .trim()
                    .toLowerCase() === clickedGroupName.trim().toLowerCase();

                return idMatches || nameMatches;
              });

              // If not found, open the first group
              const groupToOpen = selectedGroup || groups[0];

              console.log('Opening group:', groupToOpen);

              navigation.navigate('GroupChat', {
                id: groupToOpen.id,
                senderId: groupToOpen.id,
                name: groupToOpen.name || groupToOpen.group_name,
                userName: groupToOpen.name || groupToOpen.group_name,
                group_id: groupToOpen.group_id,
                users: groupToOpen.users || [],
              });
            } catch (error) {
              console.log(
                'Unable to open group:',
                error.response?.data || error.message,
              );
            }

            return;
          }

          const profileTypeDetails = String(
            item.sender_profile_type_details || item.userTag || '',
          )
            .trim()
            .toLowerCase();

          const showCommunicationIcons = [
            'system admin',
            'office user',
            'department user',
          ].includes(profileTypeDetails);

          navigation.navigate('UserChatPage', {
            senderId: item.sender_id || item.senderId,

            userName:
              item.sender_name ||
              item.user_name ||
              item.userName ||
              'Unknown User',

            userImage: item.sender_profile_picture || null,

            userType: item.sender_profile_type,

            commType: 'inApp',

            // All three depend only on profileTypeDetails
            showChatBubble: showCommunicationIcons,
            showEmailIcon: showCommunicationIcons,
            showWhatsAppIcon: showCommunicationIcons,
            showPhoneIcon: showCommunicationIcons,
            showMessageIcon: showCommunicationIcons,

            whatsapp_number: item.whatsapp_number || item.user_name || '',

            whatsappNumber: item.whatsapp_number || item.user_name || '',
            useremail: profileInfo.email,

            phone: item.mobile_no || '',
          });
        }}
      >
        <View style={styles.messageAvatarContainer}>
          <Image source={item.userImage} style={styles.messageAvatar} />
          {!item.isRead && <View style={styles.messageAvatarDot} />}
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            {/* <Text
              style={[
                styles.messageUserName,
                !item.isRead && styles.messageUserNameUnread,
              ]}
            >
              {item.userName} 
            </Text> */}

            <View style={styles.senderNameRow}>
              <Text style={styles.senderName}>
                {item.userName || 'Unknown User'}
              </Text>

              {!!item.sender_profile_type_details && (
                <View style={styles.senderProfileChip}>
                  <Text style={styles.senderProfileChipText}>
                    {item.sender_profile_type_details}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.messageTime}>{getTimeAgo(item.dateTime)}</Text>
          </View>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageLastText,
                !item.isRead && styles.messageUnreadText,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            <View style={styles.messageStatusContainer}>
              {item.isRead ? (
                <View style={styles.messageReadStatus}>
                  <Image
                    source={require('../../asset/checkmark-done.png')}
                    style={{
                      width: 12,
                      height: 12,
                      resizeMode: 'contain',
                      tintColor: '#4CAF50',
                    }}
                  />
                  <Text style={styles.messageReadText}>Seen</Text>
                </View>
              ) : (
                <View style={styles.messageUnreadStatus}>
                  <Image
                    source={require('../../asset/email.png')}
                    style={{
                      width: 12,
                      height: 12,
                      resizeMode: 'contain',
                      tintColor: '#FF4757',
                    }}
                  />
                  <Text style={styles.messageUnreadStatusText}>
                    {item.unreadCount > 0
                      ? `${item.unreadCount} new`
                      : 'Unread'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.messageDeleteBtn}
                onPress={() => deleteMessage(item)}
                disabled={deletingMessageId !== null}
                activeOpacity={0.7}
              >
                {deletingMessageId === item.id ? (
                  <ActivityIndicator size="small" color="#B39AC7" />
                ) : (
                  // Replace this with your existing close icon
                  <Image
                    source={require('../../asset/close.png')}
                    style={{
                      width: 14,
                      height: 14,
                      resizeMode: 'contain',
                      tintColor: '#999',
                    }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );

    return (
      <Modal
        visible={showMessageSidebar}
        transparent
        animationType="none"
        onRequestClose={() => {
          setShowMessageSidebar(false);
          setActiveTab('directory');
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setShowMessageSidebar(false);
            setActiveTab('directory');
          }}
        >
          <View style={styles.sidebarOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.sidebarContainer,
                  { transform: [{ translateX: sidebarAnim }] },
                ]}
              >
                {/* Colorful Header */}
                <View style={styles.sidebarHeader}>
                  <View style={styles.sidebarHeaderBgContainer}>
                    <View
                      style={[styles.sidebarHeaderBg, styles.sidebarHeaderBg1]}
                    />
                    <View
                      style={[styles.sidebarHeaderBg, styles.sidebarHeaderBg2]}
                    />
                    <View
                      style={[styles.sidebarHeaderBg, styles.sidebarHeaderBg3]}
                    />
                    <View
                      style={[styles.sidebarHeaderBg, styles.sidebarHeaderBg4]}
                    />
                  </View>

                  <View style={styles.sidebarHeaderContent}>
                    <View style={styles.sidebarHeaderLeft}>
                      <View style={styles.sidebarTitleContainer}>
                        <TouchableOpacity
                          style={styles.sidebarHeaderBtn}
                          onPress={() => {
                            setShowMessageSidebar(false);
                            setActiveTab('directory');
                          }}
                        >
                          <Image
                            source={require('../../asset/close.png')}
                            style={{
                              width: 16,
                              height: 16,
                              resizeMode: 'contain',
                              tintColor: '#FFF',
                            }}
                          />
                        </TouchableOpacity>
                        <Text style={styles.sidebarTitle}>Messages</Text>
                      </View>
                      <View style={styles.sidebarHeaderBadges}>
                        <View style={styles.sidebarTotalBadge}>
                          <Text style={styles.sidebarTotalBadgeText}>
                            {totalMessages}
                          </Text>
                        </View>
                        {unreadCount > 0 && (
                          <View style={styles.sidebarUnreadBadge}>
                            <Text style={styles.sidebarUnreadBadgeText}>
                              {unreadCount} unread
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.sidebarHeaderRight}>
                      {/* <TouchableOpacity
                        style={styles.sidebarHeaderBtn}
                        onPress={toggleMute}
                      >
                        <Image
                          source={require('../../asset/mute.png')}
                          style={{
                            width: 16,
                            height: 16,
                            resizeMode: 'contain',
                            tintColor: '#FFF',
                          }}
                        />
                      </TouchableOpacity> */}
                      <TouchableOpacity
                        style={styles.sidebarClearBtn}
                        onPress={clearAllMessages}
                      >
                        {clearingMessages ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.sidebarClearBtnText}>
                            Clear All
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {messages.length > 0 ? (
                  <FlatList
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.messageList}
                  />
                ) : (
                  <View style={styles.emptyMessagesContainer}>
                    <Image
                      source={require('../../asset/chatbubbles.png')}
                      style={{
                        width: 60,
                        height: 60,
                        resizeMode: 'contain',
                        tintColor: '#ddd',
                      }}
                    />
                    <Text style={styles.emptyMessagesText}>No messages</Text>
                    <Text style={styles.emptyMessagesSubtext}>
                      Your messages will appear here
                    </Text>
                  </View>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // ============================================================
  // RENDER FUNCTIONS FOR DIFFERENT SECTIONS
  // ============================================================

  const renderDialpadButton = num => (
    <TouchableOpacity
      key={num}
      style={styles.dialpadButton}
      onPress={() => setPhoneNumber(phoneNumber + num)}
    >
      <Text style={styles.dialpadNumber}>{num}</Text>
    </TouchableOpacity>
  );

  const renderContactItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        {
          borderLeftColor: '#6C63FF',
          borderLeftWidth: 4,
          borderColor: '#f1f3f5',
          borderWidth: 1,
          backgroundColor: '#FFFFFF',
        },
      ]}
    >
      <View style={styles.contactAvatar}>
        {item.profile_picture ? (
          <Image
            source={{ uri: item.profile_picture }}
            style={styles.whatsappContactAvatarImage}
          />
        ) : (
          <Text style={styles.whatsappContactAvatarText}>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        )}
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.brand_name?.trim() !== '' && (
          <View style={{ marginVertical: 4 }}>
            <Text style={[styles.contactTagText, { color: '#181616' }]}>
              {item.brand_name?.trim()}-{item.office_name?.trim()}
            </Text>
          </View>
        )}
        <View style={styles.contactTags}>
          {item.sub_details != null && item.sub_details.trim() !== '' && (
            <View style={[styles.contactTag, { backgroundColor: '#1b0ff0' }]}>
              <Text style={[styles.contactTagText, { color: '#FFF' }]}>
                {item.sub_details?.trim()}
              </Text>
            </View>
          )}
          <View style={[styles.contactTag, { backgroundColor: '#6C63FF20' }]}>
            <Text style={[styles.contactTagText, { color: '#6C63FF' }]}>
              {item.type}
            </Text>
          </View>
          <View style={[styles.contactTag, { backgroundColor: '#4CAF5020' }]}>
            <Text style={[styles.contactTagText, { color: '#4CAF50' }]}>
              {item.subType}
            </Text>
          </View>
        </View>
        <View style={styles.contactIconsRow}>
          {item.user_type_details !== 'Dialer Contact' && (
            <TouchableOpacity
              style={[
                styles.contactIconSmall,
                { backgroundColor: '#6C63FF20' },
              ]}
              onPress={() => {
                navigation.navigate('UserChatPage', {
                  senderId: item.id,
                  userName: item.name || item.user_name,
                  userImage: item.profile_picture,
                  userType: item.user_type,
                  userTypeDetails: item.user_type_details,
                  commType: 'inApp',
                  showChatBubble: item.user_type_details !== 'Dialer Contact',
                  showEmailIcon: isValidEmail(item.email),
                  showWhatsAppIcon:
                    !!item.whatsapp_number &&
                    item.whatsapp_number.trim() !== '',
                  whatsapp_number: item.whatsapp_number || item.user_name,
                  whatsappNumber: item.whatsapp_number || item.user_name,
                  phone: item.number,
                  showPhoneIcon: true,
                  useremail: profileInfo.email,
                  showMessageIcon: true,
                });
              }}
            >
              <Image
                source={require('../../asset/chat.png')}
                style={{
                  width: 22,
                  height: 22,
                  resizeMode: 'contain',
                }}
              />
            </TouchableOpacity>
          )}
          {isValidEmail(item.email) && (
            <TouchableOpacity
              style={[styles.contactIconSmall]}
              onPress={() => {
                navigation.navigate('UserChatPage', {
                  senderId: item.id,
                  userName: item.name || item.user_name,
                  userImage: item.profile_picture,
                  userType: item.user_type_details,
                  commType: 'email',
                  showChatBubble: item.user_type_details !== 'Dialer Contact',
                  showEmailIcon: isValidEmail(item.email),
                  showWhatsAppIcon:
                    !!item.whatsapp_number &&
                    item.whatsapp_number.trim() !== '',
                  whatsapp_number: item.whatsapp_number || item.user_name,
                  whatsappNumber: item.whatsapp_number || item.user_name,
                  phone: item.number,
                  showPhoneIcon: true,
                  useremail: profileInfo.email,
                  showMessageIcon: true,
                });
              }}
            >
              >
              <Image
                source={require('../../asset/mail.png')}
                style={{
                  width: 22,
                  height: 22,
                  resizeMode: 'contain',
                }}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.contactIconSmall, { backgroundColor: '#4CAF5020' }]}
            onPress={() => openModal('dial')}
          >
            <Image
              source={require('../../asset/circle-call.png')}
              style={{
                width: 22,
                height: 22,
                resizeMode: 'contain',
              }}
            />
          </TouchableOpacity>
          {item.whatsapp_number && item.whatsapp_number.trim() !== '' && (
            <TouchableOpacity
              style={[styles.contactIconSmall]}
              onPress={() => {
                navigation.navigate('UserChatPage', {
                  senderId: item.id,
                  userName: item.name || item.user_name,
                  userImage: item.profile_picture,
                  userType: item.user_type,
                  userTypeDetails: item.user_type_details,
                  commType: 'WP',
                  showChatBubble: item.user_type_details !== 'Dialer Contact',
                  showEmailIcon: isValidEmail(item.email),
                  showWhatsAppIcon:
                    !!item.whatsapp_number &&
                    item.whatsapp_number.trim() !== '',
                  whatsapp_number: item.whatsapp_number || item.user_name,
                  whatsappNumber: item.whatsapp_number || item.user_name,
                  phone: item.number,
                  showPhoneIcon: true,
                  useremail: profileInfo.email,
                  showMessageIcon: true,
                });
              }}
            >
              >
              <Image
                source={require('../../asset/whatsapp.png')}
                style={{
                  width: 22,
                  height: 22,
                  resizeMode: 'contain',
                }}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.contactIconSmall]}
            onPress={() => {
              navigation.navigate('UserChatPage', {
                senderId: item.id,
                userName: item.name || item.user_name,
                userImage: item.profile_picture,
                userType: item.user_type,
                userTypeDetails: item.user_type_details,
                commType: 'sms',
                showChatBubble: item.user_type_details !== 'Dialer Contact',
                showEmailIcon: isValidEmail(item.email),
                showWhatsAppIcon:
                  !!item.whatsapp_number && item.whatsapp_number.trim() !== '',
                whatsapp_number: item.whatsapp_number || item.user_name,
                whatsappNumber: item.whatsapp_number || item.user_name,
                phone: item.number,
                showPhoneIcon: true,
                useremail: profileInfo.email,
                showMessageIcon: true,
              });
            }}
          >
            >
            <Image
              source={require('../../asset/message.png')}
              style={{
                width: 22,
                height: 22,
                resizeMode: 'contain',
              }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContactListModal = (title, type, icon, iconColor) => {
    const filteredContacts =
      type === 'whatsapp'
        ? userList.filter(
            user => user.whatsapp_number && user.whatsapp_number.trim() !== '',
          )
        : userList.filter(
            user => user.mobile_no && user.mobile_no.trim() !== '',
          );
    const isVisible =
      type === 'whatsapp' ? showWhatsAppModal : showMessageModal;
    const setVisible =
      type === 'whatsapp' ? setShowWhatsAppModal : setShowMessageModal;
    console.log('selectedUserType', selectedUserType);

    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View
          style={styles.dialModalContainer}
          onPress={() =>
            navigation.navigate('UserChatPage', {
              senderId: item.sender_id,
              userName: item.sender_name || item.user_name,
              userImage: item.sender_profile_picture,
              userType: item.user_type,
              userTypeDetails: item.user_type_details,
              commType: 'inApp',
              whatsapp_number: item.whatsapp_number,
              whatsappNumber: item.whatsapp_number,
              phone: item.mobile_no,
              showChatBubble: item.user_type_details !== 'Dialer Contact',
              showEmailIcon: isValidEmail(item.email),
              showWhatsAppIcon:
                !!item.whatsapp_number && item.whatsapp_number.trim() !== '',
              showPhoneIcon: true,
              useremail: profileInfo.email,
              showMessageIcon: true,
            })
          }
        >
          <View style={styles.dialModalContent}>
            <View style={styles.dialModalHeader}>
              <View style={styles.whatsappHeaderContent}>
                <Image
                  source={icon}
                  style={{
                    width: 28,
                    height: 28,
                    resizeMode: 'contain',
                  }}
                />
                <Text style={styles.dialModalTitle}>{title}</Text>
              </View>
              <Text style={styles.dialModalSubtitle}>
                {filteredContacts.length} contacts available
              </Text>
              <TouchableOpacity
                style={styles.dialModalClose}
                onPress={() => setVisible(false)}
              >
                <Image
                  source={require('../../asset/close.png')}
                  style={{
                    width: 24,
                    height: 24,
                    resizeMode: 'contain',
                    tintColor: '#666',
                  }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.dialTabs}>
              <TouchableOpacity
                style={[
                  styles.dialTab,
                  contactModalTab === 'number' && styles.dialTabActive,
                ]}
                onPress={() => {
                  setContactModalTab('number');
                  setPhoneNumber('');
                }}
              >
                <Text
                  style={[
                    styles.dialTabText,
                    contactModalTab === 'number' && styles.dialTabTextActive,
                  ]}
                >
                  Phone Number
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dialTab,
                  contactModalTab === 'contacts' && styles.dialTabActive,
                ]}
                onPress={() => setContactModalTab('contacts')}
              >
                <Text
                  style={[
                    styles.dialTabText,
                    contactModalTab === 'contacts' && styles.dialTabTextActive,
                  ]}
                >
                  Contacts
                </Text>
              </TouchableOpacity>
            </View>
            {contactModalTab === 'contacts' ? (
              <View style={styles.whatsappContainer}>
                <View style={styles.whatsappSearchContainer}>
                  <Image
                    source={require('../../asset/search.png')}
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                      tintColor: '#999',
                    }}
                  />
                  <TextInput
                    style={styles.whatsappSearchInput}
                    placeholder="Search contacts..."
                    placeholderTextColor="#999"
                    value={contactSearch}
                    onChangeText={setContactSearch}
                  />
                  <TouchableOpacity
                    style={styles.filterIconBtn}
                    onPress={() => openModal('contactFilter', type)}
                  >
                    <Image
                      source={require('../../asset/filter.png')}
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                        tintColor: '#6C63FF',
                      }}
                    />
                  </TouchableOpacity>
                </View>

                {/* <View style={styles.activeFilters}>
               
                {selectedUserType && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {selectedSubType}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSelectedSubType('All Users')}
                    >
                      <Image
                        source={require('../../asset/close.png')}
                        style={{
                          width: 14,
                          height: 14,
                          resizeMode: 'contain',
                          tintColor: '#666',
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View> */}

                <FlatList
                  data={filteredContacts}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.userCard,
                        {
                          borderLeftColor: '#6C63FF',
                          borderLeftWidth: 4,
                          borderColor: '#f1f3f5',
                          borderWidth: 1,
                          backgroundColor: '#FFFFFF',
                        },
                      ]}
                      onPress={() =>
                        navigation.navigate('UserChatPage', {
                          senderId: item.sender_id,
                          userName: item.sender_name || item.user_name,
                          userImage: item.sender_profile_picture,
                          userType: item.user_type,
                          userTypeDetails: item.user_type_details,
                          commType: 'inApp',
                          showChatBubble:
                            item.user_type_details !== 'Dialer Contact',
                          showEmailIcon: isValidEmail(item.email),
                          showWhatsAppIcon:
                            !!item.whatsapp_number &&
                            item.whatsapp_number.trim() !== '',
                          whatsapp_number: item.whatsapp_number,
                          whatsappNumber: item.whatsapp_number,
                          phone: item.mobile_no,
                          showPhoneIcon: true,
                          useremail: profileInfo.email,
                          showMessageIcon: true,
                        })
                      }
                    >
                      {/* <View style={styles.whatsappContactAvatar}>
                      <Text style={styles.whatsappContactAvatarText}>
                        {item.name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>

                      <View style={styles.whatsappStatusDot} />
                    </View> */}

                      {/* <View style={styles.whatsappContactAvatar}>
                      {item.avatar ? (
                        <Image
                          source={item.avatar}
                          style={styles.whatsappContactAvatarImage}
                        />
                      ) : (
                        <Text style={styles.whatsappContactAvatarText}>
                          {item.name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      )}
                    </View> */}

                      <View style={styles.avatarContainer}>
                        {item.avatar ? (
                          <Image source={item.avatar} style={styles.avatar} />
                        ) : (
                          <View
                            style={[
                              styles.avatar,
                              {
                                backgroundColor: '#f0edff',
                                justifyContent: 'center',
                                alignItems: 'center',
                              },
                            ]}
                          >
                            <Text style={styles.whatsappContactAvatarText}>
                              {item.name?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                          </View>
                        )}

                        {item.unread > 0 && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>
                              {item.unread}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.whatsappContactInfo}>
                        <Text style={styles.whatsappContactName}>
                          {item.name}
                        </Text>
                        <View style={styles.whatsappContactTags}>
                          <View
                            style={[
                              styles.contactTag,
                              { backgroundColor: '#6C63FF20' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.contactTagText,
                                { color: '#6C63FF' },
                              ]}
                            >
                              {item.user_type}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.contactTag,
                              { backgroundColor: iconColor + '20' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.contactTagText,
                                { color: iconColor },
                              ]}
                            >
                              {item.user_type_details}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.contactIconsRow}>
                          {item.user_type_details !== 'Dialer Contact' && (
                            <TouchableOpacity
                              style={[styles.contactIconSmall]}
                              onPress={() => {
                                navigation.navigate('UserChatPage', {
                                  senderId: item.sender_id,
                                  userName: item.sender_name || item.user_name,
                                  userImage: item.sender_profile_picture,
                                  userType: item.user_type,
                                  userTypeDetails: item.user_type_details,
                                  commType: 'inApp',
                                  showChatBubble:
                                    item.user_type_details !== 'Dialer Contact',
                                  showEmailIcon: isValidEmail(item.email),
                                  showWhatsAppIcon:
                                    !!item.whatsapp_number &&
                                    item.whatsapp_number.trim() !== '',
                                  whatsapp_number: item.whatsapp_number,
                                  whatsappNumber: item.whatsapp_number,
                                  phone: item.mobile_no,
                                  showPhoneIcon: true,
                                  useremail: profileInfo.email,
                                  showMessageIcon: true,
                                });
                              }}
                            >
                              <Image
                                source={require('../../asset/chat.png')}
                                style={{
                                  width: 20,
                                  height: 20,
                                  resizeMode: 'contain',
                                }}
                              />
                            </TouchableOpacity>
                          )}
                          {isValidEmail(item.email) && (
                            <TouchableOpacity
                              style={[styles.contactIconSmall]}
                              onPress={() => {
                                navigation.navigate('UserChatPage', {
                                  senderId: item.sender_id,
                                  userName: item.sender_name || item.user_name,
                                  userImage: item.sender_profile_picture,
                                  userType: item.user_type,
                                  userTypeDetails: item.user_type_details,
                                  commType: 'email',
                                  showChatBubble:
                                    item.user_type_details !== 'Dialer Contact',
                                  showEmailIcon: isValidEmail(item.email),
                                  showWhatsAppIcon:
                                    !!item.whatsapp_number &&
                                    item.whatsapp_number.trim() !== '',
                                  whatsapp_number: item.whatsapp_number,
                                  whatsappNumber: item.whatsapp_number,
                                  phone: item.mobile_no,
                                  showPhoneIcon: true,
                                  useremail: profileInfo.email,
                                  showMessageIcon: true,
                                });
                              }}
                            >
                              <Image
                                source={require('../../asset/mail.png')}
                                style={{
                                  width: 20,
                                  height: 20,
                                  resizeMode: 'contain',
                                }}
                              />
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={[
                              styles.contactIconSmall,
                              { backgroundColor: '#4CAF5020' },
                            ]}
                            onPress={() => openModal('dial')}
                          >
                            <Image
                              source={require('../../asset/circle-call.png')}
                              style={{
                                width: 20,
                                height: 20,
                                resizeMode: 'contain',
                              }}
                            />
                          </TouchableOpacity>
                          {item.whatsapp_number &&
                            item.whatsapp_number.trim() !== '' && (
                              <TouchableOpacity
                                style={[styles.contactIconSmall]}
                                onPress={() => {
                                  navigation.navigate('UserChatPage', {
                                    senderId: item.sender_id,
                                    userName:
                                      item.sender_name || item.user_name,
                                    userImage: item.sender_profile_picture,
                                    userType: item.user_type,
                                    userTypeDetails: item.user_type_details,
                                    commType: 'WP',
                                    showChatBubble:
                                      item.user_type_details !==
                                      'Dialer Contact',
                                    showEmailIcon: isValidEmail(item.email),
                                    showWhatsAppIcon:
                                      !!item.whatsapp_number &&
                                      item.whatsapp_number.trim() !== '',
                                    whatsapp_number: item.whatsapp_number,
                                    whatsappNumber: item.whatsapp_number,
                                    phone: item.mobile_no,
                                    showPhoneIcon: true,
                                    useremail: profileInfo.email,
                                    showMessageIcon: true,
                                  });
                                }}
                              >
                                <Image
                                  source={require('../../asset/whatsapp.png')}
                                  style={{
                                    width: 20,
                                    height: 20,
                                    resizeMode: 'contain',
                                  }}
                                />
                              </TouchableOpacity>
                            )}
                          {item.mobile_no && item.mobile_no.trim() !== '' && (
                            <TouchableOpacity
                              style={[styles.contactIconSmall]}
                              onPress={() => {
                                navigation.navigate('UserChatPage', {
                                  senderId: item.sender_id,
                                  userName: item.sender_name || item.user_name,
                                  userImage: item.sender_profile_picture,
                                  userType: item.user_type,
                                  userTypeDetails: item.user_type_details,
                                  commType: 'sms',
                                  showChatBubble:
                                    item.user_type_details !== 'Dialer Contact',
                                  showEmailIcon: isValidEmail(item.email),
                                  showWhatsAppIcon:
                                    !!item.whatsapp_number &&
                                    item.whatsapp_number.trim() !== '',
                                  whatsapp_number: item.whatsapp_number,
                                  whatsappNumber: item.whatsapp_number,
                                  phone: item.mobile_no,
                                  showPhoneIcon: true,
                                  useremail: profileInfo.email,
                                  showMessageIcon: true,
                                });
                              }}
                            >
                              <Image
                                source={require('../../asset/message.png')}
                                style={{
                                  width: 20,
                                  height: 20,
                                  resizeMode: 'contain',
                                }}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListFooterComponent={
                    hasMorePages ? (
                      <TouchableOpacity
                        style={[
                          styles.loadMoreButton,
                          isLoadingMoreUsers && {
                            opacity: 0.6,
                          },
                        ]}
                        onPress={loadMoreUsers}
                        disabled={isLoadingMoreUsers}
                      >
                        {isLoadingMoreUsers ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.loadMoreText}>Load More</Text>

                            <Image
                              source={require('../../asset/arrow-down.png')}
                              style={{
                                width: 20,
                                height: 20,
                                resizeMode: 'contain',
                                tintColor: '#fff',
                              }}
                            />
                          </>
                        )}
                      </TouchableOpacity>
                    ) : null
                  }
                  ListEmptyComponent={
                    isLoadingMoreUsers ? (
                      <View style={styles.emptyUserContainer}>
                        <ActivityIndicator size="large" color="#6C63FF" />

                        <Text style={styles.emptyUserText}>
                          Loading contacts...
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.emptyUserContainer}>
                        <Text style={styles.emptyUserText}>
                          No contacts found
                        </Text>
                      </View>
                    )
                  }
                />
              </View>
            ) : (
              <View style={styles.dialNumberContainer}>
                {/* Phone Input */}
                <View style={styles.phoneInputContainer}>
                  <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={openCountryModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countryCode}>{selectedCountry}</Text>

                    <Image
                      source={require('../../asset/chevron-down.png')}
                      style={{
                        width: 16,
                        height: 16,
                        resizeMode: 'contain',
                        tintColor: '#666',
                      }}
                    />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.phoneInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Dialpad Numbers */}
                <View style={styles.dialpadContainer}>
                  {dialpadNumbers.map((row, idx) => (
                    <View key={idx} style={styles.dialpadRow}>
                      {row.map(renderDialpadButton)}
                    </View>
                  ))}
                </View>

                {/* Communication Button */}
                <View style={styles.callActions}>
                  {type === 'whatsapp' ? (
                    <TouchableOpacity
                      style={[
                        styles.callActionBtn,
                        { backgroundColor: '#25D366' },
                        isWPCalling && { opacity: 0.6 },
                      ]}
                      onPress={handleDialerWhatsApp}
                      disabled={isWPCalling}
                      activeOpacity={0.8}
                    >
                      {isWPCalling ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Image
                          source={require('../../asset/whatsapps.png')}
                          style={{
                            width: 24,
                            height: 24,
                            resizeMode: 'contain',
                            tintColor: '#FFFFFF',
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.callActionBtn,
                        { backgroundColor: '#061453' },
                        isSMSCalling && { opacity: 0.6 },
                      ]}
                      onPress={handleDialerMessage}
                      disabled={isSMSCalling}
                      activeOpacity={0.8}
                    >
                      {isSMSCalling ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Image
                          source={require('../../asset/chatbubbles.png')}
                          style={{
                            width: 24,
                            height: 24,
                            resizeMode: 'contain',
                            tintColor: '#FFFFFF',
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderActivityTimeModal = () => (
    <Modal
      visible={showActivityTimeModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowActivityTimeModal(false)}
    >
      <View style={styles.dialModalContainer}>
        <View style={styles.dialModalContent}>
          <View style={styles.dialModalHeader}>
            <Text style={styles.dialModalTitle}>Time Filter</Text>
            <Text style={styles.dialModalSubtitle}>
              Filter activities by time
            </Text>
            <TouchableOpacity
              style={styles.dialModalClose}
              onPress={() => setShowActivityTimeModal(false)}
            >
              <Image
                source={require('../../asset/close.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#666',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.activityFilterOptions}>
            {/* {activityTimeFilters.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.activityFilterOption,
                  activityTimeFilter === filter.id &&
                    styles.activityFilterOptionActive,
                ]}
                onPress={() => handleTimeFilterPress(item.id)}
              >
                <Text
                  style={[
                    styles.activityFilterOptionText,
                    activityTimeFilter === filter.id &&
                      styles.activityFilterOptionTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
                {activityTimeFilter === filter.id && (
                  <Image
                    source={require('../../asset/checkmark-circle.png')}
                    style={{
                      width: 24,
                      height: 24,
                      resizeMode: 'contain',
                      tintColor: '#6C63FF',
                    }}
                  />
                )}
              </TouchableOpacity>
            ))} */}

            {activityTimeFilters.map(filter => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => {
                  setActivityTimeFilter(filter.id);
                  setShowActivityTimeModal(false);
                }}
                style={styles.activityTimeFilterOption}
              >
                <Text>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDropdown = (options, selectedId, onSelect, label, dropdownId) => {
    const isOpen = activeDropdown === dropdownId;

    return (
      <View
        style={[styles.dropdownWrapper, isOpen && styles.dropdownWrapperOpen]}
      >
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => {
            setActiveDropdown(isOpen ? null : dropdownId);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownTriggerLabel}>{label}</Text>

          <View style={styles.dropdownTriggerValue}>
            <Text style={styles.dropdownTriggerText} numberOfLines={1}>
              {options.find(o => o.id === selectedId)?.label || 'Select'}
            </Text>

            <Image
              source={
                isOpen
                  ? require('../../asset/chevron_up.png')
                  : require('../../asset/chevron-down.png')
              }
              style={{
                width: 20,
                height: 20,
                resizeMode: 'contain',
                tintColor: '#666',
              }}
            />
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownMenuContainer}>
            <View style={styles.dropdownMenu}>
              <ScrollView
                style={styles.dropdownScrollView}
                contentContainerStyle={styles.dropdownScrollContent}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="always"
                bounces={false}
              >
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={`${option.id}-${index}`}
                    style={[
                      styles.dropdownItem,
                      selectedId === option.id && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      onSelect(option.id);
                      setActiveDropdown(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedId === option.id &&
                          styles.dropdownItemTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>

                    {selectedId === option.id && (
                      <Image
                        source={require('../../asset/checkmark.png')}
                        style={{
                          width: 18,
                          height: 18,
                          resizeMode: 'contain',
                          tintColor: '#6C63FF',
                        }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    );
  };
  const renderActivityQuickFilterModal = () => {
    return (
      <Modal
        visible={showActivityQuickFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowActivityQuickFilterModal(false);
          setActiveDropdown(null);
        }}
      >
        <View style={styles.quickFilterModalOverlay}>
          <View style={styles.quickFilterModalContent}>
            <View style={styles.quickFilterModalHeader}>
              <View>
                <Text style={styles.quickFilterModalTitle}>Quick Filter</Text>
                <Text style={styles.quickFilterModalSubtitle}>
                  Advanced activity filters
                </Text>
              </View>
              <TouchableOpacity
                style={styles.quickFilterModalClose}
                onPress={() => {
                  setShowActivityQuickFilterModal(false);
                  setActiveDropdown(null);
                }}
              >
                <Image
                  source={require('../../asset/close.png')}
                  style={{
                    width: 28,
                    height: 28,
                    resizeMode: 'contain',
                    tintColor: '#333',
                  }}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.quickFilterScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.quickFilterScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.quickFilterGroup}>
                <Text style={styles.quickFilterGroupLabel}>Search</Text>
                <View style={styles.quickFilterSearchContainer}>
                  <Image
                    source={require('../../asset/search.png')}
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                      tintColor: '#999',
                    }}
                  />
                  <TextInput
                    style={styles.quickFilterSearchInput}
                    placeholder="Search by name or keyword..."
                    placeholderTextColor="#999"
                    value={activityQuickSearch}
                    onChangeText={setActivityQuickSearch}
                  />
                  {activityQuickSearch.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setActivityQuickSearch('')}
                    >
                      <Image
                        source={require('../../asset/close-circle.png')}
                        style={{
                          width: 20,
                          height: 20,
                          resizeMode: 'contain',
                          tintColor: '#999',
                        }}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.quickFilterGrid}>
                {/* READ */}
                <View
                  style={[
                    styles.quickFilterGridItem,
                    activeDropdown === 'read' && styles.quickFilterGridItemOpen,
                  ]}
                >
                  {renderDropdown(
                    readStatusOptions,
                    activityReadStatus,
                    setActivityReadStatus,
                    'Read',
                    'read',
                  )}
                </View>

                {/* ROLE */}
                <View
                  style={[
                    styles.quickFilterGridItem,
                    activeDropdown === 'role' && styles.quickFilterGridItemOpen,
                  ]}
                >
                  {renderDropdown(
                    roleOptions,
                    activityRole,
                    setActivityRole,
                    'Role',
                    'role',
                  )}
                </View>

                {/* THREAD */}
                <View
                  style={[
                    styles.quickFilterGridItem,
                    activeDropdown === 'thread' &&
                      styles.quickFilterGridItemOpen,
                  ]}
                >
                  {renderDropdown(
                    threadOptions,
                    activityThread,
                    setActivityThread,
                    'Thread',
                    'thread',
                  )}
                </View>

                {/* CHANNEL */}
                <View
                  style={[
                    styles.quickFilterGridItem,
                    activeDropdown === 'channel' &&
                      styles.quickFilterGridItemOpen,
                  ]}
                >
                  {renderDropdown(
                    channelOptions,
                    activityChannel,
                    setActivityChannel,
                    'Channel',
                    'channel',
                  )}
                </View>

                {/* SORT */}
                <View
                  style={[
                    styles.quickFilterGridItem,
                    activeDropdown === 'sort' && styles.quickFilterGridItemOpen,
                  ]}
                >
                  {renderDropdown(
                    sortOptions,
                    activitySortBy,
                    handleSortChange,
                    'Sort',
                    'sort',
                  )}
                </View>

                {/* MIN. UNREAD */}
                <View
                  style={[
                    styles.quickFilterGridItem,
                    activeDropdown === 'minunread' &&
                      styles.quickFilterGridItemOpen,
                  ]}
                >
                  {renderDropdown(
                    minUnreadOptions,
                    activityMinUnread,
                    setActivityMinUnread,
                    'Min. Unread',
                    'minunread',
                  )}
                </View>
              </View>

              {(activityQuickSearch ||
                activityReadStatus !== 'all' ||
                activityRole !== 'all' ||
                activityThread !== 'all' ||
                activityChannel !== 'all' ||
                activityMinUnread !== '0' ||
                activitySortBy !== 'recent') && (
                <View style={styles.quickFilterActiveSummary}>
                  <Text style={styles.quickFilterActiveTitle}>
                    Active Filters:
                  </Text>
                  <View style={styles.quickFilterActiveChips}>
                    {activityQuickSearch && (
                      <TouchableOpacity
                        style={styles.quickFilterActiveChip}
                        onPress={() => setActivityQuickSearch('')}
                      >
                        <Text style={styles.quickFilterActiveChipText}>
                          Search: {activityQuickSearch}
                        </Text>
                        <View>
                          <Image
                            source={require('../../asset/close.png')}
                            style={{
                              width: 14,
                              height: 14,
                              resizeMode: 'contain',
                              tintColor: '#666',
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                    {activityReadStatus !== 'all' && (
                      <TouchableOpacity
                        style={styles.quickFilterActiveChip}
                        onPress={() => setActivityReadStatus('all')}
                      >
                        <Text style={styles.quickFilterActiveChipText}>
                          Read:{' '}
                          {
                            readStatusOptions.find(
                              o => o.id === activityReadStatus,
                            )?.label
                          }
                        </Text>
                        <View>
                          <Image
                            source={require('../../asset/close.png')}
                            style={{
                              width: 14,
                              height: 14,
                              resizeMode: 'contain',
                              tintColor: '#666',
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                    {activityRole !== 'all' && (
                      <TouchableOpacity
                        style={styles.quickFilterActiveChip}
                        onPress={() => setActivityRole('all')}
                      >
                        <Text style={styles.quickFilterActiveChipText}>
                          Role:{' '}
                          {roleOptions.find(o => o.id === activityRole)?.label}
                        </Text>
                        <View>
                          <Image
                            source={require('../../asset/close.png')}
                            style={{
                              width: 14,
                              height: 14,
                              resizeMode: 'contain',
                              tintColor: '#666',
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                    {activityThread !== 'all' && (
                      <TouchableOpacity
                        style={styles.quickFilterActiveChip}
                        onPress={() => setActivityThread('all')}
                      >
                        <Text style={styles.quickFilterActiveChipText}>
                          Thread:{' '}
                          {
                            threadOptions.find(o => o.id === activityThread)
                              ?.label
                          }
                        </Text>
                        <View>
                          <Image
                            source={require('../../asset/close.png')}
                            style={{
                              width: 14,
                              height: 14,
                              resizeMode: 'contain',
                              tintColor: '#666',
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                    {activityChannel !== 'all' && (
                      <TouchableOpacity
                        style={styles.quickFilterActiveChip}
                        onPress={() => setActivityChannel('all')}
                      >
                        <Text style={styles.quickFilterActiveChipText}>
                          Channel:{' '}
                          {
                            channelOptions.find(o => o.id === activityChannel)
                              ?.label
                          }
                        </Text>
                        <View>
                          <Image
                            source={require('../../asset/close.png')}
                            style={{
                              width: 14,
                              height: 14,
                              resizeMode: 'contain',
                              tintColor: '#666',
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                    {activityMinUnread !== '0' && (
                      <TouchableOpacity
                        style={styles.quickFilterActiveChip}
                        onPress={() => setActivityMinUnread('0')}
                      >
                        <Text style={styles.quickFilterActiveChipText}>
                          Min. Unread:{' '}
                          {
                            minUnreadOptions.find(
                              o => o.id === activityMinUnread,
                            )?.label
                          }
                        </Text>
                        <View>
                          <Image
                            source={require('../../asset/close.png')}
                            style={{
                              width: 14,
                              height: 14,
                              resizeMode: 'contain',
                              tintColor: '#666',
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                    {activitySortBy !== 'recent' && (
                      <TouchableOpacity
                        style={styles.quickFilterActiveChip}
                        onPress={() => setActivitySortBy('recent')}
                      >
                        <Text style={styles.quickFilterActiveChipText}>
                          Sort:{' '}
                          {
                            sortOptions.find(o => o.id === activitySortBy)
                              ?.label
                          }
                        </Text>
                        <View>
                          <Image
                            source={require('../../asset/close.png')}
                            style={{
                              width: 14,
                              height: 14,
                              resizeMode: 'contain',
                              tintColor: '#666',
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.quickFilterActions}>
                <TouchableOpacity
                  style={[
                    styles.quickFilterActionBtn,
                    styles.quickFilterResetBtn,
                  ]}
                  onPress={() => {
                    resetActivityFilters();
                    setActiveDropdown(null);
                  }}
                >
                  <Image
                    source={require('../../asset/refresh.png')}
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                      tintColor: '#FF4757',
                    }}
                  />
                  <Text style={styles.quickFilterResetBtnText}>
                    Reset Filters
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickFilterActionBtn,
                    styles.quickFilterApplyBtn,
                  ]}
                  onPress={() => {
                    setShowActivityQuickFilterModal(false);
                    setActiveDropdown(null);
                    console.log('press', activitySortBy);
                  }}
                >
                  <Image
                    source={require('../../asset/checkmark.png')}
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                      tintColor: '#fff',
                    }}
                  />
                  <Text style={styles.quickFilterApplyBtnText}>
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderActivityItem = ({ item }) => {
    const getBorderColor = () => {
      if (item.notSeenCount > 0) return '#6C63FF';
      switch (item.type) {
        case 'message':
          return '#6C63FF';
        case 'file':
          return '#2196F3';
        case 'approval':
          return '#4CAF50';
        case 'meeting':
          return '#FF9800';
        case 'system':
          return '#FF4757';
        case 'request':
          return '#9C27B0';
        case 'code':
          return '#00BCD4';
        default:
          return '#e9ecef';
      }
    };

    const borderColor = getBorderColor();
    const isUnread = item.notSeenCount > 0;

    return (
      <TouchableOpacity
        style={[
          styles.activityCard,
          {
            borderLeftColor: borderColor,
            borderLeftWidth: 4,
            borderColor: isUnread ? '#6C63FF' : '#f1f3f5',
            borderWidth: isUnread ? 1.5 : 1,
            backgroundColor: isUnread ? '#faf8ff' : '#fff',
          },
          isUnread && {
            shadowColor: '#6C63FF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}
        activeOpacity={0.7}
        onPress={async () => {
          const isGroup =
            item.source === 'group' ||
            item.originalData?.source === 'group' ||
            item.isChatGroup === true ||
            !!item.group_id ||
            !!item.originalData?.group_id;

          if (isGroup) {
            try {
              const groups = await fetchGroupsForMessageNav();

              if (!Array.isArray(groups) || groups.length === 0) {
                console.log('No groups available from API.');
                return;
              }

              const groupId =
                item.group_id || item.originalData?.group_id || item.senderId;

              const groupName =
                item.group_name ||
                item.originalData?.group_name ||
                item.userName;

              const selectedGroup = groups.find(group => {
                const idMatches =
                  groupId && String(group.group_id) === String(groupId);

                const nameMatches =
                  groupName &&
                  String(group.name || group.group_name)
                    .trim()
                    .toLowerCase() === String(groupName).trim().toLowerCase();

                return idMatches || nameMatches;
              });

              // Same fallback behavior as renderMessageSidebar
              const groupToOpen = selectedGroup || groups[0];

              console.log('OPENING ACTIVITY GROUP:', groupToOpen);

              navigation.navigate('GroupChat', {
                id: groupToOpen.id,
                senderId: groupToOpen.id,
                name: groupToOpen.name || groupToOpen.group_name,
                userName: groupToOpen.name || groupToOpen.group_name,
                group_id: groupToOpen.group_id,
                users: groupToOpen.users || [],
              });
            } catch (error) {
              console.log(
                'Unable to open activity group:',
                error.response?.data || error.message,
              );
            }

            return;
          }

          // Individual conversation: same behavior as renderMessageItem
          navigation.navigate('UserChatPage', {
            senderId: item.sender_id || item.senderId,
            userName:
              item.sender_name ||
              item.user_name ||
              item.userName ||
              'Unknown User',
            userImage: item.sender_profile_picture || item.avatar || null,
            userType: item.user_type,
            userTypeDetails: item.user_type_details,
            commType: 'inApp',

            showChatBubble: [
              'system admin',
              'office user',
              'department user',
            ].includes(
              String(item.sender_profile_type_details || item.userTag || '')
                .trim()
                .toLowerCase(),
            ),

            showEmailIcon: [
              'system admin',
              'office user',
              'department user',
            ].includes(
              String(item.sender_profile_type_details || item.userTag || '')
                .trim()
                .toLowerCase(),
            ),

            showWhatsAppIcon: [
              'system admin',
              'office user',
              'department user',
            ].includes(
              String(item.sender_profile_type_details || item.userTag || '')
                .trim()
                .toLowerCase(),
            ),

            showPhoneIcon: [
              'system admin',
              'office user',
              'department user',
            ].includes(
              String(item.sender_profile_type_details || item.userTag || '')
                .trim()
                .toLowerCase(),
            ),

            showMessageIcon: [
              'system admin',
              'office user',
              'department user',
            ].includes(
              String(item.sender_profile_type_details || item.userTag || '')
                .trim()
                .toLowerCase(),
            ),

            whatsapp_number: item.whatsapp_number || item.user_name || '',
            whatsappNumber: item.whatsapp_number || item.user_name || '',
            useremail: profileInfo.email,
            phone: item.mobile_no || '',
          });
        }}
      >
        <View style={styles.activityAvatar}>
          <Image
            source={
              avatarError[item.id] || !item.avatar
                ? require('../../asset/dummyuser.png')
                : { uri: item.avatar }
            }
            style={styles.activityAvatarImage}
            resizeMode="cover"
            onError={() => {
              setAvatarError(prev => ({
                ...prev,
                [item.id]: true,
              }));
            }}
          />

          {item.unreadCount > 0 && (
            <View style={styles.activityBadge}>
              <Text style={styles.activityBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.activityInfo}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityUserName}>{item.userName}</Text>
            <View
              style={[styles.activityTag, getActivityTagStyle(item.userTag)]}
            >
              <Text
                style={[
                  styles.activityTagText,
                  getActivityTagTextStyle(item.userTag),
                ]}
              >
                {item.userTag}
              </Text>
            </View>
          </View>
          <Text style={styles.activityMessage}>{item.message}</Text>
          <Text style={styles.activityDateTime}>
            {' '}
            {item.date} {item.time}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getActivityTagStyle = tag => {
    if (tag.includes('System Admin') || tag.includes('Admin'))
      return styles.activitySystemAdminTag;
    if (tag.includes('Client')) return styles.activityClientTag;
    if (tag.includes('Team')) return styles.activityTeamTag;
    return styles.activityDefaultTag;
  };

  const getActivityTagTextStyle = tag => {
    if (tag.includes('System Admin') || tag.includes('Admin'))
      return styles.activitySystemAdminText;
    if (tag.includes('Client')) return styles.activityClientText;
    if (tag.includes('Team')) return styles.activityTeamText;
    return styles.activityDefaultText;
  };

  const isValidEmail = email => {
    if (!email || email.trim() === '') {
      return false;
    }

    // Hide emails like:
    // dialer+919804043285+2@chat.local
    // dialer+<dynamic-number>+<dynamic-number>@chat.local
    const dialerEmailPattern = /^dialer\+[^@]+\+[^@]+@chat\.local$/i;

    if (dialerEmailPattern.test(email.trim())) {
      return false;
    }

    return true;
  };

  const renderUserItem = ({ item }) => {
    const contact = contacts.find(c => c.name === item.name);
    const hasUnread = item.unread > 0;

    const isGroup =
      item.isChatGroup === true ||
      item.tag === 'Groups' ||
      item.type === 'Groups' ||
      item.user_type === 'Groups' ||
      item.group_id != null;

    const getBorderColor = () => {
      if (hasUnread) return '#6C63FF';
      if (item.tag.includes('System Admin')) return '#4CAF50';
      if (item.tag.includes('Dialer')) return '#2196F3';
      if (item.tag.includes('Client')) return '#9C27B0';
      if (item.tag.includes('Team')) return '#FF9800';
      return '#f1f3f5';
    };

    const borderColor = getBorderColor();

    return (
      <TouchableOpacity
        style={[
          styles.userCard,
          {
            borderLeftColor: borderColor,
            borderLeftWidth: hasUnread ? 6 : 4,
            borderColor: hasUnread ? '#6C63FF' : '#f1f3f5',
            borderWidth: hasUnread ? 1.5 : 1,
            backgroundColor: hasUnread ? '#faf8ff' : '#fff',
          },
          hasUnread && {
            shadowColor: '#6C63FF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          },
        ]}
        onPress={() => {
          console.log('Clicked item:', item);
          console.log('Is group:', isGroup);
          if (isGroup) {
            navigation.navigate('GroupChat', {
              senderId: item.id,
              userName: item.name,
              users: item.users || [],
            });
          } else {
            navigation.navigate('UserChatPage', {
              senderId: item.sender_id,
              userName: item.sender_name || item.user_name,
              userImage: item.sender_profile_picture,
              userType: item.user_type,
              userTypeDetails: item.user_type_details,
              commType: 'inApp',
              showChatBubble: item.user_type_details !== 'Dialer Contact',
              showEmailIcon: isValidEmail(item.email),
              showWhatsAppIcon:
                !!item.whatsapp_number && item.whatsapp_number.trim() !== '',
              whatsapp_number: item.whatsapp_number || item.user_name,
              whatsappNumber: item.whatsapp_number || item.user_name,
              phone: item.mobile_no,
              showPhoneIcon: true,
              showMessageIcon: true,
              useremail: profileInfo.email,
            });
          }
        }}
      >
        <View style={styles.avatarContainer}>
          <Image source={item.avatar} style={styles.avatar} />
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unread}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={[styles.userName, hasUnread && styles.userNameUnread]}>
              {item.name}
            </Text>
            <View style={[styles.tagContainer, getTagStyle(item.tag)]}>
              <Text style={[styles.tagText, getTagTextStyle(item.tag)]}>
                {/* {item.tag} */}
                {item.user_type === 'Clients'
                  ? `${item.sub_details || ''}${
                      item.sub_details && item.tag ? ' • ' : ''
                    }${item.tag || ''}`
                  : item.tag}
              </Text>
            </View>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
          {!isGroup && (
            <View style={styles.userIconsRow}>
              {item.user_type_details !== 'Dialer Contact' && (
                <TouchableOpacity
                  style={[
                    styles.userIconSmall,
                    { backgroundColor: '#6C63FF20' },
                  ]}
                  onPress={() => {
                    navigation.navigate('UserChatPage', {
                      senderId: item.sender_id,
                      userName: item.sender_name || item.user_name,
                      userImage: item.sender_profile_picture,
                      userType: item.user_type,
                      userTypeDetails: item.user_type_details,
                      commType: 'inApp',
                      showChatBubble:
                        item.user_type_details !== 'Dialer Contact',
                      showEmailIcon: isValidEmail(item.email),
                      showWhatsAppIcon:
                        !!item.whatsapp_number &&
                        item.whatsapp_number.trim() !== '',
                      whatsapp_number: item.whatsapp_number || item.user_name,
                      whatsappNumber: item.whatsapp_number || item.user_name,
                      phone: item.mobile_no,
                      showPhoneIcon: true,
                      showMessageIcon: true,
                      useremail: profileInfo.email,
                    });
                  }}
                >
                  <Image
                    source={require('../../asset/chat.png')}
                    style={{
                      width: 24,
                      height: 24,
                      resizeMode: 'contain',
                    }}
                  />
                </TouchableOpacity>
              )}
              {isValidEmail(item.email) && (
                <TouchableOpacity
                  style={[styles.userIconSmall]}
                  onPress={() => {
                    navigation.navigate('UserChatPage', {
                      senderId: item.sender_id,
                      userName: item.sender_name || item.user_name,
                      userImage: item.sender_profile_picture,
                      userType: item.user_type,
                      userTypeDetails: item.user_type_details,
                      commType: 'email',
                      showChatBubble:
                        item.user_type_details !== 'Dialer Contact',
                      showEmailIcon: isValidEmail(item.email),
                      showWhatsAppIcon:
                        !!item.whatsapp_number &&
                        item.whatsapp_number.trim() !== '',
                      whatsapp_number: item.whatsapp_number || item.user_name,
                      whatsappNumber: item.whatsapp_number || item.user_name,
                      phone: item.mobile_no,
                      showPhoneIcon: true,
                      showMessageIcon: true,
                      useremail: profileInfo.email,
                    });
                  }}
                >
                  <Image
                    source={require('../../asset/mail.png')}
                    style={{
                      width: 24,
                      height: 24,
                      resizeMode: 'contain',
                    }}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.userIconSmall, { backgroundColor: '#4CAF5020' }]}
                onPress={() => openModal('dial')}
              >
                <Image
                  source={require('../../asset/circle-call.png')}
                  style={{
                    width: 24,
                    height: 24,
                    resizeMode: 'contain',
                  }}
                />
              </TouchableOpacity>
              {item.whatsapp_number && item.whatsapp_number.trim() !== '' && (
                <TouchableOpacity
                  style={[styles.userIconSmall]}
                  onPress={() => {
                    navigation.navigate('UserChatPage', {
                      senderId: item.sender_id,
                      userName: item.sender_name || item.user_name,
                      userImage: item.sender_profile_picture,
                      userType: item.user_type,
                      userTypeDetails: item.user_type_details,
                      commType: 'WP',
                      showChatBubble:
                        item.user_type_details !== 'Dialer Contact',
                      showEmailIcon: isValidEmail(item.email),
                      showWhatsAppIcon:
                        !!item.whatsapp_number &&
                        item.whatsapp_number.trim() !== '',
                      whatsapp_number: item.whatsapp_number || item.user_name,
                      whatsappNumber: item.whatsapp_number || item.user_name,
                      phone: item.mobile_no,
                      showPhoneIcon: true,
                      showMessageIcon: true,
                      useremail: profileInfo.email,
                    });
                  }}
                >
                  <Image
                    source={require('../../asset/whatsapp.png')}
                    style={{
                      width: 24,
                      height: 24,
                      resizeMode: 'contain',
                    }}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.userIconSmall]}
                onPress={() => {
                  navigation.navigate('UserChatPage', {
                    senderId: item.sender_id,
                    userName: item.sender_name || item.user_name,
                    userImage: item.sender_profile_picture,
                    userType: item.user_type,
                    userTypeDetails: item.user_type_details,
                    commType: 'sms',
                    showChatBubble: item.user_type_details !== 'Dialer Contact',
                    showEmailIcon: isValidEmail(item.email),
                    showWhatsAppIcon:
                      !!item.whatsapp_number &&
                      item.whatsapp_number.trim() !== '',
                    whatsapp_number: item.whatsapp_number || item.user_name,
                    whatsappNumber: item.whatsapp_number || item.user_name,
                    phone: item.mobile_no,
                    showPhoneIcon: true,
                    showMessageIcon: true,
                    useremail: profileInfo.email,
                  });
                }}
              >
                <Image
                  source={require('../../asset/message.png')}
                  style={{
                    width: 24,
                    height: 24,
                    resizeMode: 'contain',
                  }}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getTagStyle = tag => {
    if (tag.includes('System Admin')) return styles.systemAdminTag;
    if (tag.includes('Dialer')) return styles.dialerTag;
    if (tag.includes('Client')) return styles.clientTag;
    if (tag.includes('Team')) return styles.teamTag;
    return styles.defaultTag;
  };

  const getTagTextStyle = tag => {
    if (tag.includes('System Admin')) return styles.systemAdminText;
    if (tag.includes('Dialer')) return styles.dialerText;
    if (tag.includes('Client')) return styles.clientText;
    if (tag.includes('Team')) return styles.teamText;
    return styles.defaultText;
  };

  const renderActivitySection = () => {
    const filteredActivities = getFilteredActivity();
    const totalActivities = getTotalActivityCount();
    const unreadActivities = getUnreadActivityCount();

    const hasQuickFilters =
      activityQuickSearch ||
      activityReadStatus !== 'all' ||
      activityRole !== 'all' ||
      activityThread !== 'all' ||
      activityChannel !== 'all' ||
      activityMinUnread !== '0' ||
      activitySortBy !== 'recent';

    const activeFilterCount = [
      activityQuickSearch?.trim() !== '',
      activityReadStatus !== 'all',
      activityRole !== 'all',
      activityThread !== 'all',
      activityChannel !== 'all',
      activityMinUnread !== '0',
      activitySortBy !== 'recent',
    ].filter(Boolean).length;

    return (
      <View style={styles.activityContainer}>
        {/* <View style={styles.activityHeaderContainer}>
          <View style={styles.activityCountContainer}>
            <Text style={styles.activityTotalCount}>
              Total: {totalActivities}
            </Text>
          </View>
        </View> */}

        <View style={styles.activityHeaderContainer}>
          <View style={styles.activityTopRow}>
            {/* Total Activity Count */}
            <Text style={styles.activityTotalCount}>
              {hasQuickFilters
                ? `${filteredActivities.length} out of ${totalActivities} Activities`
                : `Total: ${totalActivities} Activities`}
            </Text>

            {/* Filter Buttons */}
            <View style={styles.activityFilterContainer}>
              <TouchableOpacity
                style={[
                  styles.activityFilterChip,
                  hasQuickFilters && styles.activityFilterChipActive,
                ]}
                onPress={() => openModal('activityQuickFilter')}
              >
                <Image
                  source={require('../../asset/options.png')}
                  style={{
                    width: 16,
                    height: 16,
                    resizeMode: 'contain',
                    tintColor: hasQuickFilters ? '#fff' : '#6C63FF',
                  }}
                />

                {activeFilterCount > 0 && (
                  <View style={styles.activityFilterCountBadge}>
                    <Text style={styles.activityFilterCountText}>
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.activityFilterChip}
                onPress={() => openModal('activityTime')}
              >
                <Image
                  source={require('../../asset/time.png')}
                  style={{
                    width: 16,
                    height: 16,
                    resizeMode: 'contain',
                    tintColor: '#6C63FF',
                  }}
                />
                <Text style={styles.activityFilterChipText}>
                  {activityTimeFilters.find(f => f.id === activityTimeFilter)
                    ?.label || 'This Week'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Icon */}
            <TouchableOpacity
              style={styles.activitySearchIconButton}
              onPress={() => setShowActivitySearch(prev => !prev)}
            >
              <Image
                source={require('../../asset/search.png')}
                style={styles.activitySearchIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Search Input - visible only when search icon is pressed */}
          {showActivitySearch && (
            <View style={styles.activitySearchContainer}>
              <Image
                source={require('../../asset/search.png')}
                style={{
                  width: 18,
                  height: 18,
                  resizeMode: 'contain',
                  tintColor: '#999',
                }}
              />
              <TextInput
                style={styles.activitySearchInput}
                placeholder="Search activities..."
                placeholderTextColor="#999"
                value={activityQuickSearch}
                onChangeText={setActivityQuickSearch}
              />
            </View>
          )}
        </View>

        {/* <View style={styles.activityFilterContainer}>
          <TouchableOpacity
            style={[
              styles.activityFilterChip,
              hasQuickFilters && styles.activityFilterChipActive,
            ]}
            onPress={() => openModal('activityQuickFilter')}
          >
            <Image
              source={require('../../asset/options.png')}
              style={{
                width: 16,
                height: 16,
                resizeMode: 'contain',
                tintColor: hasQuickFilters ? '#fff' : '#6C63FF',
              }}
            />
            <Text
              style={[
                styles.activityFilterChipText,
                hasQuickFilters && styles.activityFilterChipTextActive,
              ]}
            >
              Quick Filter
            </Text>
            {hasQuickFilters && (
              <View style={styles.filterBadgeSmall}>
                <Text style={styles.filterBadgeText}>!</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.activityFilterChip}
            onPress={() => openModal('activityTime')}
          >
            <Image
              source={require('../../asset/time.png')}
              style={{
                width: 16,
                height: 16,
                resizeMode: 'contain',
                tintColor: '#6C63FF',
              }}
            />
            <Text style={styles.activityFilterChipText}>
              {activityTimeFilters.find(f => f.id === activityTimeFilter)
                ?.label || 'This Week'}
            </Text>

            <Image
              source={require('../../asset/chevron-down.png')}
              style={{
                width: 16,
                height: 16,
                resizeMode: 'contain',
                tintColor: '#666',
              }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.activitySearchContainer}>
          <Image
            source={require('../../asset/search.png')}
            style={{
              width: 20,
              height: 20,
              resizeMode: 'contain',
              tintColor: '#999',
            }}
          />
          <TextInput
            style={styles.activitySearchInput}
            placeholder="Search activities..."
            placeholderTextColor="#999"
            value={activitySearch}
            onChangeText={setActivitySearch}
          />
          {activityQuickSearch && (
            <View style={styles.quickSearchIndicator}>
              <Text style={styles.quickSearchIndicatorText}>+</Text>
            </View>
          )}
        </View> */}

        {isLoadingActivity ? (
          <View style={styles.activityEmptyContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.activityEmptyText}>Loading activities...</Text>
          </View>
        ) : filteredActivities.length > 0 ? (
          <FlatList
            data={filteredActivities}
            renderItem={renderActivityItem}
            keyExtractor={item => item.id}
            extraData={activitySortBy}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.activityListContent}
            style={styles.activityFlatList}
          />
        ) : (
          <View style={styles.activityEmptyContainer}>
            <Image
              source={require('../../asset/notifications-off.png')}
              style={{
                width: 60,
                height: 60,
                resizeMode: 'contain',
                tintColor: '#6C63FF40',
              }}
            />

            <Text style={styles.activityEmptyText}>No activities found</Text>
            <Text style={styles.activityEmptySubtext}>
              Try changing your filters
            </Text>

            <TouchableOpacity
              style={styles.resetFiltersEmptyBtn}
              onPress={resetActivityFilters}
            >
              <Text style={styles.resetFiltersEmptyBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmailHistoryModal = () => (
    <Modal
      visible={showEmailHistory}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEmailHistory(false)}
    >
      <View style={styles.dialModalContainer}>
        <View style={styles.dialModalContent}>
          <View style={styles.dialModalHeader}>
            <Text style={styles.dialModalTitle}>Email History</Text>
            <Text style={styles.dialModalSubtitle}>
              View all sent and draft emails
            </Text>
            <TouchableOpacity
              style={styles.dialModalClose}
              onPress={() => setShowEmailHistory(false)}
            >
              <Image
                source={require('../../asset/close.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#666',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.emailHistoryContainer}>
            {emailHistory.length === 0 ? (
              <View style={styles.whatsappEmptyContainer}>
                <Image
                  source={require('../../asset/email.png')}
                  style={{
                    width: 60,
                    height: 60,
                    resizeMode: 'contain',
                    tintColor: '#6C63FF40',
                  }}
                />
                <Text style={styles.whatsappEmptyText}>No email history</Text>
              </View>
            ) : (
              <FlatList
                data={emailHistory}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <View style={styles.historyItemLeft}>
                      <Text style={styles.historyItemTo}>{item.to}</Text>
                      <Text style={styles.historyItemSubject}>
                        {item.subject}
                      </Text>
                      <Text style={styles.historyItemDate}>{item.date}</Text>
                    </View>
                    <View
                      style={[
                        styles.historyStatus,
                        item.status === 'Sent'
                          ? styles.sentStatus
                          : styles.draftStatus,
                      ]}
                    >
                      <Text style={styles.historyStatusText}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSignatureModal = () => (
    <Modal
      visible={showSignatureModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSignatureModal(false)}
    >
      <View style={styles.dialModalContainer}>
        <View style={styles.dialModalContent}>
          <View style={styles.dialModalHeader}>
            <Text style={styles.dialModalTitle}>Select Signature</Text>
            <Text style={styles.dialModalSubtitle}>
              Choose a signature to add to your email
            </Text>
            <TouchableOpacity
              style={styles.dialModalClose}
              onPress={() => setShowSignatureModal(false)}
            >
              <Image
                source={require('../../asset/close.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#666',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.signatureListContainer}>
            <FlatList
              data={signatures}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.signatureItem,
                    selectedSignature === item.id && styles.signatureItemActive,
                  ]}
                  onPress={() => {
                    setSelectedSignature(item.id);
                    setShowSignatureModal(false);
                  }}
                >
                  <View style={styles.signatureItemContent}>
                    <Text style={styles.signatureItemName}>{item.name}</Text>
                    <Text style={styles.signatureItemPreview} numberOfLines={2}>
                      {item.content.replace(/<[^>]*>/g, '')}
                    </Text>
                  </View>
                  {selectedSignature === item.id && (
                    <Image
                      source={require('../../asset/checkmark-circle.png')}
                      style={{
                        width: 24,
                        height: 24,
                        resizeMode: 'contain',
                        tintColor: '#6C63FF',
                      }}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addSignatureButton}
                  onPress={() => {
                    setShowSignatureModal(false);
                    openModal('addSignature');
                  }}
                >
                  <Image
                    source={require('../../asset/add-circle.png')}
                    style={{
                      width: 24,
                      height: 24,
                      resizeMode: 'contain',
                      tintColor: '#6C63FF',
                    }}
                  />
                  <Text style={styles.addSignatureText}>Add New Signature</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddSignatureModal = () => (
    <Modal
      visible={showAddSignatureModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddSignatureModal(false)}
    >
      <View style={styles.dialModalContainer}>
        <View style={styles.dialModalContent}>
          <View style={styles.dialModalHeader}>
            <Text style={styles.dialModalTitle}>Add Signature</Text>
            <Text style={styles.dialModalSubtitle}>Create a new signature</Text>
            <TouchableOpacity
              style={styles.dialModalClose}
              onPress={() => setShowAddSignatureModal(false)}
            >
              <Image
                source={require('../../asset/close.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#666',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.addSignatureContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Signature Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter signature name"
                value={signatureName}
                onChangeText={setSignatureName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Signature Content (HTML supported)
              </Text>
              <TextInput
                style={[styles.formInput, styles.textAreaInput]}
                placeholder="Enter signature content with HTML tags"
                value={signatureContent}
                onChangeText={setSignatureContent}
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.htmlHelperText}>
                Example: &lt;p&gt;Best regards,&lt;br/&gt;John Doe&lt;/p&gt;
              </Text>
            </View>

            <View style={styles.addSignatureActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowAddSignatureModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.saveButton,
                  isSavingSignature && { opacity: 0.6 },
                ]}
                onPress={handleSaveSignature}
                disabled={isSavingSignature}
              >
                {isSavingSignature ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Signature</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDashboardModal = () => (
    <Modal
      visible={showDashboardModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDashboardModal(false)}
    >
      <View style={styles.dialModalContainer}>
        <View style={styles.dialModalContent}>
          <View style={styles.dialModalHeader}>
            <Text style={styles.dialModalTitle}>Dashboard</Text>
            <Text style={styles.dialModalSubtitle}>
              Navigate to different sections
            </Text>
            <TouchableOpacity
              style={styles.dialModalClose}
              onPress={() => setShowDashboardModal(false)}
            >
              <Image
                source={require('../../asset/close.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#666',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.dashboardOptionsContainer}>
            {dashboardOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.dashboardOptionItem}
                onPress={() => {
                  setShowDashboardModal(false);

                  switch (option.id) {
                    case 'dashboard':
                      setActiveTab('directory');
                      break;

                    case 'tutorial':
                      setShowTutorialModal(true);
                      break;

                    case 'contacts':
                      setActiveTab('contacts');
                      break;

                    case 'faq':
                      setFaqVisible(true);
                      break;

                    default:
                      break;
                  }
                }}
              >
                <View
                  style={[
                    styles.dashboardOptionIcon,
                    { backgroundColor: '#6C63FF20' },
                  ]}
                >
                  <Image
                    source={option.icon}
                    style={{
                      width: 28,
                      height: 28,
                      resizeMode: 'contain',
                      tintColor: '#6C63FF',
                    }}
                  />
                </View>
                <View style={styles.dashboardOptionContent}>
                  <Text style={styles.dashboardOptionLabel}>
                    {option.label}
                  </Text>
                  <Text style={styles.dashboardOptionDesc}>
                    {option.id === 'dashboard'
                      ? 'Go to main dashboard'
                      : option.id === 'tutorial'
                      ? 'Learn how to use LeafCom'
                      : 'Frequently asked questions'}
                  </Text>
                </View>

                <Image
                  source={require('../../asset/chevron-forward.png')}
                  style={{
                    width: 24,
                    height: 24,
                    resizeMode: 'contain',
                    tintColor: '#999',
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderContactFilterModal = () => (
    <Modal
      visible={showContactFilter}
      transparent
      animationType="fade"
      onRequestClose={() => setShowContactFilter(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowContactFilter(false)}
      >
        <View style={styles.contactFilterModal}>
          <View style={styles.filterModalHeaderForContactModal}>
            <Text style={styles.filterModalTitle}>Filter Contacts</Text>
            <TouchableOpacity onPress={() => setShowContactFilter(false)}>
              <Image
                source={require('../../asset/close.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#666',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.contactFilterContent}>
            <Text style={styles.filterSectionTitle}>User Type</Text>
            <View style={styles.userTypeGrid}>
              {userTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.userTypeChip,
                    selectedUserType === type.id && styles.userTypeChipActive,
                  ]}
                  onPress={() => {
                    handleUserTypeSelect(type.id);
                    setSelectedSubType('All Users');
                  }}
                >
                  <Image
                    source={type.icon}
                    style={{
                      width: 16,
                      height: 16,
                      resizeMode: 'contain',
                      tintColor:
                        selectedUserType === type.id ? '#6C63FF' : '#666',
                    }}
                  />
                  <Text
                    style={[
                      styles.userTypeChipText,
                      selectedUserType === type.id &&
                        styles.userTypeChipTextActive,
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedUserType !== 'all' && (
              <>
                <Text style={[styles.filterSectionTitle, { marginTop: 16 }]}>
                  Sub Type
                </Text>
                <View style={styles.subTypeGrid}>
                  {subUserTypes[selectedUserType].map(sub => (
                    <TouchableOpacity
                      key={sub}
                      style={[
                        styles.subTypeChip,
                        selectedSubType === sub && styles.subTypeChipActive,
                      ]}
                      onPress={() => handleSubTypeSelect(sub)}
                    >
                      <Text
                        style={[
                          styles.subTypeChipText,
                          selectedSubType === sub &&
                            styles.subTypeChipTextActive,
                        ]}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.applyFilterButton}
              onPress={closeFilterAndOpenParent}
            >
              <Text style={styles.applyFilterText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderDialModal = () => (
    <Modal
      visible={showDialModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowDialModal(false);
        setActiveTab('directory');
      }}
    >
      <View style={styles.dialModalContainer}>
        <View style={styles.dialModalContent}>
          <View style={styles.dialModalHeader}>
            <Text style={styles.dialModalTitle}>Start a new conversation</Text>
            <Text style={styles.dialModalSubtitle}>
              Choose how you want to connect
            </Text>
            <TouchableOpacity
              style={styles.dialModalClose}
              onPress={() => {
                setShowDialModal(false);
                setActiveTab('directory');
              }}
            >
              <Image
                source={require('../../asset/close.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#666',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.dialTabs}>
            <TouchableOpacity
              style={[
                styles.dialTab,
                dialTab === 'number' && styles.dialTabActive,
              ]}
              onPress={() => setDialTab('number')}
            >
              <Text
                style={[
                  styles.dialTabText,
                  dialTab === 'number' && styles.dialTabTextActive,
                ]}
              >
                Phone Number
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dialTab,
                dialTab === 'contacts' && styles.dialTabActive,
              ]}
              onPress={() => setDialTab('contacts')}
            >
              <Text
                style={[
                  styles.dialTabText,
                  dialTab === 'contacts' && styles.dialTabTextActive,
                ]}
              >
                Contacts
              </Text>
            </TouchableOpacity>
          </View>

          {dialTab === 'number' ? (
            <View style={styles.dialNumberContainer}>
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={openCountryModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryCode}>{selectedCountry}</Text>
                  <Image
                    source={require('../../asset/chevron-down.png')}
                    style={{
                      width: 16,
                      height: 16,
                      resizeMode: 'contain',
                      tintColor: '#666',
                    }}
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.dialpadContainer}>
                {dialpadNumbers.map((row, idx) => (
                  <View key={idx} style={styles.dialpadRow}>
                    {row.map(renderDialpadButton)}
                  </View>
                ))}
              </View>

              <View style={styles.callActions}>
                <TouchableOpacity
                  style={[
                    styles.callActionBtn,
                    { backgroundColor: '#6C63FF' },
                    isCalling && { opacity: 0.6 },
                  ]}
                  onPress={handleDialerCall}
                  disabled={isCalling}
                  activeOpacity={0.8}
                >
                  {isCalling ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Image
                      source={require('../../asset/call.png')}
                      style={{ width: 25, height: 25, tintColor: '#FFFFFF' }}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.contactsContainer}>
              <View style={styles.contactSearchContainer}>
                <Image
                  source={require('../../asset/search.png')}
                  style={{
                    width: 20,
                    height: 20,
                    resizeMode: 'contain',
                    tintColor: '#999',
                  }}
                />
                <TextInput
                  style={styles.contactSearchInput}
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChangeText={setContactSearch}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.filterIconBtn}
                  onPress={() => openModal('contactFilter', 'dial')}
                >
                  <Image
                    source={require('../../asset/filter.png')}
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                      tintColor: '#6C63FF',
                    }}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.contactCountHeader}>
                <Text style={styles.contactCountText}>
                  {getFilteredContacts('all').length} contacts found
                </Text>
              </View>

              <FlatList
                data={getFilteredContacts('all')}
                renderItem={renderContactItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.contactList}
                ListFooterComponent={
                  contactsHasMorePages ? (
                    <TouchableOpacity
                      style={[
                        styles.loadMoreButton,
                        isLoadingMoreContacts && {
                          opacity: 0.6,
                        },
                      ]}
                      onPress={loadMoreContacts}
                      disabled={isLoadingMoreContacts}
                    >
                      {isLoadingMoreContacts ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.loadMoreText}>Load More</Text>

                          <Image
                            source={require('../../asset/arrow-down.png')}
                            style={{
                              width: 20,
                              height: 20,
                              resizeMode: 'contain',
                              tintColor: '#fff',
                            }}
                          />
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null
                }
                ListEmptyComponent={
                  isLoadingContacts ? (
                    <View style={styles.emptyUserContainer}>
                      <ActivityIndicator size="large" color="#6C63FF" />

                      <Text style={styles.emptyUserText}>
                        Loading contacts...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyUserContainer}>
                      <Text style={styles.emptyUserText}>
                        No contacts found
                      </Text>
                    </View>
                  )
                }
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  // const renderFilterModal = () => (
  //   <Modal
  //     visible={showFilterModal}
  //     transparent
  //     animationType="fade"
  //     onRequestClose={() => setShowFilterModal(false)}
  //   >
  //     <TouchableOpacity
  //       style={styles.modalOverlay}
  //       activeOpacity={1}
  //       onPress={() => setShowFilterModal(false)}
  //     >
  //       <View style={styles.filterModal}>
  //         <View style={styles.filterModalHeader}>
  //           <Text style={styles.filterModalTitle}>Filter by Category</Text>
  //           <TouchableOpacity onPress={() => setShowFilterModal(false)}>
  //             <Image
  //               source={require('../../asset/close.png')}
  //               style={{
  //                 width: 14,
  //                 height: 14,
  //                 resizeMode: 'contain',
  //                 tintColor: '#666',
  //               }}
  //             />
  //           </TouchableOpacity>
  //         </View>
  //         {/*
  //         <ScrollView
  //           style={styles.filterModalContent}
  //           showsVerticalScrollIndicator={false}
  //         >
  //           {categories.map(cat => (
  //             <View key={cat.id} style={styles.categorySection}>
  //               <View
  //                 style={[
  //                   styles.filterModalItem,
  //                   selectedCategory === cat.name &&
  //                     styles.filterModalItemActive,
  //                 ]}
  //               >
  //                 <View style={styles.filterModalItemLeft}>
  //                   <View
  //                     style={[
  //                       styles.categoryIcon,
  //                       { backgroundColor: cat.color + '20' },
  //                     ]}
  //                   >
  //                     <Image
  //                       source={cat.icon}
  //                       style={{
  //                         width: 20,
  //                         height: 20,
  //                         resizeMode: 'contain',
  //                         tintColor: cat.color,
  //                       }}
  //                     />
  //                   </View>
  //                   <View>
  //                     <Text
  //                       style={[
  //                         styles.filterModalItemText,
  //                         selectedCategory === cat.name &&
  //                           styles.filterModalItemTextActive,
  //                       ]}
  //                     >
  //                       {cat.name}
  //                     </Text>
  //                     <Text style={styles.filterModalSubText}>
  //                       {cat.subtitle}
  //                     </Text>
  //                   </View>
  //                 </View>
  //                 <View style={styles.filterModalItemRight}>
  //                   <View style={styles.countContainer}>
  //                     <View
  //                       style={[
  //                         styles.countBadge,
  //                         { backgroundColor: '#4a08b3fd' },
  //                       ]}
  //                     >
  //                       <Text style={[styles.countText, { color: '#FFF' }]}>
  //                         {cat.readCount}
  //                       </Text>
  //                     </View>
  //                     <View
  //                       style={[
  //                         styles.countBadge,
  //                         { backgroundColor: '#d30f20f8' },
  //                       ]}
  //                     >
  //                       <Text style={[styles.countText, { color: '#FFF' }]}>
  //                         {cat.unreadCount}
  //                       </Text>
  //                     </View>
  //                   </View>
  //                   <TouchableOpacity
  //                     style={styles.expandButton}
  //                     onPress={e => {
  //                       e.stopPropagation();
  //                       toggleCategoryExpand(cat.id);
  //                     }}
  //                   >
  //                     <Image
  //                       source={
  //                         expandedCategories[cat.id]
  //                           ? require('../../asset/chevron_up.png')
  //                           : require('../../asset/chevron-down.png')
  //                       }
  //                       style={{
  //                         width: 20,
  //                         height: 20,
  //                         resizeMode: 'contain',
  //                         tintColor: '#666',
  //                       }}
  //                     />
  //                   </TouchableOpacity>
  //                 </View>
  //               </View>

  //               {expandedCategories[cat.id] && (
  //                 <View style={styles.childContainer}>
  //                   {cat.children.map((child, index) => (
  //                     <TouchableOpacity
  //                       key={index}
  //                       style={styles.childItem}
  //                       onPress={() => handleSubTypePress(cat.name, child.name)}
  //                     >
  //                       <View style={styles.childItemLeft}>
  //                         <Image
  //                           source={child.icon}
  //                           style={{
  //                             width: 18,
  //                             height: 18,
  //                             resizeMode: 'contain',
  //                             tintColor: cat.color,
  //                           }}
  //                         />
  //                         <Text style={styles.childItemText}>{child.name}</Text>
  //                       </View>
  //                     </TouchableOpacity>
  //                   ))}
  //                 </View>
  //               )}
  //             </View>
  //           ))}
  //         </ScrollView> */}

  //         <FlatList
  //           data={categories}
  //           keyExtractor={item => String(item.id)}
  //           style={styles.filterModalContent}
  //           showsVerticalScrollIndicator={false}
  //           nestedScrollEnabled
  //           renderItem={({ item: cat }) => (
  //             <View style={styles.categorySection}>
  //               <View
  //                 style={[
  //                   styles.filterModalItem,
  //                   selectedCategory === cat.name &&
  //                     styles.filterModalItemActive,
  //                 ]}
  //               >
  //                 <View style={styles.filterModalItemLeft}>
  //                   <View
  //                     style={[
  //                       styles.categoryIcon,
  //                       { backgroundColor: cat.color + '20' },
  //                     ]}
  //                   >
  //                     <Image
  //                       source={cat.icon}
  //                       style={{
  //                         width: 20,
  //                         height: 20,
  //                         resizeMode: 'contain',
  //                         tintColor: cat.color,
  //                       }}
  //                     />
  //                   </View>

  //                   <View>
  //                     <Text
  //                       style={[
  //                         styles.filterModalItemText,
  //                         selectedCategory === cat.name &&
  //                           styles.filterModalItemTextActive,
  //                       ]}
  //                     >
  //                       {cat.name}
  //                     </Text>

  //                     <Text style={styles.filterModalSubText}>
  //                       {cat.subtitle}
  //                     </Text>
  //                   </View>
  //                 </View>

  //                 <View style={styles.filterModalItemRight}>
  //                   <View style={styles.countContainer}>
  //                     <View
  //                       style={[
  //                         styles.countBadge,
  //                         { backgroundColor: '#4a08b3fd' },
  //                       ]}
  //                     >
  //                       <Text style={[styles.countText, { color: '#FFF' }]}>
  //                         {cat.readCount}
  //                       </Text>
  //                     </View>

  //                     <View
  //                       style={[
  //                         styles.countBadge,
  //                         { backgroundColor: '#d30f20f8' },
  //                       ]}
  //                     >
  //                       <Text style={[styles.countText, { color: '#FFF' }]}>
  //                         {cat.unreadCount}
  //                       </Text>
  //                     </View>
  //                   </View>

  //                   <TouchableOpacity
  //                     style={styles.expandButton}
  //                     onPress={() => toggleCategoryExpand(cat.id)}
  //                   >
  //                     <Image
  //                       source={
  //                         expandedCategories[cat.id]
  //                           ? require('../../asset/chevron_up.png')
  //                           : require('../../asset/chevron-down.png')
  //                       }
  //                       style={{
  //                         width: 20,
  //                         height: 20,
  //                         resizeMode: 'contain',
  //                         tintColor: '#666',
  //                       }}
  //                     />
  //                   </TouchableOpacity>
  //                 </View>
  //               </View>

  //               {expandedCategories[cat.id] && (
  //                 <View style={styles.childContainer}>
  //                   {cat.children.map((child, index) => (
  //                     <TouchableOpacity
  //                       key={`${cat.id}-${index}`}
  //                       style={styles.childItem}
  //                       onPress={() => handleSubTypePress(cat.name, child.name)}
  //                     >
  //                       <View style={styles.childItemLeft}>
  //                         <Image
  //                           source={child.icon}
  //                           style={{
  //                             width: 18,
  //                             height: 18,
  //                             resizeMode: 'contain',
  //                             tintColor: cat.color,
  //                           }}
  //                         />

  //                         <Text style={styles.childItemText}>{child.name}</Text>
  //                       </View>
  //                     </TouchableOpacity>
  //                   ))}
  //                 </View>
  //               )}
  //             </View>
  //           )}
  //         />
  //       </View>
  //     </TouchableOpacity>
  //   </Modal>
  // );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
      statusBarTranslucent
    >
      <View style={styles.filerModalOverlay}>
        <View style={styles.filterModal}>
          {/* Header */}
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filter by Category</Text>

            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Image
                source={require('../../asset/close.png')}
                style={{
                  width: 20,
                  height: 20,
                  resizeMode: 'contain',
                  tintColor: '#666',
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Scrollable categories */}
          <FlatList
            data={categories}
            keyExtractor={item => String(item.id)}
            renderItem={({ item: cat }) => (
              <View style={styles.categorySection}>
                {/* Category row */}
                <TouchableOpacity
                  style={[
                    styles.filterModalItem,
                    selectedCategory === cat.name &&
                      styles.filterModalItemActive,
                  ]}
                  onPress={() => {
                    if (
                      cat.id === 'groups' ||
                      cat.name?.toLowerCase() === 'groups'
                    ) {
                      setSelectedCategory('Groups');
                      setShowFilterModal(false);
                      fetchGroups();
                    } else {
                      setSelectedCategory(cat.name);
                      handleSubTypePress(cat.name);
                    }
                  }}
                >
                  <View style={styles.filterModalItemLeft}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: cat.color + '20' },
                      ]}
                    >
                      <Image
                        source={cat.icon}
                        style={{
                          width: 20,
                          height: 20,
                          resizeMode: 'contain',
                          tintColor: cat.color,
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.filterModalItemText,
                          selectedCategory === cat.name &&
                            styles.filterModalItemTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>

                      <Text style={styles.filterModalSubText}>
                        {cat.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.filterModalItemRight}>
                    <View style={styles.countContainer}>
                      <TouchableOpacity
                        style={[
                          styles.countBadge,
                          { backgroundColor: '#4a08b3fd' },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedCategory(cat.name);
                          handleSubTypePress(cat.name, undefined, true);
                        }}
                      >
                        <Text style={[styles.countText, { color: '#FFF' }]}>
                          {cat.readCount}
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={[
                          styles.countBadge,
                          { backgroundColor: '#d30f20f8' },
                        ]}
                      >
                        <Text style={[styles.countText, { color: '#FFF' }]}>
                          {cat.unreadCount}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => toggleCategoryExpand(cat.id)}
                    >
                      <Image
                        source={
                          expandedCategories[cat.id]
                            ? require('../../asset/chevron_up.png')
                            : require('../../asset/chevron-down.png')
                        }
                        style={{
                          width: 20,
                          height: 20,
                          resizeMode: 'contain',
                          tintColor: '#666',
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Expanded child items */}
                {expandedCategories[cat.id] && (
                  <View style={styles.childContainer}>
                    {cat.children.map((child, index) => (
                      <TouchableOpacity
                        key={`${cat.id}-${index}`}
                        style={styles.childItem}
                        onPress={() => {
                          if (
                            cat.id === 'groups' ||
                            cat.name?.toLowerCase() === 'groups'
                          ) {
                            setSelectedCategory('Groups');
                            setShowFilterModal(false);
                            fetchGroups();
                          } else {
                            handleSubTypePress(cat.name, child.name);
                          }
                        }}
                      >
                        <View style={styles.childItemLeft}>
                          <Image
                            source={child.icon}
                            style={{
                              width: 18,
                              height: 18,
                              resizeMode: 'contain',
                              tintColor: cat.color,
                            }}
                          />

                          <Text style={styles.childItemText}>{child.name}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
            style={styles.filterModalContent}
            contentContainerStyle={{
              paddingBottom: 20,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
          />
        </View>
      </View>
    </Modal>
  );
  const renderTimeModal = () => (
    <Modal
      visible={showTimeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTimeModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowTimeModal(false)}
      >
        <View style={styles.filterModal}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filter by Time</Text>
            <TouchableOpacity onPress={() => setShowTimeModal(false)}>
              <Image
                source={require('../../asset/close.png')}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                  tintColor: '#666',
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.filterModalContent}>
            {timeFilters.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterModalItem,
                  (filter.id === 'unread'
                    ? showUnread
                    : selectedTimeFilter === filter.id) &&
                    styles.filterModalItemActive,
                ]}
                onPress={() => {
                  handleTimeFilterPress(filter.id);
                  setShowTimeModal(false);
                }}
              >
                <View style={styles.filterModalItemLeft}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: filter.color + '20' },
                    ]}
                  >
                    <Image
                      source={filter.icon}
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                        tintColor: filter.color,
                      }}
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterModalItemText,
                      (filter.id === 'unread'
                        ? showUnread
                        : selectedTimeFilter === filter.id) &&
                        styles.filterModalItemTextActive,
                    ]}
                  >
                    {getFilterName(filter.id)}
                  </Text>
                </View>
                {selectedTimeFilter === filter.id && (
                  <Image
                    source={require('../../asset/checkmark-circle.png')}
                    style={{
                      width: 24,
                      height: 24,
                      resizeMode: 'contain',
                      tintColor: '#6C63FF',
                    }}
                  />
                )}
                {filter.id === 'unread' && showUnread && (
                  <Image
                    source={require('../../asset/checkmark-circle.png')}
                    style={{
                      width: 24,
                      height: 24,
                      resizeMode: 'contain',
                      tintColor: '#6C63FF',
                    }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderEmailSection = () => (
    <View style={styles.emailContainer}>
      {communicationFilter === 'email' && (
        <View style={styles.emailFormWrapper}>
          <ScrollView
            style={styles.emailFormContainer}
            contentContainerStyle={styles.emailFormContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            bounces={true}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>To</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter recipient email"
                value={emailTo}
                onChangeText={setEmailTo}
                placeholderTextColor="#999"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: '#b80c0c' }]}>
                Send From {profileInfo.email}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter subject"
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Body</Text>
              <TextInput
                style={[styles.formInput, styles.textAreaInput]}
                placeholder="Write your email..."
                value={emailBody}
                onChangeText={setEmailBody}
                placeholderTextColor="#999"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.signatureHeader}>
                <Text style={styles.formLabel}>Signature</Text>

                <TouchableOpacity
                  style={styles.addSignatureHeaderButton}
                  onPress={() => {
                    if (!isLoadingSignatures) {
                      openModal('addSignature');
                    }
                  }}
                  disabled={isLoadingSignatures}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addSignatureHeaderButtonText}>
                    + Add{' '}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.signatureSelector}
                onPress={() => {
                  if (!isLoadingSignatures) {
                    openModal('signature');
                  }
                }}
                activeOpacity={0.7}
                disabled={isLoadingSignatures}
              >
                {isLoadingSignatures ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <ActivityIndicator size="small" color="#6C63FF" />

                    <Text
                      style={[
                        styles.signatureSelectorText,
                        {
                          marginLeft: 10,
                          color: '#999',
                        },
                      ]}
                    >
                      Loading signatures...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.signatureSelectorText}>
                      {selectedSignature
                        ? signatures.find(s => s.id === selectedSignature)?.name
                        : 'Select Signature'}
                    </Text>

                    <Image
                      source={require('../../asset/chevron-down.png')}
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                        tintColor: '#666',
                      }}
                    />
                  </>
                )}
              </TouchableOpacity>

              {!isLoadingSignatures && selectedSignature && (
                <View style={styles.signaturePreview}>
                  <Text style={styles.signaturePreviewLabel}>Preview:</Text>

                  <Text style={styles.signaturePreviewText} numberOfLines={2}>
                    {signatures.find(s => s.id === selectedSignature)
                      ?.content || 'Signature content is not available.'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.emailActions}>
              <TouchableOpacity
                style={[
                  styles.emailActionBtn,
                  styles.sendBtn,
                  isSendingEmail && { opacity: 0.6 },
                ]}
                onPress={handleSendEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Image
                      source={require('../../asset/send.png')}
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                        tintColor: '#fff',
                      }}
                    />

                    <Text style={styles.sendBtnText}>Send</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={[styles.emailActionBtn, styles.historyBtn]}
                onPress={() => openModal('emailHistory')}
              >
                <Image
                  source={require('../../asset/time.png')}
                  style={{
                    width: 20,
                    height: 20,
                    resizeMode: 'contain',
                    tintColor: '#6C63FF',
                  }}
                />

                <Text style={styles.historyBtnText}>History</Text>
              </TouchableOpacity> */}
            </View>

            {/* Extra bottom space so last buttons can scroll above modal edge */}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderSideNav = () => (
    <Modal
      visible={showSideNav}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSideNav(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSideNav(false)}
      >
        <View style={styles.sideNavModal}>
          <View style={styles.sideNavHeader}>
            <Image
              source={
                profileInfo.profile_picture
                  ? { uri: profileInfo.profile_picture }
                  : require('../../asset/dummyuser.png')
              }
              style={styles.sideNavAvatar}
            />
            <Text style={styles.sideNavName}>
              {profileInfo.user_name || 'User'}
            </Text>

            <Text style={styles.sideNavEmail}>
              {profileInfo.email || 'No email available'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sideNavItem,
              activeTab === 'directory' && styles.activeSideNav,
            ]}
            onPress={() => {
              setActiveTab('directory');
              setShowSideNav(false);
            }}
          >
            <Image
              source={require('../../asset/grid.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: activeTab === 'directory' ? '#6C63FF' : '#666',
              }}
            />
            <Text
              style={[
                styles.sideNavText,
                activeTab === 'directory' && styles.activeSideNavText,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideNavItem}
            onPress={() => {
              setShowSideNav(false);
              setDialTab('contacts');
              openModal('dial');
            }}
          >
            <Image
              source={require('../../asset/call.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: '#666',
              }}
            />
            <Text style={styles.sideNavText}>Dial</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sideNavItem}
            onPress={() => {
              setShowSideNav(false);
              openModal('message');
            }}
          >
            <Image
              source={require('../../asset/chatbubbles.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: '#666',
              }}
            />
            <Text style={styles.sideNavText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideNavItem}
            onPress={() => {
              setShowSideNav(false);
              setShowWhatsAppModal(true);
            }}
          >
            <Image
              source={require('../../asset/whatsapps.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: '#666',
              }}
            />
            <Text style={styles.sideNavText}>Whatsapp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideNavItem}
            onPress={() => {
              setShowSideNav(false);

              setShowTutorialModal(true);
            }}
          >
            <Image
              source={require('../../asset/help-circle.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: '#666',
              }}
            />
            <Text style={styles.sideNavText}>Tutorial</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sideNavItem}
            onPress={() => {
              setShowSideNav(false);

              setFaqVisible(true);
            }}
          >
            <Image
              source={require('../../asset/information-circle.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: '#666',
              }}
            />
            <Text style={styles.sideNavText}>FAQ</Text>
          </TouchableOpacity>
          <View style={styles.sideNavDivider} />

          <TouchableOpacity style={styles.sideNavItem}>
            <Image
              source={require('../../asset/log-out-outline.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: '#FF4757',
              }}
            />
            <Text style={[styles.sideNavText, { color: '#FF4757' }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const rendertutorialModal = () => (
    <Modal
      visible={showTutorialModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowTutorialModal(false)}
      statusBarTranslucent={false}
    >
      <View style={styles.tutorialModalContainer}>
        {/* Header */}
        <View style={styles.tutorialHeader}>
          <Text style={styles.tutorialTitle}>Tutorial</Text>

          <TouchableOpacity
            onPress={() => setShowTutorialModal(false)}
            style={styles.tutorialCloseButton}
          >
            <Text style={styles.tutorialCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* PDF Viewer */}
        <Pdf
          source={{
            uri: TUTORIAL_PDF_URL,
            cache: true,
          }}
          style={styles.tutorialPdf}
          trustAllCerts={false}
          enablePaging={false}
          horizontal={false}
          spacing={8}
          fitPolicy={0}
          onLoadComplete={numberOfPages => {
            console.log('PDF Pages:', numberOfPages);
          }}
          onError={error => {
            console.log('PDF Load Error:', error);
          }}
          renderActivityIndicator={() => (
            <ActivityIndicator size="large" color="#76577F" />
          )}
        />
      </View>
    </Modal>
  );

  // ============================================================
  // RENDER: BOTTOM FIXED ICONS (like bottom navigation)
  // ============================================================
  const renderBottomFixedIcons = () => {
    return (
      <View style={styles.bottomFixedContainer}>
        {/* WhatsApp Icon - Left */}
        <TouchableOpacity
          style={styles.bottomFixedIconWrapper}
          onPress={() => openModal('whatsapp')}
          activeOpacity={0.7}
        >
          <View style={[styles.bottomFixedIcon, styles.bottomFixedWhatsApp]}>
            <Image
              source={require('../../asset/whatsapps.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: '#25D366',
              }}
            />
          </View>
          <Text style={[styles.bottomFixedLabel, { color: '#25D366' }]}>
            WhatsApp
          </Text>
        </TouchableOpacity>

        {/* Call Icon - Center */}
        <TouchableOpacity
          style={styles.bottomFixedIconWrapper}
          onPress={() => openModal('dial')}
          activeOpacity={0.7}
        >
          <View style={[styles.bottomFixedIcon, styles.bottomFixedCall]}>
            <Image
              source={require('../../asset/call.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: '#4CAF50',
              }}
            />
          </View>
          <Text style={[styles.bottomFixedLabel, { color: '#4CAF50' }]}>
            Call
          </Text>
        </TouchableOpacity>

        {/* In-App Message Icon - Right */}
        <TouchableOpacity
          style={styles.bottomFixedIconWrapper}
          onPress={() => openModal('message')}
          activeOpacity={0.7}
        >
          <View style={[styles.bottomFixedIcon, styles.bottomFixedMessage]}>
            <Image
              source={require('../../asset/chatbubbles.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: '#6C63FF',
              }}
            />
          </View>
          <Text style={[styles.bottomFixedLabel, { color: '#6C63FF' }]}>
            Message
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================
  // RENDER: BODY CONTENT - FIXED LAYOUT
  // ============================================================
  const renderBodyContent = () => {
    return (
      <View style={styles.bodyContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === 'directory' && styles.activeNavItem,
            ]}
            onPress={() => setActiveTab('directory')}
          >
            <Image
              source={require('../../asset/people.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: activeTab === 'directory' ? '#6C63FF' : '#999',
              }}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'directory' && styles.activeNavLabel,
              ]}
            >
              Directory
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === 'activity' && styles.activeNavItem,
            ]}
            onPress={() => setActiveTab('activity')}
          >
            <Image
              source={require('../../asset/notification.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: activeTab === 'activity' ? '#6C63FF' : '#999',
              }}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'activity' && styles.activeNavLabel,
              ]}
            >
              Activity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === 'email' && styles.activeNavItem,
            ]}
            onPress={() => setActiveTab('email')}
          >
            <Image
              source={require('../../asset/email.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: activeTab === 'email' ? '#6C63FF' : '#999',
              }}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'email' && styles.activeNavLabel,
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === 'call' && styles.activeNavItem,
            ]}
            onPress={() => {
              setActiveTab('call');
              openModal('dial');
            }}
          >
            <Image
              source={require('../../asset/call.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: activeTab === 'call' ? '#6C63FF' : '#999',
              }}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'call' && styles.activeNavLabel,
              ]}
            >
              Dial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === 'meesages' && styles.activeNavItem,
            ]}
            onPress={() => {
              setActiveTab('meesages');
              setShowMessageSidebar(true);
            }}
          >
            <Image
              source={require('../../asset/chatbubbles.png')}
              style={{
                width: 24,
                height: 24,
                resizeMode: 'contain',
                tintColor: activeTab === 'meesages' ? '#6C63FF' : '#999',
              }}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'meesages' && styles.activeNavLabel,
              ]}
            >
              Messages
            </Text>
          </TouchableOpacity> */}
        </View>

        {activeTab === 'directory' && (
          <>
            <View style={styles.searchContainer}>
              <Image
                source={require('../../asset/search.png')}
                style={{
                  width: 20,
                  height: 20,
                  resizeMode: 'contain',
                  tintColor: '#999',
                }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor="#999"
                value={conversationSearch}
                onChangeText={setConversationSearch}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>

            <View style={styles.filterIconsContainer}>
              <TouchableOpacity
                style={[
                  styles.filterIconButton,
                  selectedCategory !== 'All' && styles.activeFilterIcon,
                ]}
                onPress={() => openModal('filter')}
              >
                <Image
                  source={require('../../asset/filter.png')}
                  style={{
                    width: 22,
                    height: 22,
                    resizeMode: 'contain',
                    tintColor: selectedCategory !== 'All' ? '#6C63FF' : '#666',
                  }}
                />
                <View style={styles.filterLabelContainer}>
                  <Text
                    style={[
                      styles.filterIconLabel,
                      selectedCategory !== 'All' && styles.activeFilterLabel,
                    ]}
                  >
                    {selectedCategory !== 'All' ? selectedCategory : 'All'}
                  </Text>
                  {selectedCategory === 'All' && (
                    <View style={styles.filterCountContainer}>
                      <View
                        style={[
                          styles.countBadgeSmall,
                          { backgroundColor: '#4a08b3fd' },
                        ]}
                      >
                        <Text
                          style={[styles.countTextSmall, { color: '#fff' }]}
                        >
                          {totalReadCount}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.countBadgeSmall,
                          { backgroundColor: '#d30f20f8' },
                        ]}
                      >
                        <Text
                          style={[styles.countTextSmall, { color: '#fff' }]}
                        >
                          {totalUnreadCount}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                {selectedCategory !== 'All' && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>1</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterIconButton,
                  (showUnread || selectedTimeFilter !== 'Recent') &&
                    styles.activeFilterIcon,
                ]}
                onPress={() => openModal('time')}
              >
                <Image
                  source={require('../../asset/time.png')}
                  style={{
                    width: 22,
                    height: 22,
                    resizeMode: 'contain',
                    tintColor:
                      showUnread || selectedTimeFilter !== 'Recent'
                        ? '#6C63FF'
                        : '#666',
                  }}
                />
                <Text
                  style={[
                    styles.filterIconLabel,
                    (showUnread || selectedTimeFilter !== 'Recent') &&
                      styles.activeFilterLabel,
                  ]}
                >
                  {getFilterName(selectedTimeFilter)}
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.userList}
              ListFooterComponent={
                hasMorePages ? (
                  <TouchableOpacity
                    style={[
                      styles.loadMoreButton,
                      isLoadingMoreUsers && {
                        opacity: 0.6,
                      },
                    ]}
                    onPress={loadMoreUsers}
                    disabled={isLoadingMoreUsers}
                  >
                    {isLoadingMoreUsers ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.loadMoreText}>Load More</Text>

                        <Image
                          source={require('../../asset/arrow-down.png')}
                          style={{
                            width: 20,
                            height: 20,
                            resizeMode: 'contain',
                            tintColor: '#fff',
                          }}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                ) : null
              }
              ListEmptyComponent={
                isLoadingUsers ? (
                  <View style={styles.emptyUserContainer}>
                    <ActivityIndicator size="large" color="#6C63FF" />

                    <Text style={styles.emptyUserText}>Loading users...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyUserContainer}>
                    <Text style={styles.emptyUserText}>No users found</Text>
                  </View>
                )
              }
            />
          </>
        )}

        {activeTab === 'activity' && renderActivitySection()}

        {activeTab === 'email' && renderEmailSection()}
      </View>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  if (isLoadingCategories) {
    return (
      <View style={styles.fullScreenLoader}>
        <Loader></Loader>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      {renderTopBar()}

      {renderSideNav()}
      {renderMessageSidebar()}
      {rendertutorialModal()}

      {renderBodyContent()}

      {renderBottomFixedIcons()}

      {renderFilterModal()}
      {renderTimeModal()}
      {renderDialModal()}
      {renderContactFilterModal()}
      {renderSignatureModal()}
      {renderAddSignatureModal()}
      {renderContactListModal(
        'WhatsApp Contacts',
        'whatsapp',
        require('../../asset/whatsapp.png'),
        '#25D366',
      )}
      {renderContactListModal(
        'Message Contacts',
        'message',
        require('../../asset/message.png'),
        '#061453',
      )}
      {renderDashboardModal()}
      {renderEmailHistoryModal()}
      {renderActivityTimeModal()}
      {renderActivityQuickFilterModal()}

      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.countryModalOverlay}>
          <View style={styles.countryModalContainer}>
            <View style={styles.countryModalHeader}>
              <Text style={styles.countryModalTitle}>Select Country</Text>

              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Text style={styles.countryModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.countrySearchContainer}>
              <Image
                source={require('../../asset/search.png')}
                style={styles.countrySearchIcon}
              />

              <TextInput
                style={styles.countrySearchInput}
                placeholder="Search country or dial code..."
                placeholderTextColor="#999"
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoCorrect={false}
              />

              {countrySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCountrySearch('')}>
                  <Text style={styles.countrySearchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {countryLoading ? (
              <ActivityIndicator
                size="large"
                color="#76577F"
                style={{ marginVertical: 30 }}
              />
            ) : (
              <FlatList
                data={countryCodes.filter(item => {
                  const search = countrySearch.trim().toLowerCase();

                  if (!search) return true;

                  return (
                    item.name?.toLowerCase().includes(search) ||
                    item.country_code?.toLowerCase().includes(search) ||
                    String(item.country_phone_code || '')
                      .toLowerCase()
                      .includes(search)
                  );
                })}
                keyExtractor={item => String(item.id)}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={15}
                renderItem={({ item }) => {
                  const isSelected =
                    selectedCountryCode === item.country_code &&
                    selectedCountry === item.country_phone_code;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.countryItem,
                        isSelected && styles.selectedCountryItem,
                      ]}
                      onPress={() => handleCountrySelect(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.countryItemDetails}>
                        <Text style={styles.countryItemName}>{item.name}</Text>

                        <Text style={styles.countryItemISO}>
                          {item.country_code}
                        </Text>
                      </View>

                      <Text style={styles.countryItemPhoneCode}>
                        {item.country_phone_code}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.emptyCountryText}>
                    No countries available.
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInCallModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleHangUp}
      >
        <View style={styles.inCallOverlay}>
          <View style={styles.inCallCard}>
            <Image
              source={require('../../asset/call.png')}
              style={styles.inCallPhoneIcon}
              resizeMode="contain"
            />

            <Text style={styles.inCallTitle}>Call in progress</Text>

            <Text style={styles.inCallNumber}>{callPhoneNumber}</Text>

            <Text style={styles.inCallStatus}>{callStatus}</Text>

            <View style={styles.inCallActions}>
              <TouchableOpacity
                style={[styles.muteButton, isMuted && styles.muteButtonActive]}
                onPress={handleToggleMute}
                activeOpacity={0.8}
              >
                <Text style={styles.muteButtonText}>
                  {isMuted ? 'Unmute' : 'Mute'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hangupButton}
                onPress={handleHangUp}
                activeOpacity={0.8}
              >
                <Text style={styles.hangupButtonText}>Hang Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FAQModal visible={faqVisible} onClose={() => setFaqVisible(false)} />
    </SafeAreaView>
  );
};

// ============================================================
// INITIAL USER DATA
// ============================================================

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  // ============================================================
  // CONTAINER STYLES
  // ============================================================
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // ============================================================
  // TOP BAR - TALLER HEIGHT
  // ============================================================
  dashboardHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,

    paddingBottom: 12,
    backgroundColor: '#5C4FC9',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerBgCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },
  headerBgCircle1: {
    width: 220,
    height: 220,
    backgroundColor: '#FF6B6B',
    top: -80,
    right: -40,
  },
  headerBgCircle2: {
    width: 170,
    height: 170,
    backgroundColor: '#FFD93D',
    bottom: -40,
    left: -30,
  },
  headerBgCircle3: {
    width: 140,
    height: 140,
    backgroundColor: '#6BCB77',
    top: 20,
    left: 100,
  },
  headerBgCircle4: {
    width: 120,
    height: 120,
    backgroundColor: '#4D96FF',
    top: 60,
    right: 80,
  },
  headerBgCircle5: {
    width: 100,
    height: 100,
    backgroundColor: '#9B59B6',
    bottom: 20,
    right: 20,
  },
  headerBgCircle6: {
    width: 80,
    height: 80,
    backgroundColor: '#FF9F43',
    top: -10,
    left: 20,
  },
  headerTopStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 2,
    zIndex: 1,
  },
  stripColor: {
    width: 30,
    height: 4,
    borderRadius: 2,
    opacity: 0.9,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  logoSection: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFF',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  logoIconGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,

    borderTopRightRadius: 35,
    borderBottomRightRadius: 70,

    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,

    alignItems: 'center',
    justifyContent: 'center',
  },

  topBarLogo: {
    width: 120,
    height: 100,
    marginTop: 90,
  },
  topBarTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'sans-serif',
  },
  topBarTitleHighlight: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'sans-serif',
  },
  titleBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  titleBadgeText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'sans-serif',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  subtitleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  topBarSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 20,
  },
  headerIconButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerIconCall: {
    backgroundColor: 'rgba(156, 89, 182, 0.62)',
  },
  headerIconMessage: {
    backgroundColor: 'rgba(156, 89, 182, 0.62)',
  },
  headerIconDashboard: {
    backgroundColor: 'rgba(156, 89, 182, 0.62)',
  },
  headerIconMenu: {
    backgroundColor: 'rgba(156, 89, 182, 0.62)',
  },
  iconBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5C4FC9',
  },
  iconBadgePulse: {
    borderColor: '#FF6B6B',
  },
  iconBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // ============================================================
  // BODY CONTAINER - FIXED LAYOUT
  // ============================================================
  bodyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -10,
    paddingHorizontal: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    borderTopWidth: 2.5,
    borderTopColor: '#6C63FF',
  },

  // ============================================================
  // BOTTOM FIXED ICONS STYLES
  // ============================================================
  bottomFixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  bottomFixedIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  bottomFixedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomFixedWhatsApp: {
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 211, 102, 0.25)',
  },
  bottomFixedCall: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(76, 175, 80, 0.25)',
  },
  bottomFixedMessage: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.25)',
  },
  bottomFixedLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // MESSAGE SIDEBAR STYLES
  // ============================================================
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.88,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeader: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#6C63FF',
  },
  sidebarHeaderBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  sidebarHeaderBg: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },
  sidebarHeaderBg1: {
    width: 150,
    height: 150,
    backgroundColor: '#FF6B6B',
    top: -50,
    right: -30,
  },
  sidebarHeaderBg2: {
    width: 120,
    height: 120,
    backgroundColor: '#FFD93D',
    bottom: -30,
    left: -20,
  },
  sidebarHeaderBg3: {
    width: 100,
    height: 100,
    backgroundColor: '#6BCB77',
    top: 20,
    left: 80,
  },
  sidebarHeaderBg4: {
    width: 80,
    height: 80,
    backgroundColor: '#4D96FF',
    top: 40,
    right: 60,
  },
  sidebarHeaderStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 45 : 15,
    gap: 2,
    zIndex: 1,
  },
  sidebarStripColor: {
    width: 30,
    height: 3,
    borderRadius: 2,
    opacity: 0.9,
  },
  sidebarHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  sidebarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
  },
  sidebarHeaderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sidebarTotalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sidebarTotalBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  sidebarUnreadBadge: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sidebarUnreadBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  sidebarHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarHeaderBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  sidebarClearBtn: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  sidebarClearBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  messageAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  messageAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  messageAvatarDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  messageUserNameUnread: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'sans-serif',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageLastText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    marginRight: 8,
    fontFamily: 'sans-serif',
  },
  messageUnreadText: {
    color: '#333',
    fontWeight: '500',
  },
  messageStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  messageReadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  messageReadText: {
    fontSize: 11,
    color: '#4CAF50',
    fontFamily: 'sans-serif',
  },
  messageUnreadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  messageUnreadStatusText: {
    fontSize: 11,
    color: '#FF4757',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  messageDeleteBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    fontFamily: 'sans-serif',
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // BOTTOM NAVIGATION STYLES
  // ============================================================
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    marginBottom: 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 70,
  },
  activeNavItem: {
    backgroundColor: '#f0edff',
  },
  navLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  activeNavLabel: {
    color: '#6C63FF',
    fontWeight: '600',
  },

  // ============================================================
  // SEARCH & FILTER STYLES
  // ============================================================
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#333',
    fontFamily: 'sans-serif',
  },
  filterIconsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 10,
  },
  filterIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
    position: 'relative',
  },
  activeFilterIcon: {
    backgroundColor: '#f0edff',
    borderColor: '#6C63FF',
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterIconLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  activeFilterLabel: {
    color: '#6C63FF',
  },
  filterCountContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  countBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // USER CARD STYLES
  // ============================================================
  userList: {
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f3f5',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4757',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
    fontFamily: 'sans-serif',
  },
  userNameUnread: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4757',
    marginLeft: 4,
  },
  unreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF475710',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 5,
    gap: 4,
  },
  unreadIndicatorText: {
    fontSize: 11,
    color: '#FF4757',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5010',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 5,
    gap: 4,
  },
  readIndicatorText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  userIconsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  userIconSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================================
  // TAG STYLES
  // ============================================================
  tagContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  systemAdminTag: {
    backgroundColor: '#4CAF5020',
  },
  dialerTag: {
    backgroundColor: '#2196F320',
  },
  clientTag: {
    backgroundColor: '#9C27B020',
  },
  teamTag: {
    backgroundColor: '#FF980020',
  },
  defaultTag: {
    backgroundColor: '#f1f3f5',
  },
  systemAdminText: {
    color: '#4CAF50',
  },
  dialerText: {
    color: '#2196F3',
  },
  clientText: {
    color: '#9C27B0',
  },
  teamText: {
    color: '#FF9800',
  },
  defaultText: {
    color: '#666',
  },

  // ============================================================
  // LOAD MORE BUTTON
  // ============================================================
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // MODAL OVERLAY STYLES
  // ============================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  filerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  // ============================================================
  // FILTER MODAL STYLES
  // ============================================================
  filterModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  filterModalHeaderForContactModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  filterModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  categorySection: {
    marginBottom: 4,
  },
  filterModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  filterModalItemActive: {
    backgroundColor: '#f0edff',
  },
  filterModalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  filterModalItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalItemText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'sans-serif',
  },
  filterModalItemTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  filterModalSubText: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
    fontFamily: 'sans-serif',
  },
  countContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  expandButton: {
    padding: 4,
  },
  childContainer: {
    marginLeft: 48,
    marginBottom: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#f1f3f5',
    paddingLeft: 12,
  },
  childItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  childItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  childItemText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // CONTACT FILTER MODAL STYLES
  // ============================================================
  contactFilterModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  contactFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    fontFamily: 'sans-serif',
  },
  userTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  userTypeChipActive: {
    backgroundColor: '#f0edff',
    borderColor: '#6C63FF',
  },
  userTypeChipText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'sans-serif',
  },
  userTypeChipTextActive: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  subTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subTypeChipActive: {
    backgroundColor: '#f0edff',
    borderColor: '#6C63FF',
  },
  subTypeChipText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'sans-serif',
  },
  subTypeChipTextActive: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  applyFilterButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  applyFilterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // DIAL MODAL STYLES
  // ============================================================
  dialModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dialModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: 20,
  },
  dialModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  dialModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  dialModalSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  dialModalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  dialTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  dialTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  dialTabActive: {
    backgroundColor: '#f0edff',
  },
  dialTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  dialTabTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  dialNumberContainer: {
    padding: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
    gap: 4,
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    fontFamily: 'sans-serif',
  },
  dialpadContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dialpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  dialpadButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialpadNumber: {
    fontSize: 24,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  callActionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================================
  // CONTACT LIST STYLES (Dial, WhatsApp, Message)
  // ============================================================
  contactsContainer: {
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  contactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  contactSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#333',
    fontFamily: 'sans-serif',
  },
  filterIconBtn: {
    padding: 8,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0edff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  contactCountHeader: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  contactCountText: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'sans-serif',
  },
  contactList: {
    paddingBottom: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f3f5',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0edff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C63FF',
    fontFamily: 'sans-serif',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  contactNumber: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'sans-serif',
  },
  contactTags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  contactTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  contactTagText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  contactIconsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  contactIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================================
  // WHATSAPP/MESSAGE MODAL STYLES
  // ============================================================
  whatsappHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  whatsappContainer: {
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  whatsappSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  whatsappSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#333',
    fontFamily: 'sans-serif',
  },
  whatsappContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  whatsappContactAvatar: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0edff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  whatsappContactAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6C63FF',
    fontFamily: 'sans-serif',
  },
  whatsappStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#fff',
  },
  whatsappContactInfo: {
    flex: 1,
  },
  whatsappContactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  whatsappContactNumber: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'sans-serif',
  },
  whatsappContactTags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  whatsappEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  whatsappEmptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // DASHBOARD MODAL STYLES
  // ============================================================
  dashboardOptionsContainer: {
    padding: 20,
  },
  dashboardOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f3f5',
  },
  dashboardOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dashboardOptionContent: {
    flex: 1,
  },
  dashboardOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  dashboardOptionDesc: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // EMAIL FORM STYLES
  // ============================================================
  emailFormContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
    fontFamily: 'sans-serif',
  },
  disabledInput: {
    backgroundColor: '#f1f3f5',
    color: '#999',
  },
  textAreaInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  signatureSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  signatureSelectorText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'sans-serif',
  },
  signaturePreview: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  signaturePreviewLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  signaturePreviewText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'sans-serif',
  },
  emailActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 60,
  },
  emailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
    flex: 1,
  },
  sendBtn: {
    backgroundColor: '#6C63FF',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  historyBtn: {
    backgroundColor: '#f0edff',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  historyBtnText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // EMAIL HISTORY STYLES
  // ============================================================
  emailHistoryContainer: {
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f3f5',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyItemTo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  historyItemSubject: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  historyItemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  historyStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentStatus: {
    backgroundColor: '#4CAF5020',
  },
  draftStatus: {
    backgroundColor: '#FF980020',
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // COMMUNICATION FILTER CHIPS (Email tab)
  // ============================================================
  emailContainer: {
    flex: 1,
  },
  communicationFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  communicationFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 4,
  },
  communicationFilterChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  communicationFilterText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'sans-serif',
  },
  communicationFilterTextActive: {
    color: '#fff',
  },

  // ============================================================
  // SIGNATURE MODAL STYLES
  // ============================================================
  signatureListContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  signatureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f3f5',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  signatureItemActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#f0edff',
  },
  signatureItemContent: {
    flex: 1,
  },
  signatureItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  signatureItemPreview: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  addSignatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  addSignatureText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  addSignatureContainer: {
    padding: 20,
  },
  addSignatureActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f3f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  htmlHelperText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // SIDE NAVIGATION STYLES
  // ============================================================
  sideNavModal: {
    width: 300,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  sideNavHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    alignItems: 'center',
  },
  sideNavAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  sideNavName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  sideNavEmail: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  sideNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  activeSideNav: {
    backgroundColor: '#f0edff',
    borderRightWidth: 3,
    borderRightColor: '#6C63FF',
  },
  sideNavText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'sans-serif',
  },
  activeSideNavText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  sideNavDivider: {
    height: 1,
    backgroundColor: '#f1f3f5',
    marginVertical: 10,
    marginHorizontal: 20,
  },

  // ============================================================
  // ACTIVITY FEED STYLES
  // ============================================================
  activityContainer: {
    flex: 1,
  },
  activityFlatList: {
    flex: 1,
  },
  activityListContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  activityHeaderContainer: {
    marginBottom: 12,
  },
  activityCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTotalCount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    fontFamily: 'sans-serif',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  activityUnreadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4757',
  },
  activityUnreadText: {
    fontSize: 13,
    color: '#FF4757',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  activityFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    gap: 8,
  },
  activityFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  activityFilterChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  activityFilterChipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  activityFilterChipTextActive: {
    color: '#fff',
  },
  activitySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  activitySearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#333',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // ACTIVITY CARD STYLES
  // ============================================================
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f3f5',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  activityAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  activityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  activityBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  activityUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 6,
    fontFamily: 'sans-serif',
  },
  activityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B39AC7',
    backgroundColor: '#F3ECF8',
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  activityTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#76577F',
    fontFamily: 'sans-serif',
  },
  activitySystemAdminTag: {
    backgroundColor: '#4CAF5020',
  },
  activityClientTag: {
    backgroundColor: '#9C27B020',
  },
  activityTeamTag: {
    backgroundColor: '#FF980020',
  },
  activityDefaultTag: {
    backgroundColor: '#f1f3f5',
  },
  activitySystemAdminText: {
    color: '#4CAF50',
  },
  activityClientText: {
    color: '#9C27B0',
  },
  activityTeamText: {
    color: '#FF9800',
  },
  activityDefaultText: {
    color: '#666',
  },
  activityMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  activityDateTime: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'sans-serif',
  },
  activityNotSeen: {
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityNotSeenText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  activityFilterOptions: {
    padding: 20,
  },
  activityFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  activityFilterOptionActive: {
    backgroundColor: '#f0edff',
  },
  activityFilterOptionText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'sans-serif',
  },
  activityFilterOptionTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  activityEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  activityEmptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginTop: 12,
    fontFamily: 'sans-serif',
  },
  activityEmptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    fontFamily: 'sans-serif',
  },
  resetFiltersEmptyBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#6C63FF',
    borderRadius: 10,
  },
  resetFiltersEmptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },

  // ============================================================
  // QUICK FILTER MODAL STYLES
  // ============================================================
  quickFilterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  quickFilterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: SCREEN_HEIGHT * 0.95,
    maxHeight: SCREEN_HEIGHT * 0.95,
    minHeight: SCREEN_HEIGHT * 0.95,
  },
  quickFilterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  quickFilterModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  quickFilterModalSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  quickFilterModalClose: {
    padding: 4,
  },
  quickFilterScrollView: {
    flex: 1,
  },
  quickFilterScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  quickFilterGroup: {
    marginBottom: 16,
  },
  quickFilterGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  quickFilterSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
  },
  quickFilterSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#333',
    fontFamily: 'sans-serif',
  },
  quickFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,

    // Important for Android
    position: 'relative',
    zIndex: 1,
  },
  quickFilterGridItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 999,
  },
  dropdownTrigger: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  dropdownTriggerLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  dropdownTriggerValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
    fontFamily: 'sans-serif',
  },
  dropdownMenuContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: 200,
  },

  quickFilterActiveSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  quickFilterActiveTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  quickFilterActiveChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickFilterActiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 4,
  },
  quickFilterActiveChipText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'sans-serif',
  },
  filterBadgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4757',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  quickFilterActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    flex: 1,
  },
  quickFilterResetBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF4757',
  },
  quickFilterResetBtnText: {
    color: '#FF4757',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  quickFilterApplyBtn: {
    backgroundColor: '#6C63FF',
  },
  quickFilterApplyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  quickSearchIndicator: {
    backgroundColor: '#6C63FF20',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  quickSearchIndicatorText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  fullScreenLoader: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#76577F',
    fontWeight: '600',
  },
  quickFilterGridItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,

    // Normal item
    position: 'relative',
    zIndex: 1,
  },

  quickFilterGridItemOpen: {
    // The currently opened dropdown must come above
    // every other grid item.
    zIndex: 9999,
    elevation: 9999,
  },

  dropdownWrapper: {
    position: 'relative',
    width: '100%',
    zIndex: 1,
  },

  dropdownWrapperOpen: {
    zIndex: 99999,
    elevation: 99999,
  },

  dropdownTrigger: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  dropdownTriggerLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },

  dropdownTriggerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownTriggerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },

  dropdownMenuContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,

    zIndex: 999999,
    elevation: 999999,
  },

  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,

    elevation: 20,

    // IMPORTANT
    overflow: 'hidden',
  },

  dropdownScrollView: {
    maxHeight: 220,
  },

  dropdownScrollContent: {
    paddingVertical: 4,
  },

  dropdownItem: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: '#FFFFFF',
  },

  dropdownItemActive: {
    backgroundColor: '#F5F2FF',
  },

  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },

  dropdownItemTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  emailFormWrapper: {
    flex: 1,
    minHeight: 0,
  },

  emailFormContainer: {
    flex: 1,
  },

  emailFormContent: {
    paddingBottom: 20,
    paddingHorizontal: 2,
  },
  emptyUserContainer: {
    flex: 1,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },

  emptyUserText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
  },
  whatsappContactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8E0EE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  whatsappContactAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    resizeMode: 'cover',
  },

  countryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  countryModalContainer: {
    backgroundColor: '#FFFFFF',
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },

  countryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  countryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },

  countryModalClose: {
    fontSize: 22,
    color: '#666666',
    paddingHorizontal: 5,
  },

  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },

  selectedCountryItem: {
    backgroundColor: '#F5EFF8',
  },

  countryItemDetails: {
    flex: 1,
    marginRight: 12,
  },

  countryItemName: {
    fontSize: 15,
    color: '#222222',
    fontWeight: '500',
  },

  countryItemISO: {
    fontSize: 12,
    color: '#888888',
    marginTop: 3,
  },

  countryItemPhoneCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#76577F',
  },

  emptyCountryText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#777777',
    fontSize: 14,
  },

  inCallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  inCallCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#126D64',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    elevation: 12,
  },

  inCallPhoneIcon: {
    width: 26,
    height: 26,
    tintColor: '#FFFFFF',
    marginBottom: 8,
  },

  inCallTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 20,
  },

  inCallNumber: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },

  inCallStatus: {
    color: '#D5F0EA',
    fontSize: 13,
    marginBottom: 20,
  },

  inCallActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  muteButton: {
    minWidth: 85,
    height: 54,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#E7EEF6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  muteButtonActive: {
    backgroundColor: '#C9D9EA',
  },

  muteButtonText: {
    color: '#222222',
    fontSize: 13,
    fontWeight: '600',
  },

  hangupButton: {
    minWidth: 85,
    height: 54,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#E32323',
    justifyContent: 'center',
    alignItems: 'center',
  },

  hangupButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  filterModal: {
    width: '100%',
    maxHeight: '90%',
    height: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    elevation: 10,
  },

  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEF3',
  },

  filterModalContent: {
    flex: 1,
    minHeight: 0,
    marginTop: 10,
  },

  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  activityFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 0,
    flexWrap: 'nowrap',
  },

  activitySearchIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },

  activitySearchIcon: {
    width: 19,
    height: 19,
    resizeMode: 'contain',
    tintColor: '#6C63FF',
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  addSignatureHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#6C63FF',
  },

  addSignatureHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  topBarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
    gap: 8,
  },

  topBarProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },

  topBarProfileName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 100,
  },
  notificationBellWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  tutorialModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  tutorialHeader: {
    height: 56,
    backgroundColor: '#76577F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  tutorialTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },

  tutorialCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tutorialCloseText: {
    color: '#FFFFFF',
    fontSize: 23,
  },

  tutorialWebView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  activityTimeFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF3',
    backgroundColor: '#FFFFFF',
  },

  activityTimeFilterOptionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },

  activityTimeFilterOptionSelected: {
    backgroundColor: '#F3EDF8',
  },

  activityTimeFilterOptionSelectedText: {
    color: '#76577F',
    fontWeight: '700',
  },

  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },

  senderProfileDetails: {
    fontSize: 12,
    color: '#777777',
    marginLeft: 5,
  },

  senderProfileChip: {
    backgroundColor: '#F1EAF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 7,
    borderWidth: 1,
    borderColor: '#DCCBE8',
    alignSelf: 'center',
  },

  senderProfileChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#76577F',
  },

  tutorialPdf: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F5F5F5',
  },
  activityFilterCountBadge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  activityFilterCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  countrySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 15,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },

  countrySearchIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: '#888',
    marginRight: 10,
  },

  countrySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
  },

  countrySearchClear: {
    fontSize: 17,
    color: '#888',
    paddingLeft: 10,
  },
});

export default DashbaordScreen;
