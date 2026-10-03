import React, { useState, useRef, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Keyboard,
  Easing,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebaseConfig';
import axios from 'axios';
import EmojiPicker from 'rn-emoji-keyboard';
import Loader from '../../util/Loader';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.92;

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;
const IOS_TOP_INSET = Platform.OS === 'ios' ? 44 : 0;
const HEADER_TOP_PADDING =
  Platform.OS === 'ios' ? IOS_TOP_INSET : STATUS_BAR_HEIGHT;

const SIDE_DRAWER_WIDTH = SCREEN_WIDTH * 0.9;

// ============================================================
// DESIGN TOKENS
// ============================================================
const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primarySoft: '#EEF2FF',
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',
  whatsapp: '#25D366',
  whatsappSoft: '#DCFCE7',
  purple: '#8B5CF6',
  purpleSoft: '#EDE9FE',
  pink: '#EC4899',
  pinkSoft: '#FCE7F3',
  teal: '#14B8A6',
  tealSoft: '#CCFBF1',
  sent: '#10B981',
  sentSoft: '#D1FAE5',
  received: '#6366F1',
  receivedSoft: '#EEF2FF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  bgTertiary: '#F3F4F6',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  shadow: '#000000',
};

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 999 };

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '👎', '🔥', '🎉'];

const TRANSLATIONS = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  hi: 'Hindi',
  ar: 'Arabic',
  zh: 'Chinese',
  ja: 'Japanese',
};

const MOCK_TRANSLATIONS = {
  es: 'Este es un mensaje de ejemplo traducido al español.',
  fr: 'Ceci est un exemple de message traduit en français.',
  de: 'Dies ist eine Beispielnachricht, die ins Deutsche übersetzt wurde.',
  hi: 'यह हिंदी में अनुवादित एक नमूना संदेश है।',
  ar: 'هذه رسالة نموذجية مترجمة إلى العربية.',
  zh: '这是一条翻译成中文的示例消息。',
  ja: 'これは日本語に翻訳されたサンプルメッセージです。',
  en: 'This is a sample message translated to English.',
};

const WHATSAPP_TEMPLATES = [
  {
    id: 'custom',
    name: 'Custom Template',
    body: '',
    description: 'Write your own message',
  },
  {
    id: 'greeting',
    name: 'Greeting',
    body: 'Hi {{name}}, hope you are doing well! Just wanted to check in and see how things are going.',
    description: 'Friendly greeting',
  },
  {
    id: 'followup',
    name: 'Follow-up',
    body: 'Hi {{name}}, I wanted to follow up on our last conversation. Please let me know if you have any updates.',
    description: 'Follow up on previous message',
  },
  {
    id: 'meeting',
    name: 'Meeting Reminder',
    body: 'Hi {{name}}, this is a reminder about our scheduled meeting. Looking forward to connecting with you.',
    description: 'Remind about a meeting',
  },
  {
    id: 'thankyou',
    name: 'Thank You',
    body: 'Hi {{name}}, thank you so much for your time and support. It really means a lot!',
    description: 'Express gratitude',
  },
  {
    id: 'support',
    name: 'Support Request',
    body: 'Hi {{name}}, I need some assistance regarding my recent request. Could you please help?',
    description: 'Ask for support',
  },
];

// SMS sender numbers
// const SMS_SENDERS = [
//   { id: 'primary', label: 'Primary Number', number: '+1 234-567-8901' },
//   { id: 'business', label: 'Business Line', number: '+1 800-555-0100' },
//   { id: 'support', label: 'Support Line', number: '+1 800-555-0200' },
//   { id: 'sales', label: 'Sales Line', number: '+1 800-555-0300' },
//   { id: 'personal', label: 'Personal Number', number: '+1 415-555-0142' },
// ];

// ============================================================
// MAIN COMPONENT
// ============================================================
const UserChatPage = ({ navigation, route }) => {
  const MY_USER_ID = '2467';

  // Selected user ID.
  // Ideally pass this from Dashboard:
  // navigation.navigate('UserChatPage', { userId: item.senderId })
  const selectedUserId = String(route?.params?.senderId || '3597');

  const [sender, setSender] = useState({
    id: selectedUserId,
    name: route?.params?.userName || 'Chat User',
    image: {
      uri:
        route?.params?.userImage ||
        'https://leafnet.us/assets/img/user-demo.jpg',
    },
    type: route?.params?.userType || '',
    status: 'online',
    email: '',
    phone: '',
    whatsapp: '',
  });
const [SMS_SENDERS, setSMSSenders] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [stateLoading, setStateLoading] = useState(false);

  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const [typeOptions, setTypeOptions] = useState([]);

  const [isSendingSms, setIsSendingSms] = useState(false);

  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const [inputMessage, setInputMessage] = useState('');
  const [selectedMessageType, setSelectedMessageType] = useState('inapp');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showTimeFilterModal, setShowTimeFilterModal] = useState(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [showEmailComposeModal, setShowEmailComposeModal] = useState(false);
  const [showWhatsappComposeModal, setShowWhatsappComposeModal] =
    useState(false);
  const [showSmsComposeModal, setShowSmsComposeModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showEmailExpandedModal, setShowEmailExpandedModal] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [analysisTimeFilter, setAnalysisTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [activityChartFilter, setActivityChartFilter] = useState('week');
  const [activityChartCustomStartDate, setActivityChartCustomStartDate] =
    useState('');
  const [activityChartCustomEndDate, setActivityChartCustomEndDate] =
    useState('');
  const [showActivityChartFilterModal, setShowActivityChartFilterModal] =
    useState(false);
  const [
    showActivityChartCustomDateModal,
    setShowActivityChartCustomDateModal,
  ] = useState(false);

  const [showEmailMessageModal, setShowEmailMessageModal] = useState(false);
  const [selectedEmailMessage, setSelectedEmailMessage] = useState(null);

  const [showContactModal, setShowContactModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionTargetId, setReactionTargetId] = useState(null);

  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [translateTargetMessage, setTranslateTargetMessage] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [translatedResult, setTranslatedResult] = useState('');

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countryOptions, setCountryOptions] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] =
    useState(false);
  const [showWhatsappCountryDropdown, setShowWhatsappCountryDropdown] =
    useState(false);

  // Email compose state
  const [emailToModal, setEmailToModal] = useState(false);
  const [selectedEmailTo, setSelectedEmailTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSignature, setComposeSignature] = useState(
    'Best regards,\nJohn Smith\nSystem Admin\njohn.smith@example.com',
  );

  // WhatsApp compose state
  const [whatsappTemplateModal, setWhatsappTemplateModal] = useState(false);
  const [whatsappNumberModal, setWhatsappNumberModal] = useState(false);
  const [selectedWhatsappTemplate, setSelectedWhatsappTemplate] = useState(
    WHATSAPP_TEMPLATES[0],
  );
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [selectedWhatsappNumber, setSelectedWhatsappNumber] = useState('');

  // SMS compose state
  const [smsSenderModal, setSmsSenderModal] = useState(false);
  const [selectedSmsSender, setSelectedSmsSender] = useState(SMS_SENDERS[0]);
  const [smsMessage, setSmsMessage] = useState('');

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [contactForm, setContactForm] = useState({
    type: '',
    firstName: '',
    middleName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phoneCountryCode: '+1',
    phoneNumber: '',
    whatsappCountryCode: '+1',
    whatsappNumber: '',
    countryId: null,
    country_phone_code: '+1',
    country_code: '',
    state: '',
    stateId: null,
    typeId: null,
    email: '',
  });

  const [contacts, setContacts] = useState([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const messageSheetHeight = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const messageSheetOpacity = useRef(new Animated.Value(0)).current;

  const analyticsSheetHeight = useRef(
    new Animated.Value(SCREEN_HEIGHT),
  ).current;
  const analyticsSheetOpacity = useRef(new Animated.Value(0)).current;

  const filterSheetHeight = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const filterSheetOpacity = useRef(new Animated.Value(0)).current;

  const timeFilterSheetHeight = useRef(
    new Animated.Value(SCREEN_HEIGHT),
  ).current;
  const timeFilterSheetOpacity = useRef(new Animated.Value(0)).current;

  const emailSheetHeight = useRef(
    new Animated.Value(BOTTOM_SHEET_MAX_HEIGHT),
  ).current;
  const emailSheetOpacity = useRef(new Animated.Value(0)).current;

  const expandedSheetHeight = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const expandedSheetOpacity = useRef(new Animated.Value(0)).current;

  const composeSheetHeight = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const composeSheetOpacity = useRef(new Animated.Value(0)).current;

  const whatsappComposeSheetHeight = useRef(
    new Animated.Value(SCREEN_HEIGHT),
  ).current;
  const whatsappComposeSheetOpacity = useRef(new Animated.Value(0)).current;

  const smsComposeSheetHeight = useRef(
    new Animated.Value(SCREEN_HEIGHT),
  ).current;
  const smsComposeSheetOpacity = useRef(new Animated.Value(0)).current;

  const callModalScale = useRef(new Animated.Value(0.9)).current;
  const callModalOpacity = useRef(new Animated.Value(0)).current;

  const emailMessageSheetHeight = useRef(
    new Animated.Value(SCREEN_HEIGHT),
  ).current;
  const emailMessageSheetOpacity = useRef(new Animated.Value(0)).current;

  const contactDrawerX = useRef(new Animated.Value(-SIDE_DRAWER_WIDTH)).current;
  const contactSheetOpacity = useRef(new Animated.Value(0)).current;

  const translateDrawerX = useRef(
    new Animated.Value(-SIDE_DRAWER_WIDTH),
  ).current;
  const translateSheetOpacity = useRef(new Animated.Value(0)).current;

  const addContactSheetHeight = useRef(
    new Animated.Value(SCREEN_HEIGHT),
  ).current;
  const addContactSheetOpacity = useRef(new Animated.Value(0)).current;

  const reactionScale = useRef(new Animated.Value(0.8)).current;
  const reactionOpacity = useRef(new Animated.Value(0)).current;

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const initialScrollDoneRef = useRef(false);
  const reactionFocusIdRef = useRef(null);

  // ============================================================
  // KEYBOARD LISTENERS
  // ============================================================
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      },
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ============================================================
  // LOAD CHAT MESSAGES FROM FIREBASE
  // ============================================================

  useEffect(() => {
    let unsubscribe = null;
    initialScrollDoneRef.current = false;
    reactionFocusIdRef.current = null;

    const loadChatMessages = () => {
      try {
        if (!selectedUserId) {
          setMessages([]);
          setIsLoadingMessages(false);
          return;
        }

        const chatPath = `leafnet_chat_records/User_${MY_USER_ID}_${selectedUserId}_2`;

        console.log('====================================');
        console.log('CHAT FIREBASE PATH:', chatPath);
        console.log('MY USER ID:', MY_USER_ID);
        console.log('SELECTED USER ID:', selectedUserId);
        console.log('====================================');

        const chatRef = ref(database, chatPath);

        unsubscribe = onValue(
          chatRef,
          snapshot => {
            try {
              if (!snapshot.exists()) {
                console.log('No chat messages found');

                setMessages([]);
                setIsLoadingMessages(false);
                return;
              }

              const firebaseData = snapshot.val();

              console.log('FIREBASE CHAT DATA:', firebaseData);

              const firebaseMessages = Object.entries(firebaseData || {}).map(
                ([firebaseKey, item]) => {
                  const senderId = String(item.sender_id ?? '');

                  const receiverId = String(item.receiver_id ?? '');

                  // ========================================
                  // IMPORTANT
                  // If sender_id is my ID -> RIGHT SIDE
                  // Otherwise -> LEFT SIDE
                  // ========================================

                  const isMe = senderId === MY_USER_ID;

                  // ========================================
                  // MESSAGE TYPE
                  // ========================================

                  const messageType = String(item.type || 'inapp')
                    .trim()
                    .toLowerCase();

                  // ========================================
                  // DATE TIME
                  // ========================================

                  const dateTime =
                    item.dateTime || `${item.date || ''} ${item.time || ''}`;

                  return {
                    id: firebaseKey,

                    // Firebase sender/receiver IDs
                    senderId: isMe ? 'me' : senderId,
                    receiverId,

                    // Keep original IDs too
                    firebaseSenderId: senderId,
                    firebaseReceiverId: receiverId,

                    // Message text
                    message: item.description || item.title || '',

                    // Message type
                    type: messageType,

                    // Firebase datetime
                    dateTime: dateTime ? new Date(dateTime) : new Date(),

                    // Original Firebase date/time
                    firebaseDateTime: item.dateTime || '',
                    date: item.date || '',
                    time: item.time || '',

                    // Read status
                    isRead: Number(item.is_read_status) === 1,

                    // Sender information
                    senderName: item.sender_name || '',
                    senderImage: item.sender_profile_picture || '',

                    // Receiver information
                    receiverName: item.receiver_name || '',
                    receiverImage: item.receiver_profile_picture || '',

                    senderType:
                      item.sender_profile_type_details ||
                      item.sender_profile_type ||
                      '',

                    receiverType:
                      item.receiver_profile_type_details ||
                      item.receiver_profile_type ||
                      '',

                    // ==============================
                    // EMAIL INFORMATION
                    // ==============================
                    emailFrom: item.email_from || '',
                    emailTo: item.email_to || '',
                    emailSubject: item.email_subject || '',

                    // Firebase description is the actual email body
                    emailBody: item.description || '',

                    // Existing UI properties
                    reactions: item.reactions || {},
                    translatedText: null,
                    translatedLang: null,

                    // Firebase key
                    firebaseKey,

                    // Keep original Firebase object
                    originalData: item,
                  };
                },
              );

              // ========================================
              // SORT OLDEST -> NEWEST
              // ========================================
              firebaseMessages.sort(
                (a, b) => a.dateTime.getTime() - b.dateTime.getTime(),
              );

              console.log('FINAL CHAT MESSAGES:', firebaseMessages);

              // ========================================
              // UPDATE HEADER USER
              // ========================================

              const firstReceivedMessage = firebaseMessages.find(
                item => item.firebaseSenderId !== MY_USER_ID,
              );

              const firstMessage = firstReceivedMessage || firebaseMessages[0];

              if (firstMessage) {
                const otherUserIsSender =
                  firstMessage.firebaseSenderId !== MY_USER_ID;

                setSender({
                  id: selectedUserId,

                  name: otherUserIsSender
                    ? firstMessage.senderName
                    : firstMessage.receiverName,

                  image: {
                    uri: otherUserIsSender
                      ? firstMessage.senderImage ||
                        'https://leafnet.us/assets/img/user-demo.jpg'
                      : firstMessage.receiverImage ||
                        'https://leafnet.us/assets/img/user-demo.jpg',
                  },

                  type: otherUserIsSender
                    ? firstMessage.senderType
                    : firstMessage.receiverType,

                  status: 'online',

                  email: '',
                  phone: '',
                  whatsapp: '',
                });
              }

              setMessages(firebaseMessages);
              setIsLoadingMessages(false);

              // Scroll to latest message
              if (!initialScrollDoneRef.current) {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({
                    animated: false,
                  });

                  initialScrollDoneRef.current = true;
                }, 300);
              }
            } catch (error) {
              console.log('Error processing Firebase chat:', error);

              setMessages([]);
              setIsLoadingMessages(false);
            }
          },
          error => {
            console.log('Firebase chat listener error:', error);

            setMessages([]);
            setIsLoadingMessages(false);
          },
        );
      } catch (error) {
        console.log('Error loading Firebase chat:', error);

        setMessages([]);
        setIsLoadingMessages(false);
      }
    };

    loadChatMessages();

    return () => {
      initialScrollDoneRef.current = false;
      reactionFocusIdRef.current = null;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedUserId]);

  const messageTypes = [
    {
      id: 'inapp',
      icon: require('../../asset/chat-fill.png'),
      label: 'In-App',
      color: COLORS.primary,
      bg: COLORS.primarySoft,
    },
    {
      id: 'whatsapp',
      icon: require('../../asset/whats-app.png'),
      label: 'WhatsApp',
      color: COLORS.whatsapp,
      bg: COLORS.whatsappSoft,
    },
    {
      id: 'sms',
      icon: require('../../asset/messages.png'),
      label: 'SMS',
      color: COLORS.danger,
      bg: COLORS.dangerSoft,
    },
    {
      id: 'email',
      icon: require('../../asset/email.png'),
      label: 'Email',
      color: COLORS.received,
      bg: COLORS.warningSoft,
    },
    {
      id: 'call',
      icon: require('../../asset/call.png'),
      label: 'Call',
      color: COLORS.success,
      bg: COLORS.successSoft,
    },
  ];

  const filterOptions = [
    {
      id: 'all',
      label: 'All Messages',
      icon: 'chatbubbles',
      color: COLORS.primary,
    },
    {
      id: 'inapp',
      label: 'In-App',
      icon: 'chatbubbles',
      color: COLORS.primary,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: 'logo-whatsapp',
      color: COLORS.whatsapp,
    },
    { id: 'sms', label: 'SMS', icon: 'chatbox', color: COLORS.info },
    { id: 'email', label: 'Email', icon: 'mail', color: COLORS.warning },
    { id: 'call', label: 'Call Logs', icon: 'call', color: COLORS.success },
    {
      id: 'unread',
      label: 'Unread',
      icon: 'mail-unread',
      color: COLORS.danger,
    },
  ];

  const timeFilterOptions = [
    {
      id: 'today',
      label: 'Today',
      icon: require('../../asset/calendar.png'),
      desc: 'Last 24 hours',
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      icon: require('../../asset/calendar.png'),
      desc: 'Previous day',
    },
    {
      id: 'week',
      label: 'This Week',
      icon: require('../../asset/calendar.png'),
      desc: 'Last 7 days',
    },
    {
      id: 'last30',
      label: 'Last 30 Days',
      icon: require('../../asset/calendar.png'),
      desc: 'Last 30 days',
    },
    {
      id: 'month',
      label: 'This Month',
      icon: require('../../asset/calendar.png'),
      desc: 'Current month',
    },
    {
      id: 'lastMonth',
      label: 'Last Month',
      icon: require('../../asset/calendar.png'),
      desc: 'Previous month',
    },
    {
      id: 'year',
      label: 'Current Year',
      icon: require('../../asset/calendar.png'),
      desc: 'Full year',
    },
    {
      id: 'custom',
      label: 'Custom Date Range',
      icon: require('../../asset/calendar.png'),
      desc: 'Pick your dates',
    },
  ];

  const activityChartFilterOptions = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'custom', label: 'Custom Date Range' },
  ];

  useEffect(() => {
    fetchCountryCodes();
    fetchContactInfoTypes();
    fetchContacts();
  }, []);

  useEffect(() => {
    if (contactForm.countryId) {
      fetchStatesByCountry(contactForm.countryId);
    } else {
      setStateOptions([]);
    }
  }, [contactForm.countryId]);

  const fetchContacts = async () => {
    try {
      setIsLoadingContacts(true);

      const token = '6049|yrnb49XQ6JARE3jHs70mXJkPoGM7a1HjFm67KBce9fd94276';

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/usersContactsList',
        {
          user_id: selectedUserId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Contacts API Response:', response.data);

      if (response.data?.success) {
        const apiContacts = response.data?.data?.contacts || [];

        const formattedContacts = apiContacts.map(item => ({
          id: String(item.id),
          name: item.full_name || '',
          userTag: item.email ? `@${item.email.split('@')[0]}` : '',
          email: item.email || '',
          phone: item.phone1_country_code
            ? `(${item.phone1_country_code}) ${item.phone1 || ''}`
            : item.phone1 || '',

          whatsapp: item.whatsapp_country_code
            ? `(${item.whatsapp_country_code}) ${item.whatsapp || ''}`
            : item.whatsapp || '',
          address: [
            item.address1,
            item.address2,
            item.city,
            item.state_name,
            item.zip,
            item.country_name,
          ]
            .filter(Boolean)
            .join(', '),

          // Keep the same structure expected by your existing UI
          image: item.profile_picture ? { uri: item.profile_picture } : null,

          role: item.type || '',
          subtype: item.source || '',

          form: {
            type: item.type || '',
            typeId: item.type_id || null,
            firstName: item.first_name || '',
            middleName: item.middle_name || '',
            lastName: item.last_name || '',
            address: item.address1 || '',
            city: item.city || '',
            state: item.state_name || '',
            zip: item.zip || '',
            country: item.country_name || '',
            phoneCountryCode: item.phone1_country_code || '',
            phoneNumber: item.phone1 || '',
            whatsappCountryCode: item.whatsapp_country_code || '',
            whatsappNumber: item.whatsapp || '',
            email: item.email || '',
            countryId: item.country || null,
            stateId: item.state || null,
            phone1_country_ID: item.phone1_country_id || null,
            whatsapp_country_ID: item.whatsapp_country_id || null,
          },

          // Keep original API data also available if needed later
          originalData: item,
        }));

        setContacts(formattedContacts);
        const senders = formattedContacts
      .filter(contact => contact?.email)
      .map(contact => ({
        id: String(contact?.id ?? ''),
        label: contact?.role || 'Contact',
        number: contact?.email || '',
      }));

    setSMSSenders(senders);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.log(
        'Contacts API Error:',
        error?.response?.data || error?.message,
      );

      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchStatesByCountry = async countryId => {
    if (!countryId) {
      setStateOptions([]);
      return;
    }

    setStateLoading(true);
    const token = '6049|yrnb49XQ6JARE3jHs70mXJkPoGM7a1HjFm67KBce9fd94276';

    try {
      const response = await axios.get(
        `https://leafcom.us/backend/api/chat-application/statesByCountry?country_id=${countryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('States Response:', response.data);

      if (response.data?.success) {
        setStateOptions(response.data?.data || []);
      } else {
        setStateOptions([]);
      }
    } catch (error) {
      console.log('States API Error:', error?.response?.data || error?.message);

      setStateOptions([]);
    } finally {
      setStateLoading(false);
    }
  };

  const fetchCountryCodes = async () => {
    try {
      setIsLoadingContacts(true);

      const token = '6049|yrnb49XQ6JARE3jHs70mXJkPoGM7a1HjFm67KBce9fd94276';
      const response = await axios.get(
        'https://leafcom.us/backend/api/chat-application/countryCodes',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Country Codes Response:', response.data);

      if (response.data?.success) {
        setCountryOptions(response.data?.data || []);
      }
    } catch (error) {
      console.log(
        'Country Codes API Error:',
        error?.response?.data || error?.message,
      );
    }
  };

  const fetchContactInfoTypes = async () => {
    try {
      setIsLoadingContacts(true);

      const token = '6049|yrnb49XQ6JARE3jHs70mXJkPoGM7a1HjFm67KBce9fd94276';

      const response = await axios.get(
        'https://leafcom.us/backend/api/chat-application/contactInfoTypes',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Contact Info Types Response:', response.data);

      if (response.data?.success) {
        // const types = (response.data?.data || []).map(item => item.type);

        // setTypeOptions(types);

        setTypeOptions(response.data?.data || []);
      } else {
        setTypeOptions([]);
      }
    } catch (error) {
      console.log(
        'Contact Info Types API Error:',
        error?.response?.data || error?.message,
      );

      setTypeOptions([]);
    } finally {
    }
  };

  const aiSuggestions = [
    'Thank you for your message!',
    'I will get back to you soon.',
    'That sounds great!',
    'Could you please provide more details?',
    'I appreciate your quick response.',
    'Let me check and confirm.',
  ];

  // ============================================================
  // ANIMATIONS
  // ============================================================
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateSheet = (show, heightAnim, opacityAnim) => {
    if (show) {
      Animated.parallel([
        Animated.spring(heightAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const animateSideDrawer = (show, xAnim, opacityAnim) => {
    if (show) {
      Animated.parallel([
        Animated.spring(xAnim, {
          toValue: 0,
          tension: 55,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(xAnim, {
          toValue: -SIDE_DRAWER_WIDTH,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  useEffect(() => {
    animateSheet(showMessageModal, messageSheetHeight, messageSheetOpacity);
  }, [showMessageModal]);
  useEffect(() => {
    animateSheet(
      showAnalyticsModal,
      analyticsSheetHeight,
      analyticsSheetOpacity,
    );
  }, [showAnalyticsModal]);
  useEffect(() => {
    animateSheet(showFilterModal, filterSheetHeight, filterSheetOpacity);
  }, [showFilterModal]);
  useEffect(() => {
    animateSheet(
      showTimeFilterModal,
      timeFilterSheetHeight,
      timeFilterSheetOpacity,
    );
  }, [showTimeFilterModal]);
  useEffect(() => {
    animateSheet(
      showEmailComposeModal,
      composeSheetHeight,
      composeSheetOpacity,
    );
  }, [showEmailComposeModal]);
  useEffect(() => {
    animateSheet(
      showWhatsappComposeModal,
      whatsappComposeSheetHeight,
      whatsappComposeSheetOpacity,
    );
  }, [showWhatsappComposeModal]);
  useEffect(() => {
    animateSheet(
      showSmsComposeModal,
      smsComposeSheetHeight,
      smsComposeSheetOpacity,
    );
  }, [showSmsComposeModal]);
  useEffect(() => {
    animateSheet(
      showEmailMessageModal,
      emailMessageSheetHeight,
      emailMessageSheetOpacity,
    );
  }, [showEmailMessageModal]);
  useEffect(() => {
    animateSheet(
      showAddContactModal,
      addContactSheetHeight,
      addContactSheetOpacity,
    );
  }, [showAddContactModal]);

  useEffect(() => {
    animateSideDrawer(showContactModal, contactDrawerX, contactSheetOpacity);
  }, [showContactModal]);
  useEffect(() => {
    animateSideDrawer(
      showTranslateModal,
      translateDrawerX,
      translateSheetOpacity,
    );
  }, [showTranslateModal]);

  useEffect(() => {
    if (showEmailExpandedModal) {
      Animated.parallel([
        Animated.spring(expandedSheetHeight, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(expandedSheetOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(expandedSheetHeight, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(expandedSheetOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showEmailExpandedModal]);

  useEffect(() => {
    if (showCallModal) {
      Animated.parallel([
        Animated.spring(callModalScale, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(callModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      callModalScale.setValue(0.9);
      callModalOpacity.setValue(0);
    }
  }, [showCallModal]);

  useEffect(() => {
    if (showReactionPicker) {
      Animated.parallel([
        Animated.spring(reactionScale, {
          toValue: 1,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(reactionOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      reactionScale.setValue(0.8);
      reactionOpacity.setValue(0);
    }
  }, [showReactionPicker]);

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const formatTime = date =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const formatDate = date => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFullDate = date =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getMessageTypeInfo = type =>
    messageTypes.find(t => t.id === type) || messageTypes[0];

  const getSenderTypeColor = type => {
    if (type.includes('Admin')) return COLORS.success;
    if (type.includes('Client')) return COLORS.purple;
    if (type.includes('Team')) return COLORS.warning;
    return COLORS.primary;
  };

  const getFilteredMessages = () => {
    if (selectedFilter === 'all') return messages;
    if (selectedFilter === 'unread')
      return messages.filter(m => !m.isRead && m.senderId !== 'me');
    return messages.filter(m => m.type === selectedFilter);
  };

  const getFormFullName = () => {
    const parts = [
      contactForm.firstName,
      contactForm.middleName,
      contactForm.lastName,
    ].filter(Boolean);
    return parts.length > 0
      ? parts.join(' ')
      : isEditingContact
      ? 'Edit Contact'
      : 'New Contact';
  };

  // -------- EMAIL --------
  const handleOpenEmailCompose = () => {
    setSelectedEmailTo(sender.email);
    setComposeSubject('');
    setComposeBody('');
    setComposeSignature(
      'Best regards,\nJohn Smith\nSystem Admin\njohn.smith@example.com',
    );
    setShowEmailComposeModal(true);
  };

  const handleSendEmail = () => {
    if (!selectedEmailTo || !composeSubject.trim() || !composeBody.trim()) {
      Alert.alert(
        'Missing Fields',
        'Please fill in To, Subject and Body before sending.',
      );
      return;
    }
    const fullBody = `${composeBody}\n\n${composeSignature}`;
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: 'me',
        message: `${composeSubject} | ${fullBody}`,
        type: 'email',
        dateTime: new Date(),
        isRead: true,
        reactions: [],
        translatedText: null,
        translatedLang: null,
      },
    ]);
    setShowEmailComposeModal(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
  };

  // -------- WHATSAPP --------
  const handleOpenWhatsappCompose = () => {
    const defaultNumber = sender.whatsapp || contacts[0]?.whatsapp || '';
    setSelectedWhatsappNumber(defaultNumber);
    setSelectedWhatsappTemplate(WHATSAPP_TEMPLATES[0]);
    setWhatsappMessage('');
    setShowWhatsappComposeModal(true);
  };

  const handleSendWhatsapp = () => {
    if (!selectedWhatsappNumber) {
      Alert.alert(
        'Missing Number',
        'Please choose a WhatsApp number before sending.',
      );
      return;
    }
    if (!whatsappMessage.trim()) {
      Alert.alert('Missing Message', 'Please write a message before sending.');
      return;
    }
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: 'me',
        message: whatsappMessage,
        type: 'whatsapp',
        dateTime: new Date(),
        isRead: true,
        reactions: [],
        translatedText: null,
        translatedLang: null,
      },
    ]);
    setShowWhatsappComposeModal(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const handleChooseTemplate = tpl => {
    setSelectedWhatsappTemplate(tpl);
    if (tpl.id !== 'custom') {
      const name = sender.name.split(' ')[0] || 'there';
      setWhatsappMessage(tpl.body.replace(/{{name}}/g, name));
    } else {
      setWhatsappMessage('');
    }
    setWhatsappTemplateModal(false);
  };

  // -------- SMS --------
  const handleOpenSmsCompose = () => {
    setSelectedSmsSender(SMS_SENDERS[0]);
    setSmsMessage('');
    setShowSmsComposeModal(true);
  };

  const handleSendSms = async () => {
    if (!selectedSmsSender) {
      Alert.alert('Missing Sender', 'Please choose a sender before sending.');
      return;
    }

    if (!inputMessage.trim()) {
      Alert.alert('Missing Message', 'Please write a message before sending.');
      return;
    }

    if (!selectedUserId) {
      Alert.alert('Error', 'Receiver user ID is not available.');
      return;
    }

    try {
      setIsSendingSms(true);

      const token = '6049|yrnb49XQ6JARE3jHs70mXJkPoGM7a1HjFm67KBce9fd94276';

      if (!token) {
        Alert.alert('Error', 'Authentication token not found.');
        return;
      }

      const payload = {
        receiver_id: Number(selectedUserId),
        message: inputMessage.trim(),
        type: 'inapp',
      };

      console.log('SEND MESSAGE PAYLOAD:', payload);

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/sendMessage',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('SEND MESSAGE RESPONSE:', response.data);

      if (response.data?.success) {
        if (!inputMessage.trim()) return;

        // setMessages(prevMessages => [
        //   ...prevMessages,
        //   {
        //     id: Date.now().toString(),
        //     senderId: 'me',
        //     receiverId: selectedUserId,
        //     message: inputMessage.trim(),
        //     type: 'inapp',
        //     dateTime: new Date(),
        //     isRead: true,
        //     reactions: {},
        //     translatedText: null,
        //     translatedLang: null,
        //   },
        // ]);

        setInputMessage('');

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({
            animated: true,
          });
        }, 100);

        setShowSmsComposeModal(false);
      } else {
        Alert.alert(
          'Error',
          response.data?.message || 'Failed to send message.',
        );
      }
    } catch (error) {
      console.log(
        'SEND MESSAGE API ERROR:',
        error.response?.data || error.message,
      );

      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Something went wrong while sending the message.',
      );
    } finally {
      setIsSendingSms(false);
    }
  };

  // -------- CONTACTS --------
  const handleDeleteContact = contactId => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token =
                '6049|yrnb49XQ6JARE3jHs70mXJkPoGM7a1HjFm67KBce9fd94276';

              const response = await axios.delete(
                'https://leafcom.us/backend/api/chat-application/deleteUserContact',
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  data: {
                    user_id: selectedUserId,
                    contact_id: contactId,
                    source: 'staff',
                  },
                },
              );

              console.log('Delete Contact Response:', response.data);

              if (response.data?.success === true) {
                // Remove from local list only after successful API response
                setContacts(prev =>
                  prev.filter(contact => contact.id !== contactId),
                );

                Alert.alert('Success', 'Contact deleted successfully.');
              } else {
                Alert.alert(
                  'Delete Failed',
                  response.data?.message || 'Unable to delete contact.',
                );
              }
            } catch (error) {
              console.log(
                'Delete Contact API Error:',
                error?.response?.data || error?.message,
              );

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  'Something went wrong while deleting the contact.',
              );
            }
          },
        },
      ],
    );
  };

  const handleOpenAddContact = () => {
    setIsEditingContact(false);
    setEditingContactId(null);
    setContactForm({
      type: '',
      firstName: '',
      middleName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phoneCountryCode: '+1',
      phoneNumber: '',
      whatsappCountryCode: '+1',
      whatsappNumber: '',
      country_phone_code: '+1',
    });
    setShowContactModal(false);
    setTimeout(() => setShowAddContactModal(true), 300);
  };

  const handleOpenEditContact = contact => {
    setIsEditingContact(true);

    // IMPORTANT
    setEditingContactId(contact.id);

    setContactForm({
      type: contact.form?.type || contact.role || '',
      typeId: contact.form?.typeId || contact.type_id || null,

      firstName: contact.form?.firstName || '',
      middleName: contact.form?.middleName || '',
      lastName: contact.form?.lastName || '',

      address: contact.form?.address || '',
      city: contact.form?.city || '',
      state: contact.form?.state || '',
      stateId: contact.form?.stateId || contact.state || null,
      zip: contact.form?.zip || '',

      country: contact.form?.country || '',
      countryId: contact.form?.countryId || contact.country || null,

      country_phone_code:
        contact.form?.phoneCountryCode || contact.phone1_country_code || '+1',

      phoneNumber: contact.form?.phoneNumber || contact.phone1 || '',

      country_phone_code:
        contact.form?.whatsappCountryCode ||
        contact.whatsapp_country_code ||
        '+1',

      whatsappNumber: contact.form?.whatsappNumber || contact.whatsapp || '',

      email: contact.form?.email || contact.email || '',

      whatsapp_country_ID:
        contact.form?.whatsapp_country_ID ||
        contact.whatsapp_country_id ||
        null,
      phone1_country_ID:
        contact.form?.phone1_country_ID || contact.phone1_country_id || null,
    });

    setShowContactModal(false);

    setTimeout(() => {
      setShowAddContactModal(true);
    }, 300);
  };

  const handleSaveContact = async () => {
    try {
      if (!contactForm.firstName?.trim()) {
        Alert.alert('Validation', 'Please enter first name.');
        return;
      }

      if (!contactForm.typeId) {
        Alert.alert('Validation', 'Please select contact type.');
        return;
      }

      const token = '6049|yrnb49XQ6JARE3jHs70mXJkPoGM7a1HjFm67KBce9fd94276';

      const payload = {
        user_id: selectedUserId,
        contact_id: isEditingContact ? editingContactId : null,
        source: 'staff',

        contact: {
          type_id: contactForm.typeId,

          first_name: contactForm.firstName?.trim() || '',
          middle_name: contactForm.middleName?.trim() || '',
          last_name: contactForm.lastName?.trim() || '',

          address1: contactForm.address?.trim() || '',
          city: contactForm.city?.trim() || '',

          state: contactForm.stateId || null,
          zip: contactForm.zip?.trim() || '',

          country: contactForm.countryId || null,

          phone1: contactForm.phoneNumber?.trim() || '',
          phone1_country: contactForm.countryId || null,

          whatsapp: contactForm.whatsappNumber?.trim() || '',
          whatsapp_country: contactForm.countryId || null,

          email: contactForm.email?.trim() || '',
        },
      };

      console.log(
        isEditingContact ? 'Update Contact Payload:' : 'Save Contact Payload:',
        payload,
      );

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/saveUserContact',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Save Contact Response:', response.data);

      if (response.data?.success) {
        // Get newly created contact from API response
        const newContact = response.data?.data?.contact;

        console.log('New Contact:', newContact);

        Alert.alert(
          'Success',
          isEditingContact ? 'Contact edit successful.' : 'Contact save successful.',
        );

        fetchContacts();

        setShowAddContactModal(false);
        setShowContactModal(false);

        // Reset form
        setContactForm({
          type: '',
          firstName: '',
          middleName: '',
          lastName: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          phoneCountryCode: '+1',
          phoneNumber: '',
          whatsappCountryCode: '+1',
          whatsappNumber: '',
          countryId: null,
          country_phone_code: '+1',
          country_code: '',
          state: '',
          stateId: null,
          typeId: null,
        });
      }
    } catch (error) {
      console.log(
        'Save Contact API Error:',
        error?.response?.data || error?.message,
      );

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Unable to save contact. Please try again.',
      );
    }
  };

  const sendMessageReaction = async (firebaseKey, emoji) => {
    try {
      const token = '6049|yrnb49XQ6JARE3jHs70mXJkPoGM7a1HjFm67KBce9fd94276';

      const response = await axios.post(
        'https://leafcom.us/backend/api/chat-application/messageReaction',
        {
          firebase_key: firebaseKey,
          thread_key: `User_${MY_USER_ID}_${selectedUserId}_2`,
          emoji: emoji,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Reaction API Response:', response.data);

      if (response.data?.success) {
        reactionFocusIdRef.current = firebaseKey;
        return true;
      }

      return false;
    } catch (error) {
      console.log(
        'Reaction API Error:',
        error?.response?.data || error?.message,
      );

      return false;
    }
  };

  const handleAddReaction = (messageId, emoji) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          const existingReactions = msg.reactions || [];
          const existingIndex = existingReactions.findIndex(
            r => r.emoji === emoji && r.by === 'me',
          );
          let newReactions;
          if (existingIndex >= 0) {
            newReactions = existingReactions.filter(
              (_, i) => i !== existingIndex,
            );
          } else {
            newReactions = [...existingReactions, { emoji, by: 'me' }];
          }
          return { ...msg, reactions: newReactions };
        }
        return msg;
      }),
    );
    setShowReactionPicker(false);
    setReactionTargetId(null);
  };

  const handleTranslate = message => {
    setTranslateTargetMessage(message);
    setSelectedLanguage('es');
    setTranslatedResult('');
    setShowTranslateModal(true);
  };

  const performTranslation = lang => {
    setSelectedLanguage(lang);
    const result =
      MOCK_TRANSLATIONS[lang] ||
      `[Translated to ${TRANSLATIONS[lang]}]: ${translateTargetMessage?.message}`;
    setTranslatedResult(result);
  };

  const handleSaveTranslation = () => {
    if (translateTargetMessage && translatedResult) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === translateTargetMessage.id
            ? {
                ...msg,
                translatedText: translatedResult,
                translatedLang: selectedLanguage,
              }
            : msg,
        ),
      );
    }
    setShowTranslateModal(false);
  };

  const handleRemoveTranslation = messageId => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, translatedText: null, translatedLang: null }
          : msg,
      ),
    );
  };

  // ============================================================
  // ANALYTICS HELPERS
  // ============================================================
  const getAnalysisMessages = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return messages.filter(msg => {
      const msgDate = new Date(msg.dateTime);
      switch (analysisTimeFilter) {
        case 'today':
          return msgDate >= today;
        case 'yesterday': {
          const yStart = new Date(today);
          yStart.setDate(yStart.getDate() - 1);
          return msgDate >= yStart && msgDate < today;
        }
        case 'week': {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - 7);
          return msgDate >= weekStart;
        }
        case 'last30': {
          const l30 = new Date(today);
          l30.setDate(l30.getDate() - 30);
          return msgDate >= l30;
        }
        case 'month': {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return msgDate >= monthStart;
        }
        case 'lastMonth': {
          const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          return msgDate >= lmStart && msgDate <= lmEnd;
        }
        case 'year': {
          const yearStart = new Date(now.getFullYear(), 0, 1);
          return msgDate >= yearStart;
        }
        case 'custom': {
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            return msgDate >= start && msgDate <= end;
          }
          return true;
        }
        default:
          return true;
      }
    });
  };

  const calculateAnalytics = () => {
    const analysisMessages = getAnalysisMessages();

    const total = analysisMessages.length;

    const sentByMe = analysisMessages.filter(
      msg => msg.senderId === 'me',
    ).length;

    const received = analysisMessages.filter(
      msg => msg.senderId !== 'me',
    ).length;

    const sentPercentage = total > 0 ? (sentByMe / total) * 100 : 0;

    const receivedPercentage = total > 0 ? (received / total) * 100 : 0;

    const mediumCounts = {};

    messageTypes.slice(0, 4).forEach(type => {
      mediumCounts[type.id] = analysisMessages.filter(
        msg => msg.type === type.id,
      ).length;
    });

    let mostUsed = {
      id: '',
      count: 0,
      percentage: 0,
    };

    Object.entries(mediumCounts).forEach(([id, count]) => {
      if (count > mostUsed.count) {
        mostUsed = {
          id,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        };
      }
    });

    return {
      total,
      sentByMe,
      received,
      sentPercentage,
      receivedPercentage,
      mediumCounts,
      mostUsed,
    };
  };

  const getActivityChartData = () => {
    const now = new Date();
    let points = [];

    if (activityChartFilter === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);
        const count = messages.filter(m => {
          const msgDate = new Date(m.dateTime);
          return msgDate >= dayStart && msgDate <= dayEnd;
        }).length;
        points.push({
          label: d.toLocaleString('en-US', { month: 'short', day: 'numeric' }),
          count,
        });
      }
    } else if (activityChartFilter === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      let weekStart = new Date(firstDay);
      let weekIndex = 1;
      while (weekStart <= lastDay) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > lastDay) weekEnd = new Date(lastDay);
        const count = messages.filter(m => {
          const msgDate = new Date(m.dateTime);
          return msgDate >= weekStart && msgDate <= weekEnd;
        }).length;
        points.push({ label: `W${weekIndex}`, count });
        weekStart.setDate(weekStart.getDate() + 7);
        weekIndex++;
      }
    } else if (activityChartFilter === 'custom') {
      if (activityChartCustomStartDate && activityChartCustomEndDate) {
        const start = new Date(activityChartCustomStartDate);
        const end = new Date(activityChartCustomEndDate);
        end.setHours(23, 59, 59, 999);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays <= 7) {
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayStart = new Date(d);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(d);
            dayEnd.setHours(23, 59, 59, 999);
            const count = messages.filter(m => {
              const msgDate = new Date(m.dateTime);
              return msgDate >= dayStart && msgDate <= dayEnd;
            }).length;
            points.push({
              label: d.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              count,
            });
          }
        } else if (diffDays <= 31) {
          let weekStart = new Date(start);
          while (weekStart <= end) {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            if (weekEnd > end) weekEnd = new Date(end);
            const count = messages.filter(m => {
              const msgDate = new Date(m.dateTime);
              return msgDate >= weekStart && msgDate <= weekEnd;
            }).length;
            points.push({
              label: weekStart.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              count,
            });
            weekStart.setDate(weekStart.getDate() + 7);
          }
        } else {
          let monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
          while (monthStart <= end) {
            const monthEnd = new Date(
              monthStart.getFullYear(),
              monthStart.getMonth() + 1,
              0,
            );
            if (monthEnd > end) monthEnd = new Date(end);
            const count = messages.filter(m => {
              const msgDate = new Date(m.dateTime);
              return msgDate >= monthStart && msgDate <= monthEnd;
            }).length;
            points.push({
              label: monthStart.toLocaleString('en-US', { month: 'short' }),
              count,
            });
            monthStart.setMonth(monthStart.getMonth() + 1);
          }
        }
      } else {
        points = [];
      }
    }
    if (points.length === 0) points = [{ label: '', count: 0 }];
    return points;
  };

  const renderLineChart = () => {
    const data = getActivityChartData();
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const chartHeight = 180;
    const yAxisWidth = 28;
    const xAxisHeight = 28;
    const plotWidth = SCREEN_WIDTH - 72 - yAxisWidth;
    const plotHeight = chartHeight - xAxisHeight;

    const points = data.map((item, index) => {
      const x =
        data.length > 1
          ? (index / (data.length - 1)) * plotWidth
          : plotWidth / 2;
      const y = plotHeight - (item.count / maxCount) * plotHeight;
      return { x, y, ...item };
    });

    const ySteps = 4;
    const yLabels = [];
    for (let i = 0; i <= ySteps; i++)
      yLabels.push(Math.round((maxCount / ySteps) * (ySteps - i)));

    const renderSmoothSegments = () => {
      const segments = [];
      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const cp1x = p0.x + (p1.x - p0.x) / 3;
        const cp1y = p0.y;
        const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
        const cp2y = p1.y;

        const steps = 12;
        for (let s = 0; s < steps; s++) {
          const t0 = s / steps;
          const t1 = (s + 1) / steps;
          const bezier = t => {
            const mt = 1 - t;
            const x =
              mt * mt * mt * p0.x +
              3 * mt * mt * t * cp1x +
              3 * mt * t * t * cp2x +
              t * t * t * p1.x;
            const y =
              mt * mt * mt * p0.y +
              3 * mt * mt * t * cp1y +
              3 * mt * t * t * cp2y +
              t * t * t * p1.y;
            return { x, y };
          };
          const pt0 = bezier(t0);
          const pt1 = bezier(t1);
          const dx = pt1.x - pt0.x;
          const dy = pt1.y - pt0.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          segments.push(
            <View
              key={`seg-${i}-${s}`}
              style={[
                styles.lineChartSegment,
                {
                  left: pt0.x,
                  top: pt0.y - 1.25,
                  width: length,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />,
          );
        }
      }
      return segments;
    };

    return (
      <View style={styles.lineChartContainer}>
        <View style={[styles.lineChartYAxis, { height: plotHeight }]}>
          {yLabels.map((val, i) => (
            <Text key={i} style={styles.lineChartYLabel}>
              {val}
            </Text>
          ))}
        </View>
        <View style={styles.lineChartContent}>
          <View
            style={[
              styles.lineChartGrid,
              { height: plotHeight, width: plotWidth },
            ]}
          >
            {Array.from({ length: ySteps + 1 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.lineChartGridLine,
                  { top: (plotHeight / ySteps) * i },
                ]}
              />
            ))}
          </View>
          {renderSmoothSegments()}
          {points.map((point, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.lineChartDot,
                { left: point.x - 5, top: point.y - 5 },
              ]}
            />
          ))}
          <View
            style={[
              styles.lineChartXAxis,
              { width: plotWidth, top: plotHeight + 6 },
            ]}
          >
            {data.map((item, index) => {
              const x =
                data.length > 1
                  ? (index / (data.length - 1)) * plotWidth
                  : plotWidth / 2;
              return (
                <Text
                  key={index}
                  style={[
                    styles.lineChartXLabel,
                    { left: x - 20, width: 40, textAlign: 'center' },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // ============================================================
  // RENDER: SMS COMPOSE MODAL
  // ============================================================
  const renderSmsComposeModal = () => (
    <Modal
      visible={showSmsComposeModal}
      transparent
      animationType="none"
      onRequestClose={() => setShowSmsComposeModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.bottomSheetBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            styles.smsComposeSheetContent,
            { transform: [{ translateY: smsComposeSheetHeight }] },
          ]}
        >
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Header */}
          <View style={styles.smsComposeHeader}>
            <View style={styles.smsComposeHeaderDecor}>
              <View style={styles.smsComposeDecorCircle1} />
              <View style={styles.smsComposeDecorCircle2} />
            </View>
            <View style={styles.smsComposeHeaderTop}>
              <View style={styles.smsComposeTitleWrap}>
                <View style={styles.smsComposeTitleIcon}>
                  <Image
                    source={require('../../asset/message.png')} // Update the path as needed
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smsComposeTitle}>Send SMS</Text>
                  <Text style={styles.smsComposeSubtitle} numberOfLines={1}>
                    Compose and send text message
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.smsComposeCloseBtn}
                onPress={() => setShowSmsComposeModal(false)}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../asset/close.png')} // Update the path as needed
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain',
                    tintColor: COLORS.textInverse,
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.smsComposeBody}
            contentContainerStyle={styles.smsComposeBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* From (Sender) Dropdown */}
            <View style={styles.composeFieldRow}>
              <Text style={styles.composeFieldLabel}>From (Sender)</Text>
              <TouchableOpacity
                style={styles.smsSenderSelect}
                onPress={() => setSmsSenderModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.smsSenderLeft}>
                  <Image
                    source={require('../../asset/dummyuser.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smsSenderName} numberOfLines={1}>
                      {selectedSmsSender?.label || 'Select sender'}
                    </Text>
                    <Text style={styles.smsSenderNumber} numberOfLines={1}>
                      {selectedSmsSender?.number || ''}
                    </Text>
                  </View>
                </View>

                <Image
                  source={require('../../asset/chevron-down.png')} // Update the path as needed
                  style={{
                    width: 16,
                    height: 16,
                    resizeMode: 'contain',
                    tintColor: COLORS.textSecondary,
                  }}
                />
              </TouchableOpacity>
            </View>

            {/* To (Recipient) - Non-editable */}
            <View style={styles.composeFieldRow}>
              <Text style={styles.composeFieldLabel}>To</Text>
              <View style={styles.composeFromField}>
                <Text style={styles.composeFromText} numberOfLines={1}>
                  {sender.name} • {sender.phone}
                </Text>

                <Image
                  source={require('../../asset/lock-closed.png')} // Update the path as needed
                  style={{
                    width: 14,
                    height: 14,
                    resizeMode: 'contain',
                    tintColor: COLORS.textTertiary,
                  }}
                />
              </View>
            </View>

            {/* Message */}
            <View style={styles.composeBlock}>
              <View style={styles.composeBlockHeader}>
                <Text style={styles.composeBlockLabel}>Message</Text>
                <Text style={styles.smsCharCount}>{smsMessage.length}/160</Text>
              </View>
              <TextInput
                style={styles.composeTextarea}
                placeholder="Write your SMS message here..."
                placeholderTextColor={COLORS.textTertiary}
                value={smsMessage}
                onChangeText={setSmsMessage}
                multiline
                textAlignVertical="top"
                maxLength={480}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity style={styles.smsSendBtn} activeOpacity={0.85}>
              <Image
                source={require('../../asset/send.png')} // Update the path as needed
                style={{
                  width: 18,
                  height: 18,
                  resizeMode: 'contain',
                  tintColor: COLORS.textInverse,
                }}
              />
              <Text style={styles.smsSendBtnText}>Send SMS</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ============================================================
  // RENDER: SMS SENDER PICKER MODAL
  // ============================================================
  const renderSmsSenderPickerModal = () => (
    <Modal
      visible={smsSenderModal}
      transparent
      animationType="fade"
      onRequestClose={() => setSmsSenderModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setSmsSenderModal(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdownCard}>
              <View style={styles.dropdownHeader}>
                <View
                  style={[
                    styles.dropdownIconWrap,
                    { backgroundColor: COLORS.infoSoft },
                  ]}
                >
                  <Image
                    source={require('../../asset/dummyuser.png')} // Update the path as needed
                    style={{
                      width: 22,
                      height: 22,
                      resizeMode: 'contain',
                    }}
                  />
                </View>
                <Text style={styles.dropdownTitle}>Choose Sender</Text>
                <TouchableOpacity
                  onPress={() => setSmsSenderModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.dropdownBody}
                showsVerticalScrollIndicator={false}
              >
                {SMS_SENDERS.map(s => {
                  const isActive = selectedSmsSender?.id === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.smsSenderOption,
                        isActive && styles.smsSenderOptionActive,
                      ]}
                      onPress={() => {
                        setSelectedSmsSender(s);
                        setSmsSenderModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.smsSenderOptionIcon,
                          isActive && { backgroundColor: COLORS.info },
                        ]}
                      >
                        <Image
                          source={require('../../asset/call.png')}
                          style={{
                            width: 16,
                            height: 16,
                            resizeMode: 'contain',
                            tintColor: isActive
                              ? COLORS.textInverse
                              : COLORS.info,
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.smsSenderOptionName,
                            isActive && { color: COLORS.info },
                          ]}
                        >
                          {s.label}
                        </Text>
                        <Text style={styles.smsSenderOptionNumber}>
                          {s.number}
                        </Text>
                      </View>
                      {isActive && (
                        <Image
                          source={require('../../asset/checkmark-circle.png')} // Update the path as needed
                          style={{
                            width: 20,
                            height: 20,
                            resizeMode: 'contain',
                            tintColor: COLORS.info,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ============================================================
  // RENDER: WHATSAPP COMPOSE MODAL
  // ============================================================
  const renderWhatsappComposeModal = () => (
    <Modal
      visible={showWhatsappComposeModal}
      transparent
      animationType="none"
      onRequestClose={() => setShowWhatsappComposeModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.bottomSheetBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            styles.whatsappComposeSheetContent,
            { transform: [{ translateY: whatsappComposeSheetHeight }] },
          ]}
        >
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <View style={styles.whatsappComposeHeader}>
            <View style={styles.whatsappComposeHeaderDecor}>
              <View style={styles.whatsappComposeDecorCircle1} />
              <View style={styles.whatsappComposeDecorCircle2} />
            </View>
            <View style={styles.whatsappComposeHeaderTop}>
              <View style={styles.whatsappComposeTitleWrap}>
                <View style={styles.whatsappComposeTitleIcon}>
                  <Image
                    source={require('../../asset/whatsapp.png')} // Update the path as needed
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.whatsappComposeTitle}>Send WhatsApp</Text>
                  <Text
                    style={styles.whatsappComposeSubtitle}
                    numberOfLines={1}
                  >
                    Compose and send message
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.whatsappComposeCloseBtn}
                onPress={() => setShowWhatsappComposeModal(false)}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../asset/close.png')} // Update the path as needed
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain',
                    tintColor: COLORS.textInverse,
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.whatsappComposeBody}
            contentContainerStyle={styles.whatsappComposeBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.composeFieldRow}>
              <Text style={styles.composeFieldLabel}>Template</Text>
              <TouchableOpacity
                style={styles.whatsappTemplateSelect}
                onPress={() => setWhatsappTemplateModal(true)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.whatsappTemplateName} numberOfLines={1}>
                    {selectedWhatsappTemplate?.name || 'Select template'}
                  </Text>
                  {selectedWhatsappTemplate?.description && (
                    <Text style={styles.whatsappTemplateDesc} numberOfLines={1}>
                      {selectedWhatsappTemplate.description}
                    </Text>
                  )}
                </View>

                <Image
                  source={require('../../asset/chevron-down.png')} // Update the path as needed
                  style={{
                    width: 14,
                    height: 14,
                    resizeMode: 'contain',
                    tintColor: COLORS.textSecondary,
                  }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.composeBlock}>
              <View style={styles.composeBlockHeader}>
                <Text style={styles.composeBlockLabel}>Message</Text>
                {selectedWhatsappTemplate?.id !== 'custom' && (
                  <View style={styles.composeSignatureBadge}>
                    <Image
                      source={require('../../asset/document-text.png')} // Update the path as needed
                      style={{
                        width: 11,
                        height: 11,
                        resizeMode: 'contain',
                        tintColor: COLORS.primary,
                      }}
                    />
                    <Text style={styles.composeSignatureBadgeText}>
                      From Template
                    </Text>
                  </View>
                )}
              </View>
              <TextInput
                style={styles.composeTextarea}
                placeholder="Write your WhatsApp message here..."
                placeholderTextColor={COLORS.textTertiary}
                value={whatsappMessage}
                onChangeText={setWhatsappMessage}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.composeFieldRow}>
              <Text style={styles.composeFieldLabel}>To (WhatsApp Number)</Text>
              <TouchableOpacity
                style={styles.composeToSelect}
                onPress={() => setWhatsappNumberModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.whatsappNumberLeft}>
                  <Image
                    source={require('../../asset/whatsapp.png')} // Update the path as needed
                    style={{
                      width: 16,
                      height: 16,
                      resizeMode: 'contain',
                    }}
                  />
                  <Text style={styles.composeToText} numberOfLines={1}>
                    {selectedWhatsappNumber || 'Select number'}
                  </Text>
                </View>

                <Image
                  source={require('../../asset/chevron-down.png')} // Update the path as needed
                  style={{
                    width: 14,
                    height: 14,
                    resizeMode: 'contain',
                    tintColor: COLORS.textSecondary,
                  }}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.whatsappSendBtn}
              onPress={handleSendWhatsapp}
              activeOpacity={0.85}
            >
              <Image
                source={require('../../asset/send.png')} // Update the path as needed
                style={{
                  width: 18,
                  height: 18,
                  resizeMode: 'contain',
                  tintColor: COLORS.textInverse,
                }}
              />
              <Text style={styles.whatsappSendBtnText}>Send WhatsApp</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderWhatsappTemplatePickerModal = () => (
    <Modal
      visible={whatsappTemplateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setWhatsappTemplateModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setWhatsappTemplateModal(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdownCard}>
              <View style={styles.dropdownHeader}>
                <View
                  style={[
                    styles.dropdownIconWrap,
                    { backgroundColor: COLORS.whatsappSoft },
                  ]}
                >
                  <Image
                    source={require('../../asset/document-text.png')} // Update the path as needed
                    style={{
                      width: 22,
                      height: 22,
                      resizeMode: 'contain',
                      tintColor: COLORS.whatsapp,
                    }}
                  />
                </View>
                <Text style={styles.dropdownTitle}>Choose Template</Text>
                <TouchableOpacity
                  onPress={() => setWhatsappTemplateModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.dropdownBody}
                showsVerticalScrollIndicator={false}
              >
                {WHATSAPP_TEMPLATES.map(tpl => {
                  const isActive = selectedWhatsappTemplate?.id === tpl.id;
                  return (
                    <TouchableOpacity
                      key={tpl.id}
                      style={[
                        styles.whatsappTplOption,
                        isActive && styles.whatsappTplOptionActive,
                      ]}
                      onPress={() => handleChooseTemplate(tpl)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.whatsappTplOptionIconWrap}>
                        <Image
                          source={
                            tpl.id === 'custom'
                              ? require('../../asset/create.png')
                              : require('../../asset/document-text.png')
                          }
                          style={{
                            width: 18,
                            height: 18,
                            resizeMode: 'contain',
                            tintColor: isActive
                              ? COLORS.primary
                              : COLORS.textSecondary,
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.whatsappTplOptionName,
                            isActive && { color: COLORS.primary },
                          ]}
                        >
                          {tpl.name}
                        </Text>
                        <Text
                          style={styles.whatsappTplOptionDesc}
                          numberOfLines={1}
                        >
                          {tpl.description}
                        </Text>
                      </View>
                      {isActive && (
                        <Image
                          source={require('../../asset/checkmark-circle.png')} // Update the path as needed
                          style={{
                            width: 20,
                            height: 20,
                            resizeMode: 'contain',
                            tintColor: COLORS.primary,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderWhatsappNumberPickerModal = () => (
    <Modal
      visible={whatsappNumberModal}
      transparent
      animationType="fade"
      onRequestClose={() => setWhatsappNumberModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setWhatsappNumberModal(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdownCard}>
              <View style={styles.dropdownHeader}>
                <View
                  style={[
                    styles.dropdownIconWrap,
                    { backgroundColor: COLORS.whatsappSoft },
                  ]}
                >
                  <Image
                    source={require('../../asset/whatsapp.png')} // Update the path as needed
                    style={{
                      width: 22,
                      height: 22,
                      resizeMode: 'contain',
                    }}
                  />
                </View>
                <Text style={styles.dropdownTitle}>Choose Number</Text>
                <TouchableOpacity
                  onPress={() => setWhatsappNumberModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.dropdownBody}
                showsVerticalScrollIndicator={false}
              >
                {contacts.map(c => {
                  const isActive = selectedWhatsappNumber === c.whatsapp;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.emailToOption,
                        isActive && styles.emailToOptionActive,
                      ]}
                      onPress={() => {
                        setSelectedWhatsappNumber(c.whatsapp);
                        setWhatsappNumberModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Image source={c.image} style={styles.emailToAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.emailToName}>{c.name}</Text>
                        <Text style={styles.emailToAddress} numberOfLines={1}>
                          {c.whatsapp}
                        </Text>
                      </View>
                      {isActive && (
                        <Image
                          source={require('../../asset/checkmark-circle.png')} // Update the path as needed
                          style={{
                            width: 18,
                            height: 18,
                            resizeMode: 'contain',
                            tintColor: COLORS.primary,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ============================================================
  // RENDER: EMAIL COMPOSE MODAL
  // ============================================================
  const renderEmailComposeModal = () => (
    <Modal
      visible={showEmailComposeModal}
      transparent
      animationType="none"
      onRequestClose={() => setShowEmailComposeModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.bottomSheetBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            styles.composeSheetContent,
            { transform: [{ translateY: composeSheetHeight }] },
          ]}
        >
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <View style={styles.composeHeader}>
            <View style={styles.composeHeaderDecor}>
              <View style={styles.composeDecorCircle1} />
              <View style={styles.composeDecorCircle2} />
            </View>
            <View style={styles.composeHeaderTop}>
              <View style={styles.composeTitleWrap}>
                <View style={styles.composeTitleIcon}>
                  <Image
                    source={require('../../asset/mail.png')} // Update the path as needed
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.composeTitle}>Compose Email</Text>
                  <Text style={styles.composeSubtitle} numberOfLines={1}>
                    New message
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.composeCloseBtn}
                onPress={() => setShowEmailComposeModal(false)}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../asset/close.png')} // Update the path as needed
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain',
                    tintColor: COLORS.textInverse,
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.composeBody}
            contentContainerStyle={styles.composeBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.composeFieldRow}>
              <Text style={styles.composeFieldLabel}>To</Text>
              <TouchableOpacity
                style={styles.composeToSelect}
                onPress={() => setEmailToModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.composeToText} numberOfLines={1}>
                  {selectedEmailTo || 'Select recipient'}
                </Text>

                <Image
                  source={require('../../asset/chevron-down.png')} // Update the path as needed
                  style={{
                    width: 14,
                    height: 14,
                    resizeMode: 'contain',
                    tintColor: COLORS.textSecondary,
                  }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.composeFieldRow}>
              <Text style={styles.composeFieldLabel}>From</Text>
              <View style={styles.composeFromField}>
                <Text style={styles.composeFromText} numberOfLines={1}>
                  {sender.email}
                </Text>

                <Image
                  source={require('../../asset/lock-closed.png')} // Update the path as needed
                  style={{
                    width: 14,
                    height: 14,
                    resizeMode: 'contain',
                    tintColor: COLORS.textTertiary,
                  }}
                />
              </View>
            </View>

            <View style={styles.composeFieldRow}>
              <Text style={styles.composeFieldLabel}>Subject</Text>
              <TextInput
                style={styles.composeInput}
                placeholder="Enter subject"
                placeholderTextColor={COLORS.textTertiary}
                value={composeSubject}
                onChangeText={setComposeSubject}
              />
            </View>

            <View style={styles.composeBlock}>
              <Text style={styles.composeBlockLabel}>Body</Text>
              <TextInput
                style={styles.composeTextarea}
                placeholder="Write your email here..."
                placeholderTextColor={COLORS.textTertiary}
                value={composeBody}
                onChangeText={setComposeBody}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.composeBlock}>
              <View style={styles.composeBlockHeader}>
                <Text style={styles.composeBlockLabel}>Signature</Text>
              </View>
              <TextInput
                style={[
                  styles.composeTextarea,
                  styles.composeSignatureTextarea,
                ]}
                placeholder="Signature"
                placeholderTextColor={COLORS.textTertiary}
                value={composeSignature}
                onChangeText={setComposeSignature}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.composeSendBtn}
              onPress={handleSendEmail}
              activeOpacity={0.85}
            >
              <Image
                source={require('../../asset/send.png')} // Update the path as needed
                style={{
                  width: 18,
                  height: 18,
                  resizeMode: 'contain',
                  tintColor: COLORS.textInverse,
                }}
              />
              <Text style={styles.composeSendBtnText}>Send Email</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEmailToPickerModal = () => (
    <Modal
      visible={emailToModal}
      transparent
      animationType="fade"
      onRequestClose={() => setEmailToModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setEmailToModal(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdownCard}>
              <View style={styles.dropdownHeader}>
                <View style={styles.dropdownIconWrap}>
                  <Image
                    source={require('../../asset/mail.png')} // Update the path as needed
                    style={{
                      width: 22,
                      height: 22,
                      resizeMode: 'contain',
                    }}
                  />
                </View>
                <Text style={styles.dropdownTitle}>Select Recipient</Text>
                <TouchableOpacity
                  onPress={() => setEmailToModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.dropdownBody}
                showsVerticalScrollIndicator={false}
              >
                {contacts.map(c => {
                  const isActive = selectedEmailTo === c.email;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.emailToOption,
                        isActive && styles.emailToOptionActive,
                      ]}
                      onPress={() => {
                        setSelectedEmailTo(c.email);
                        setEmailToModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Image source={c.image} style={styles.emailToAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.emailToName}>{c.name}</Text>
                        <Text style={styles.emailToAddress} numberOfLines={1}>
                          {c.email}
                        </Text>
                      </View>
                      {isActive && (
                        <Image
                          source={require('../../asset/checkmark-circle.png')} // Update the path as needed
                          style={{
                            width: 20,
                            height: 20,
                            resizeMode: 'contain',
                            tintColor: COLORS.primary,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ============================================================
  // RENDER: ANALYTICS MODAL
  // ============================================================
  const renderAnalyticsModal = () => {
    const analytics = calculateAnalytics();
    const mostUsedInfo = getMessageTypeInfo(analytics.mostUsed.id);
    const sentRounded = Math.round(analytics.sentPercentage);
    const receivedRounded = Math.round(analytics.receivedPercentage);

    return (
      <Modal
        visible={showAnalyticsModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.bottomSheetBackdrop}>
          <Animated.View
            style={[
              styles.analyticsSheetContent,
              { transform: [{ translateY: analyticsSheetHeight }] },
            ]}
          >
            <View style={styles.analyticsHeader}>
              <View style={styles.analyticsHeaderDecor}>
                <View style={styles.analyticsDecorCircle1} />
                <View style={styles.analyticsDecorCircle2} />
              </View>
              <View style={styles.analyticsHeaderTop}>
                <View style={styles.analyticsTitleWrap}>
                  <View style={styles.analyticsTitleIcon}>
                    <Image
                      source={require('../../asset/analytics.png')} // Update the path as needed
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                        tintColor: COLORS.textInverse,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.analyticsTitle}>
                      Analytics Dashboard
                    </Text>
                    <Text style={styles.analyticsSubtitle} numberOfLines={1}>
                      {sender.name} • {sender.type}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.analyticsCloseBtn}
                  onPress={() => setShowAnalyticsModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textInverse,
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.analyticsScrollView}
              contentContainerStyle={styles.analyticsScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.analyticsHeroCard}>
                <View style={styles.analyticsHeroDecor}>
                  <View style={styles.analyticsHeroCircle1} />
                  <View style={styles.analyticsHeroCircle2} />
                </View>
                <View style={styles.analyticsHeroContent}>
                  <View style={styles.analyticsHeroIcon}>
                    <Image
                      source={require('../../asset/message.png')} // Update the path as needed
                      style={{
                        width: 18,
                        height: 18,
                        resizeMode: 'contain',
                      }}
                    />
                  </View>
                  <Text style={styles.analyticsHeroNumber}>
                    {analytics.total}
                  </Text>
                  <Text style={styles.analyticsHeroLabel}>Total Messages</Text>
                  <Text style={styles.analyticsHeroSubLabel}>
                    Across all channels
                  </Text>
                </View>
              </View>

              <View style={styles.analyticsStatsRow}>
                <View
                  style={[
                    styles.analyticsStatCard,
                    { borderLeftColor: COLORS.sent },
                  ]}
                >
                  <View
                    style={[
                      styles.analyticsStatIcon,
                      { backgroundColor: COLORS.sentSoft },
                    ]}
                  >
                    <Image
                      source={require('../../asset/arrow-up-circle.png')} // Update the path as needed
                      style={{
                        width: 22,
                        height: 22,
                        resizeMode: 'contain',
                        tintColor: COLORS.sent,
                      }}
                    />
                  </View>
                  <Text
                    style={[styles.analyticsStatNumber, { color: COLORS.sent }]}
                  >
                    {analytics.sentByMe}
                  </Text>
                  <Text style={styles.analyticsStatLabel}>Sent by You</Text>
                  <View
                    style={[
                      styles.analyticsStatBadge,
                      { backgroundColor: COLORS.sentSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.analyticsStatBadgeText,
                        { color: COLORS.sent },
                      ]}
                    >
                      {analytics.sentPercentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.analyticsStatCard,
                    { borderLeftColor: COLORS.received },
                  ]}
                >
                  <View
                    style={[
                      styles.analyticsStatIcon,
                      { backgroundColor: COLORS.receivedSoft },
                    ]}
                  >
                    <Image
                      source={require('../../asset/arrow-down-circle.png')} // Update the path as needed
                      style={{
                        width: 22,
                        height: 22,
                        resizeMode: 'contain',
                        tintColor: COLORS.received,
                      }}
                    />
                  </View>
                  <Text
                    style={[
                      styles.analyticsStatNumber,
                      { color: COLORS.received },
                    ]}
                  >
                    {analytics.received}
                  </Text>
                  <Text style={styles.analyticsStatLabel}>Received</Text>
                  <View
                    style={[
                      styles.analyticsStatBadge,
                      { backgroundColor: COLORS.receivedSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.analyticsStatBadgeText,
                        { color: COLORS.received },
                      ]}
                    >
                      {analytics.receivedPercentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.analyticsSection}>
                <Text style={styles.analyticsSectionTitle}>
                  MOST USED MEDIUM
                </Text>
                <View
                  style={[
                    styles.mostUsedCard,
                    { borderLeftColor: mostUsedInfo.color },
                  ]}
                >
                  <View
                    style={[
                      styles.mostUsedIcon,
                      { backgroundColor: mostUsedInfo.color + '15' },
                    ]}
                  >
                    <Image
                      source={mostUsedInfo.icon}
                      style={{
                        width: 28,
                        height: 28,
                        resizeMode: 'contain',
                        tintColor: mostUsedInfo.color,
                      }}
                    />
                  </View>
                  <View style={styles.mostUsedInfo}>
                    <Text style={styles.mostUsedLabel}>TOP CHANNEL</Text>
                    <Text
                      style={[
                        styles.mostUsedName,
                        { color: mostUsedInfo.color },
                      ]}
                    >
                      {mostUsedInfo.label}
                    </Text>
                    <Text style={styles.mostUsedDesc}>
                      {analytics.mostUsed.count} messages •{' '}
                      {analytics.mostUsed.percentage.toFixed(1)}% of total
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.mostUsedBadge,
                      { backgroundColor: mostUsedInfo.color },
                    ]}
                  >
                    <Image
                      source={require('../../asset/trophy.png')} // Update the path as needed
                      style={{
                        width: 18,
                        height: 18,
                        resizeMode: 'contain',
                        tintColor: COLORS.textInverse,
                      }}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.analyticsSection}>
                <Text style={styles.analyticsSectionTitle}>
                  SENT VS RECEIVED DISTRIBUTION
                </Text>
                <View style={styles.chartCard}>
                  <View style={styles.pieChartRow}>
                    <View style={styles.pieChartWrapper}>
                      <View
                        style={[
                          styles.pieChartOuter,
                          { width: 170, height: 170, borderRadius: 85 },
                        ]}
                      >
                        <View
                          style={[
                            styles.pieLeftHalf,
                            {
                              width: 85,
                              height: 170,
                              backgroundColor: COLORS.sent,
                              borderTopLeftRadius: 85,
                              borderBottomLeftRadius: 85,
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.pieRightHalf,
                            {
                              width: 85,
                              height: 170,
                              backgroundColor: COLORS.received,
                              borderTopRightRadius: 85,
                              borderBottomRightRadius: 85,
                            },
                          ]}
                        />
                        {sentRounded !== 50 && (
                          <>
                            {sentRounded > 50 ? (
                              <View
                                style={[
                                  styles.pieOverlaySent,
                                  {
                                    width: 85,
                                    height: 170,
                                    backgroundColor: COLORS.sent,
                                    borderTopRightRadius: 85,
                                    borderBottomRightRadius: 85,
                                    right: 0,
                                    position: 'absolute',
                                    opacity: (sentRounded - 50) / 50,
                                  },
                                ]}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.pieOverlayReceived,
                                  {
                                    width: 85,
                                    height: 170,
                                    backgroundColor: COLORS.received,
                                    borderTopLeftRadius: 85,
                                    borderBottomLeftRadius: 85,
                                    left: 0,
                                    position: 'absolute',
                                    opacity: (receivedRounded - 50) / 50,
                                  },
                                ]}
                              />
                            )}
                          </>
                        )}
                        <View style={[styles.pieLabelLeft, { left: 12 }]}>
                          <Text style={styles.pieLabelText}>
                            {sentRounded}%
                          </Text>
                        </View>
                        <View style={[styles.pieLabelRight, { right: 12 }]}>
                          <Text style={styles.pieLabelText}>
                            {receivedRounded}%
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.pieChartCenter,
                            { width: 94, height: 94, borderRadius: 47 },
                          ]}
                        >
                          <Text style={styles.pieChartCenterLabel}>TOTAL</Text>
                          <Text style={styles.pieChartCenterValue}>
                            {analytics.total}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.pieChartLegend}>
                      <View
                        style={[styles.pieLegendItem, styles.pieLegendSent]}
                      >
                        <View
                          style={[
                            styles.pieLegendDot,
                            { backgroundColor: COLORS.sent },
                          ]}
                        />
                        <View style={styles.pieLegendTextWrap}>
                          <Text style={styles.pieLegendLabel}>Sent</Text>
                          <Text style={styles.pieLegendValue}>
                            {analytics.sentByMe} msgs
                          </Text>
                          <Text
                            style={[
                              styles.pieLegendPercentage,
                              { color: COLORS.sent },
                            ]}
                          >
                            {analytics.sentPercentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[styles.pieLegendItem, styles.pieLegendReceived]}
                      >
                        <View
                          style={[
                            styles.pieLegendDot,
                            { backgroundColor: COLORS.received },
                          ]}
                        />
                        <View style={styles.pieLegendTextWrap}>
                          <Text style={styles.pieLegendLabel}>Received</Text>
                          <Text style={styles.pieLegendValue}>
                            {analytics.received} msgs
                          </Text>
                          <Text
                            style={[
                              styles.pieLegendPercentage,
                              { color: COLORS.received },
                            ]}
                          >
                            {analytics.receivedPercentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.analyticsSection}>
                <Text style={styles.analyticsSectionTitle}>
                  MESSAGES BY MEDIUM
                </Text>
                <View style={styles.chartCard}>
                  <View style={styles.mediumBars}>
                    {messageTypes.slice(0, 4).map(type => {
                      const count = analytics.mediumCounts[type.id] || 0;
                      const percentage =
                        analytics.total > 0
                          ? (count / analytics.total) * 100
                          : 0;
                      const maxCount = Math.max(
                        ...Object.values(analytics.mediumCounts),
                        1,
                      );
                      const barWidth = (count / maxCount) * 100;
                      return (
                        <View key={type.id} style={styles.mediumBarRow}>
                          <View style={styles.mediumBarLabelWrap}>
                            <View
                              style={[
                                styles.mediumBarIcon,
                                { backgroundColor: type.color + '15' },
                              ]}
                            >
                              <Image
                                source={type.icon}
                                style={{
                                  width: 14,
                                  height: 14,
                                  resizeMode: 'contain',
                                  tintColor: type.color,
                                }}
                              />
                            </View>
                            <Text style={styles.mediumBarLabel}>
                              {type.label}
                            </Text>
                          </View>
                          <View style={styles.mediumBarTrack}>
                            <View
                              style={[
                                styles.mediumBarFill,
                                {
                                  width: `${Math.max(barWidth, 8)}%`,
                                  backgroundColor: type.color,
                                },
                              ]}
                            >
                              <Text style={styles.mediumBarFillText}>
                                {count}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.mediumBarPercentage,
                              { color: type.color },
                            ]}
                          >
                            {percentage.toFixed(0)}%
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.analyticsSection}>
                <Text style={styles.analyticsSectionTitle}>
                  ALL MEDIUMS BREAKDOWN
                </Text>
                <View style={styles.tableCard}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>
                      Medium
                    </Text>
                    <Text
                      style={[
                        styles.tableHeaderCell,
                        { flex: 1, textAlign: 'center' },
                      ]}
                    >
                      Count
                    </Text>
                    <Text
                      style={[
                        styles.tableHeaderCell,
                        { flex: 1, textAlign: 'right' },
                      ]}
                    >
                      Share
                    </Text>
                  </View>
                  {messageTypes.slice(0, 4).map((type, idx) => {
                    const count = analytics.mediumCounts[type.id] || 0;
                    const percentage =
                      analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                    return (
                      <View
                        key={type.id}
                        style={[
                          styles.tableRow,
                          idx % 2 === 0 && styles.tableRowAlt,
                        ]}
                      >
                        <View
                          style={[
                            styles.tableCell,
                            {
                              flex: 2,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.tableCellIcon,
                              { backgroundColor: type.color + '15' },
                            ]}
                          >
                            <Image
                              source={type.icon}
                              style={{
                                width: 14,
                                height: 14,
                                resizeMode: 'contain',
                                tintColor: type.color,
                              }}
                            />
                          </View>
                          <Text style={styles.tableCellText}>{type.label}</Text>
                        </View>
                        <Text
                          style={[
                            styles.tableCell,
                            { flex: 1, textAlign: 'center', fontWeight: '700' },
                          ]}
                        >
                          {count}
                        </Text>
                        <View
                          style={[
                            styles.tableCell,
                            {
                              flex: 1,
                              flexDirection: 'row',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              gap: 6,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tableCellText,
                              { color: type.color, fontWeight: '700' },
                            ]}
                          >
                            {percentage.toFixed(1)}%
                          </Text>
                          <View
                            style={[
                              styles.tableShareBar,
                              { backgroundColor: type.color + '20' },
                            ]}
                          >
                            <View
                              style={[
                                styles.tableShareBarFill,
                                {
                                  width: `${percentage}%`,
                                  backgroundColor: type.color,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  <View style={styles.tableFooter}>
                    <Text style={[styles.tableFooterCell, { flex: 2 }]}>
                      Total
                    </Text>
                    <Text
                      style={[
                        styles.tableFooterCell,
                        { flex: 1, textAlign: 'center' },
                      ]}
                    >
                      {analytics.total}
                    </Text>
                    <Text
                      style={[
                        styles.tableFooterCell,
                        { flex: 1, textAlign: 'right' },
                      ]}
                    >
                      100%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.analyticsSection}>
                <View style={styles.activitySectionHeader}>
                  <Text style={styles.analyticsSectionTitle}>
                    Activity (
                    {activityChartFilter === 'week'
                      ? 'Last 7 days'
                      : activityChartFilter === 'month'
                      ? 'This Month'
                      : 'Custom Range'}
                    )
                  </Text>
                  <TouchableOpacity
                    style={styles.activityFilterBtn}
                    onPress={() => setShowActivityChartFilterModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.activityFilterBtnText}>
                      {activityChartFilterOptions.find(
                        f => f.id === activityChartFilter,
                      )?.label || 'This Week'}
                    </Text>

                    <Image
                      source={require('../../asset/chevron-down.png')} // Update the path as needed
                      style={{
                        width: 14,
                        height: 14,
                        resizeMode: 'contain',
                        tintColor: COLORS.primary,
                      }}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.chartCard}>{renderLineChart()}</View>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // RENDER: TIME FILTER MODAL
  // ============================================================
  const renderTimeFilterModal = () => (
    <Modal
      visible={showTimeFilterModal}
      transparent
      animationType="none"
      onRequestClose={() => setShowTimeFilterModal(false)}
    >
      <View style={styles.bottomSheetBackdrop}>
        <TouchableWithoutFeedback onPress={() => setShowTimeFilterModal(false)}>
          <Animated.View
            style={[
              styles.filterSheetContent,
              { transform: [{ translateY: timeFilterSheetHeight }] },
            ]}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>
            <View style={styles.filterSheetHeader}>
              <View style={styles.filterSheetHeaderDecor}>
                <View style={styles.filterSheetDecorCircle1} />
                <View style={styles.filterSheetDecorCircle2} />
              </View>
              <View style={styles.filterSheetHeaderTop}>
                <View style={styles.filterSheetTitleWrap}>
                  <View style={styles.filterSheetTitleIcon}>
                    <Image
                      source={require('../../asset/calendar.png')} // Update the path as needed
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                        tintColor: COLORS.textInverse,
                      }}
                    />
                  </View>
                  <View>
                    <Text style={styles.filterSheetTitle}>Analysis Period</Text>
                    <Text style={styles.filterSheetSubtitle}>
                      Choose time range for analysis
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.filterSheetCloseBtn}
                  onPress={() => setShowTimeFilterModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textInverse,
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.filterSheetBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.filterSheetBodyContent}
            >
              {timeFilterOptions.map(option => {
                const isActive = analysisTimeFilter === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.timeFilterItem,
                      isActive && styles.timeFilterItemActive,
                    ]}
                    onPress={() => {
                      setAnalysisTimeFilter(option.id);
                      if (option.id === 'custom') {
                        setShowTimeFilterModal(false);
                        setTimeout(() => setShowCustomDateModal(true), 300);
                      } else setShowTimeFilterModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.timeFilterIconWrap,
                        isActive && { backgroundColor: COLORS.primary },
                      ]}
                    >
                      <Image
                        source={option.icon}
                        style={{
                          width: 20,
                          height: 20,
                          resizeMode: 'contain',
                          tintColor: isActive
                            ? COLORS.textInverse
                            : COLORS.primary,
                        }}
                      />

                      {/* <Image
                                                source={option.icon}
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    resizeMode: 'contain',
                                                    tintColor: option.color,
                                                }}
                                            /> */}
                    </View>
                    <View style={styles.timeFilterTextWrap}>
                      <Text
                        style={[
                          styles.timeFilterLabel,
                          isActive && styles.timeFilterLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.timeFilterDesc}>{option.desc}</Text>
                    </View>
                    {isActive && (
                      <Image
                        source={require('../../asset/checkmark-circle.png')} // Update the path as needed
                        style={{
                          width: 24,
                          height: 24,
                          resizeMode: 'contain',
                          tintColor: COLORS.primary,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );

  // ============================================================
  // RENDER: ACTIVITY CHART FILTER MODAL
  // ============================================================
  const renderActivityChartFilterModal = () => (
    <Modal
      visible={showActivityChartFilterModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowActivityChartFilterModal(false)}
    >
      <TouchableWithoutFeedback
        onPress={() => setShowActivityChartFilterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.activityFilterCard}>
              <View style={styles.activityFilterHeader}>
                <View style={styles.activityFilterIconWrap}>
                  <Image
                    source={require('../../asset/calendar.png')} // Update the path as needed
                    style={{
                      width: 22,
                      height: 22,
                      resizeMode: 'contain',
                      tintColor: COLORS.primary,
                    }}
                  />
                </View>
                <Text style={styles.activityFilterTitle}>Select Period</Text>
                <TouchableOpacity
                  onPress={() => setShowActivityChartFilterModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
              </View>
              {activityChartFilterOptions.map(option => {
                const isActive = activityChartFilter === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.activityFilterOption,
                      isActive && styles.activityFilterOptionActive,
                    ]}
                    onPress={() => {
                      setActivityChartFilter(option.id);
                      setShowActivityChartFilterModal(false);
                      if (option.id === 'custom')
                        setTimeout(
                          () => setShowActivityChartCustomDateModal(true),
                          300,
                        );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.activityFilterOptionText,
                        isActive && styles.activityFilterOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isActive && (
                      <Image
                        source={require('../../asset/checkmark-circle.png')} // Update the path as needed
                        style={{
                          width: 20,
                          height: 20,
                          resizeMode: 'contain',
                          tintColor: COLORS.primary,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ============================================================
  // RENDER: ACTIVITY CHART CUSTOM DATE MODAL
  // ============================================================
  const renderActivityChartCustomDateModal = () => (
    <Modal
      visible={showActivityChartCustomDateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowActivityChartCustomDateModal(false)}
    >
      <TouchableWithoutFeedback
        onPress={() => setShowActivityChartCustomDateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.customDateCard}>
              <View style={styles.customDateHeader}>
                <View style={styles.customDateIcon}>
                  <Image
                    source={require('../../asset/calendar.png')} // Update the path as needed
                    style={{
                      width: 22,
                      height: 22,
                      resizeMode: 'contain',
                      tintColor: COLORS.primary,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customDateTitle}>Custom Date Range</Text>
                  <Text style={styles.customDateSubtitle}>
                    Select start and end date for activity chart
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowActivityChartCustomDateModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.customDateBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Start Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textTertiary}
                    value={activityChartCustomStartDate}
                    onChangeText={setActivityChartCustomStartDate}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>End Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textTertiary}
                    value={activityChartCustomEndDate}
                    onChangeText={setActivityChartCustomEndDate}
                  />
                </View>
              </View>
              <View style={styles.customDateActions}>
                <TouchableOpacity
                  style={styles.customDateCancelBtn}
                  onPress={() => setShowActivityChartCustomDateModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customDateCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.customDateApplyBtn}
                  onPress={() => {
                    setShowActivityChartCustomDateModal(false);
                    setShowAnalyticsModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.customDateApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ============================================================
  // RENDER: CUSTOM DATE MODAL
  // ============================================================
  const renderCustomDateModal = () => (
    <Modal
      visible={showCustomDateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCustomDateModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowCustomDateModal(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.customDateCard}>
              <View style={styles.customDateHeader}>
                <View style={styles.customDateIcon}>
                  <Image
                    source={require('../../asset/calendar.png')} // Update the path as needed
                    style={{
                      width: 22,
                      height: 22,
                      resizeMode: 'contain',
                      tintColor: COLORS.primary,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customDateTitle}>Custom Date Range</Text>
                  <Text style={styles.customDateSubtitle}>
                    Select start and end date
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCustomDateModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.customDateBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Start Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textTertiary}
                    value={customStartDate}
                    onChangeText={setCustomStartDate}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>End Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textTertiary}
                    value={customEndDate}
                    onChangeText={setCustomEndDate}
                  />
                </View>
              </View>
              <View style={styles.customDateActions}>
                <TouchableOpacity
                  style={styles.customDateCancelBtn}
                  onPress={() => setShowCustomDateModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customDateCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.customDateApplyBtn}
                  onPress={() => {
                    setShowCustomDateModal(false);
                    setTimeout(() => setShowAnalyticsModal(true), 300);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.customDateApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ============================================================
  // RENDER: DROPDOWN PICKER MODAL
  // ============================================================
  const renderDropdownModal = ({
    visible,
    onClose,
    title,
    options,
    selectedValue,
    onSelect,
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdownCard}>
              <View style={styles.dropdownHeader}>
                <View style={styles.dropdownIconWrap}>
                  <Image
                    source={require('../../asset/list.png')} // Update the path as needed
                    style={{
                      width: 22,
                      height: 22,
                      resizeMode: 'contain',
                      tintColor: COLORS.primary,
                    }}
                  />
                </View>
                <Text style={styles.dropdownTitle}>{title}</Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.dropdownBody}
                showsVerticalScrollIndicator={false}
              >
                {options.map(opt => {
                  const isActive = selectedValue === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.dropdownOption,
                        isActive && styles.dropdownOptionActive,
                      ]}
                      onPress={() => {
                        onSelect(opt);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isActive && styles.dropdownOptionTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                      {isActive && (
                        <Image
                          source={require('../../asset/checkmark-circle.png')} // Update the path as needed
                          style={{
                            width: 20,
                            height: 20,
                            resizeMode: 'contain',
                            tintColor: COLORS.primary,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ============================================================
  // RENDER: ADD / EDIT CONTACT MODAL
  // ============================================================
  const renderAddContactModal = () => (
    <Modal
      visible={showAddContactModal}
      transparent
      animationType="none"
      onRequestClose={() => setShowAddContactModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.bottomSheetBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            styles.addContactSheetContent,
            { transform: [{ translateY: addContactSheetHeight }] },
          ]}
        >
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <View style={styles.addContactHeader}>
            <View style={styles.addContactHeaderDecor}>
              <View style={styles.addContactDecorCircle1} />
              <View style={styles.addContactDecorCircle2} />
            </View>
            <View style={styles.addContactHeaderTop}>
              <View style={styles.addContactTitleWrap}>
                <View style={styles.addContactTitleIcon}>
                  <Image
                    source={
                      isEditingContact
                        ? require('../../asset/create.png')
                        : require('../../asset/person_add.png')
                    }
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                      tintColor: COLORS.textInverse,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addContactTitle}>
                    {isEditingContact ? 'Edit Contact' : 'Add New Contact'}
                  </Text>
                  <Text style={styles.addContactSubtitle} numberOfLines={1}>
                    {getFormFullName()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addContactCloseBtn}
                onPress={() => setShowAddContactModal(false)}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../asset/close.png')} // Update the path as needed
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain',
                    tintColor: COLORS.textInverse,
                  }}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.addContactHeaderChips}>
              <View style={styles.addContactHeaderChip}>
                <Image
                  source={require('../../asset/pricetag.png')} // Update the path as needed
                  style={{
                    width: 11,
                    height: 11,
                    resizeMode: 'contain',
                    tintColor: COLORS.textInverse,
                  }}
                />
                <Text style={styles.addContactHeaderChipText}>
                  {contactForm.type || 'Type'}
                </Text>
              </View>
              <View style={styles.addContactHeaderChip}>
                <Image
                  source={require('../../asset/layers.png')} // Update the path as needed
                  style={{
                    width: 11,
                    height: 11,
                    resizeMode: 'contain',
                    tintColor: COLORS.textInverse,
                  }}
                />
                <Text style={styles.addContactHeaderChipText}>
                  {isEditingContact ? 'Editing' : 'Subtype'}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.addContactBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.addContactBodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type</Text>
              <TouchableOpacity
                style={styles.formDropdown}
                onPress={() => setShowTypeDropdown(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.formDropdownText,
                    !contactForm.type && { color: COLORS.textTertiary },
                  ]}
                >
                  {contactForm.type || 'Select Type'}
                </Text>

                <Image
                  source={require('../../asset/chevron-down.png')} // Update the path as needed
                  style={{
                    width: 14,
                    height: 14,
                    resizeMode: 'contain',
                    tintColor: COLORS.textSecondary,
                  }}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>Name</Text>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>First Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter first name"
                placeholderTextColor={COLORS.textTertiary}
                value={contactForm.firstName}
                onChangeText={t =>
                  setContactForm({ ...contactForm, firstName: t })
                }
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Middle Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter middle name (optional)"
                placeholderTextColor={COLORS.textTertiary}
                value={contactForm.middleName}
                onChangeText={t =>
                  setContactForm({ ...contactForm, middleName: t })
                }
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Last Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter last name"
                placeholderTextColor={COLORS.textTertiary}
                value={contactForm.lastName}
                onChangeText={t =>
                  setContactForm({ ...contactForm, lastName: t })
                }
              />
            </View>

            <Text style={styles.sectionHeader}>Address Information</Text>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Street address"
                placeholderTextColor={COLORS.textTertiary}
                value={contactForm.address}
                onChangeText={t =>
                  setContactForm({ ...contactForm, address: t })
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Country</Text>

              <TouchableOpacity
                style={styles.formDropdown}
                onPress={() => setShowCountryDropdown(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.formDropdownText,
                    !contactForm.country && { color: COLORS.textTertiary },
                  ]}
                >
                  {contactForm.country || 'Select Country'}
                </Text>

                <Image
                  source={require('../../asset/chevron-down.png')} // Update the path as needed
                  style={{
                    width: 14,
                    height: 14,
                    resizeMode: 'contain',
                    tintColor: COLORS.textSecondary,
                  }}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>City</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="City"
                  placeholderTextColor={COLORS.textTertiary}
                  value={contactForm.city}
                  onChangeText={t =>
                    setContactForm({ ...contactForm, city: t })
                  }
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>ZIP</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="ZIP code"
                  placeholderTextColor={COLORS.textTertiary}
                  value={contactForm.zip}
                  onChangeText={t => setContactForm({ ...contactForm, zip: t })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {isSendingSms ? (
              <ActivityIndicator size="small" color="#020202" />
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>State</Text>
                <TouchableOpacity
                  style={styles.formDropdown}
                  onPress={() => setShowStateDropdown(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.formDropdownText,
                      !contactForm.state && { color: COLORS.textTertiary },
                    ]}
                  >
                    {contactForm.state || 'Select State'}
                  </Text>

                  <Image
                    source={require('../../asset/chevron-down.png')} // Update the path as needed
                    style={{
                      width: 14,
                      height: 14,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionHeader}>Contact Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={styles.countryCodeBtn}
                  onPress={() => setShowPhoneCountryDropdown(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryCodeText}>
                    {contactForm.country_phone_code}
                  </Text>

                  <Image
                    source={require('../../asset/chevron-down.png')} // Update the path as needed
                    style={{
                      width: 14,
                      height: 14,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
                <TextInput
                  style={[styles.formInput, styles.phoneInput]}
                  placeholder="Phone number"
                  placeholderTextColor={COLORS.textTertiary}
                  value={contactForm.phoneNumber}
                  onChangeText={t =>
                    setContactForm({ ...contactForm, phoneNumber: t })
                  }
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>WhatsApp Number</Text>
              <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={styles.countryCodeBtn}
                  onPress={() => setShowWhatsappCountryDropdown(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryCodeText}>
                    {contactForm.country_phone_code}
                  </Text>

                  <Image
                    source={require('../../asset/chevron-down.png')} // Update the path as needed
                    style={{
                      width: 14,
                      height: 14,
                      resizeMode: 'contain',
                      tintColor: COLORS.textSecondary,
                    }}
                  />
                </TouchableOpacity>
                <TextInput
                  style={[styles.formInput, styles.phoneInput]}
                  placeholder="WhatsApp number"
                  placeholderTextColor={COLORS.textTertiary}
                  value={contactForm.whatsappNumber}
                  onChangeText={t =>
                    setContactForm({ ...contactForm, whatsappNumber: t })
                  }
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter email"
                placeholderTextColor={COLORS.textTertiary}
                value={contactForm.email}
                onChangeText={t => setContactForm({ ...contactForm, email: t })}
              />
            </View>

            <TouchableOpacity
              style={styles.saveContactBtn}
              onPress={handleSaveContact}
              activeOpacity={0.85}
            >
              <Image
                source={
                  isEditingContact
                    ? require('../../asset/save.png')
                    : require('../../asset/checkmark-circle.png')
                }
                style={{
                  width: 20,
                  height: 20,
                  resizeMode: 'contain',
                  tintColor: COLORS.textInverse,
                }}
              />
              <Text style={styles.saveContactBtnText}>
                {isEditingContact ? 'Save Changes' : 'Save Contact'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ============================================================
  // RENDER: CONTACT SIDE DRAWER
  // ============================================================

  const renderContactModal = () => (
    <Modal
      visible={showContactModal}
      transparent
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.sideDrawerBackdrop}>
        <TouchableWithoutFeedback onPress={() => setShowContactModal(false)}>
          <Animated.View
            style={[
              styles.sideDrawer,
              {
                opacity: contactSheetOpacity,
                transform: [
                  {
                    translateX: contactDrawerX,
                  },
                ],
              },
            ]}
          >
            {/* HEADER */}
            <View
              style={[
                styles.contactHeader,
                {
                  paddingTop: HEADER_TOP_PADDING + 12,
                },
              ]}
            >
              <View style={styles.contactHeaderDecor}>
                <View style={styles.contactDecorCircle1} />
                <View style={styles.contactDecorCircle2} />
              </View>

              <View style={styles.contactHeaderTop}>
                <View style={styles.contactTitleWrap}>
                  <View style={styles.contactTitleIcon}>
                    <Image
                      source={require('../../asset/people.png')}
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                        tintColor: COLORS.textInverse,
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactTitle}>Contacts</Text>

                    <Text style={styles.contactSubtitle}>
                      {contacts.length}{' '}
                      {contacts.length === 1 ? 'contact' : 'contacts'} available
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.contactCloseBtn}
                  onPress={() => setShowContactModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')}
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textInverse,
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CONTACT LIST */}
            <FlatList
              data={contacts}
              keyExtractor={item => String(item.id)}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              style={styles.contactBody}
              contentContainerStyle={[
                styles.contactBodyContent,
                {
                  paddingBottom: 40,
                },
              ]}
              ListHeaderComponent={
                <TouchableOpacity
                  style={styles.addContactCard}
                  onPress={handleOpenAddContact}
                  activeOpacity={0.75}
                >
                  <View style={styles.addContactCardIconWrap}>
                    <Image
                      source={require('../../asset/person_add.png')}
                      style={{
                        width: 24,
                        height: 24,
                        resizeMode: 'contain',
                        tintColor: COLORS.textInverse,
                      }}
                    />
                  </View>

                  <View style={styles.addContactCardTextWrap}>
                    <Text style={styles.addContactCardTitle}>
                      Add New Contact
                    </Text>

                    <Text style={styles.addContactCardSubtitle}>
                      Tap to create a new contact
                    </Text>
                  </View>

                  <Image
                    source={require('../../asset/chevron-forward.png')}
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain',
                      tintColor: COLORS.textInverse,
                    }}
                  />
                </TouchableOpacity>
              }
              renderItem={({ item: contact }) => (
                // your contact item here
                <View style={styles.contactItem}>
                  <View style={styles.contactItemTop}>
                    <Image
                      source={require('../../asset/dummyuser.png')}
                      style={styles.contactAvatar}
                    />

                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>

                      <Text style={styles.contactUserTag}>{contact.role}</Text>
                    </View>

                    <View style={styles.contactItemActions}>
                      <TouchableOpacity
                        style={[
                          styles.contactIconBtn,
                          { backgroundColor: COLORS.primarySoft },
                        ]}
                        onPress={() => handleOpenEditContact(contact)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={require('../../asset/pencil.png')}
                          style={{
                            width: 16,
                            height: 16,
                            resizeMode: 'contain',
                            tintColor: COLORS.primary,
                          }}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.contactIconBtn,
                          { backgroundColor: COLORS.dangerSoft },
                        ]}
                        onPress={() => handleDeleteContact(contact.id)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={require('../../asset/trash.png')}
                          style={{
                            width: 16,
                            height: 16,
                            resizeMode: 'contain',
                            tintColor: COLORS.danger,
                          }}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.contactDetailsWrap}>
                    <View style={styles.contactDetailRow}>
                      <Image
                        source={require('../../asset/call.png')}
                        style={{
                          width: 13,
                          height: 13,
                          resizeMode: 'contain',
                          tintColor: COLORS.success,
                        }}
                      />

                      <Text style={styles.contactDetailText} numberOfLines={1}>
                        {contact.phone}
                      </Text>
                    </View>

                    <View style={styles.contactDetailRow}>
                      <Image
                        source={require('../../asset/email.png')}
                        style={{
                          width: 13,
                          height: 13,
                          resizeMode: 'contain',
                          tintColor: COLORS.warning,
                        }}
                      />

                      <Text style={styles.contactDetailText} numberOfLines={1}>
                        {contact.email}
                      </Text>
                    </View>

                    <View style={styles.contactDetailRow}>
                      <Image
                        source={require('../../asset/whats-app.png')}
                        style={{
                          width: 13,
                          height: 13,
                          resizeMode: 'contain',
                          tintColor: COLORS.whatsapp,
                        }}
                      />

                      <Text style={styles.contactDetailText} numberOfLines={1}>
                        {contact.whatsapp}
                      </Text>
                    </View>

                    <View style={styles.contactDetailRow}>
                      <Image
                        source={require('../../asset/location.png')}
                        style={{
                          width: 13,
                          height: 13,
                          resizeMode: 'contain',
                          tintColor: COLORS.primary,
                        }}
                      />

                      <Text style={styles.contactDetailText} numberOfLines={2}>
                        {contact.address}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );

  // ============================================================
  // RENDER: REACTION PICKER MODAL
  // ============================================================
  const renderReactionPicker = () => (
    <Modal
      visible={showReactionPicker}
      transparent
      animationType="none"
      onRequestClose={() => setShowReactionPicker(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowReactionPicker(false)}>
        <View style={styles.reactionBackdrop}>
          <Animated.View
            style={[
              styles.reactionCard,
              {
                opacity: reactionOpacity,
                transform: [{ scale: reactionScale }],
              },
            ]}
          >
            <Text style={styles.reactionTitle}>React to message</Text>
            <View style={styles.reactionRow}>
              {REACTION_EMOJIS.map((emoji, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.reactionEmojiBtn}
                  onPress={() => handleReactionSelect(emoji)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ============================================================
  // RENDER: TRANSLATE SIDE DRAWER
  // ============================================================
  const renderTranslateModal = () => (
    <Modal
      visible={showTranslateModal}
      transparent
      animationType="none"
      onRequestClose={() => setShowTranslateModal(false)}
      statusBarTranslucent={true}
    >
      <View style={styles.sideDrawerBackdrop}>
        <TouchableWithoutFeedback onPress={() => setShowTranslateModal(false)}>
          <Animated.View
            style={[
              styles.sideDrawer,
              {
                opacity: translateSheetOpacity,
                transform: [{ translateX: translateDrawerX }],
              },
            ]}
          >
            <View
              style={[
                styles.translateHeader,
                { paddingTop: HEADER_TOP_PADDING + 12 },
              ]}
            >
              <View style={styles.translateHeaderDecor}>
                <View style={styles.translateDecorCircle1} />
                <View style={styles.translateDecorCircle2} />
              </View>
              <View style={styles.translateHeaderTop}>
                <View style={styles.translateTitleWrap}>
                  <View style={styles.translateTitleIcon}>
                    <Image
                      source={require('../../asset/language.png')} // Update the path as needed
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                        tintColor: COLORS.textInverse,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.translateTitle}>Translate Message</Text>
                    <Text style={styles.translateSubtitle} numberOfLines={1}>
                      {translateTargetMessage?.message}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.translateCloseBtn}
                  onPress={() => setShowTranslateModal(false)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../asset/close.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textInverse,
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.translateBody}
              contentContainerStyle={styles.translateBodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.translateLabel}>Choose language</Text>
              <View style={styles.languageGrid}>
                {Object.entries(TRANSLATIONS).map(([code, name]) => {
                  const isActive = selectedLanguage === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[
                        styles.languageChip,
                        isActive && styles.languageChipActive,
                      ]}
                      onPress={() => performTranslation(code)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.languageChipText,
                          isActive && styles.languageChipTextActive,
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {translatedResult ? (
                <View style={styles.translationResultCard}>
                  <View style={styles.translationResultHeader}>
                    <Image
                      source={require('../../asset/sparkles.png')} // Update the path as needed
                      style={{
                        width: 16,
                        height: 16,
                        resizeMode: 'contain',
                        tintColor: COLORS.primary,
                      }}
                    />
                    <Text style={styles.translationResultLabel}>
                      Translated to {TRANSLATIONS[selectedLanguage]}
                    </Text>
                  </View>
                  <Text style={styles.translationResultText}>
                    {translatedResult}
                  </Text>
                </View>
              ) : (
                <View style={styles.translationEmptyCard}>
                  <Image
                    source={require('../../asset/language-outline.png')} // Update the path as needed
                    style={{
                      width: 32,
                      height: 32,
                      resizeMode: 'contain',
                      tintColor: COLORS.textTertiary,
                    }}
                  />
                  <Text style={styles.translationEmptyText}>
                    Select a language above to see the translation
                  </Text>
                </View>
              )}

              {translatedResult ? (
                <TouchableOpacity
                  style={styles.translationSaveBtn}
                  onPress={handleSaveTranslation}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require('../../asset/checkmark-circle.png')} // Update the path as needed
                    style={{
                      width: 18,
                      height: 18,
                      resizeMode: 'contain',
                      tintColor: COLORS.textInverse,
                    }}
                  />
                  <Text style={styles.translationSaveBtnText}>
                    Save Translation
                  </Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );

  // ============================================================
  // RENDER: HEADER
  // ============================================================
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: HEADER_TOP_PADDING + 25 }]}>
      <StatusBar
        backgroundColor={COLORS.primaryDark}
        barStyle="light-content"
        translucent={Platform.OS === 'android'}
      />

      <View style={styles.headerDecor}>
        <View style={[styles.decorCircle, styles.decorCircle1]} />
        <View style={[styles.decorCircle, styles.decorCircle2]} />
        <View style={[styles.decorCircle, styles.decorCircle3]} />
      </View>

      <View style={styles.headerMain}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../asset/close-circle.png')} // Update the path as needed
            style={{
              width: 22,
              height: 22,
              resizeMode: 'contain',
              tintColor: COLORS.textInverse,
            }}
          />
        </TouchableOpacity>

        <View style={styles.senderInfo}>
          <View style={styles.avatarWrapper}>
            <Image source={sender.image} style={styles.avatar} />
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    sender.status === 'online'
                      ? COLORS.success
                      : COLORS.textTertiary,
                },
              ]}
            />
          </View>

          <View style={styles.senderTextWrap}>
            <View style={styles.nameRow}>
              <View style={styles.senderRow}>
                <Text style={styles.senderName} numberOfLines={1}>
                  {sender.name}
                </Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{sender.status}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.contactCardBtn}
                onPress={() => setShowContactModal(true)}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../asset/people.png')} // Update the path as needed
                  style={{
                    width: 16,
                    height: 16,
                    resizeMode: 'contain',
                    tintColor: COLORS.textInverse,
                  }}
                />
                <View style={styles.contactCardBadge}>
                  <Text style={styles.contactCardBadgeText}>
                    {contacts.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowMessageModal(true)}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../asset/chevron-down.png')} // Update the path as needed
                  style={{
                    width: 14,
                    height: 14,
                    resizeMode: 'contain',
                    tintColor: COLORS.textInverse,
                  }}
                />
              </TouchableOpacity>
            </View>

            {/* <View style={styles.typeRow}>
                           
                            <Text style={styles.senderType}>{sender.type}</Text>

                        </View> */}

            <View style={styles.typeActionRow}>
              {/* User Type */}
              <View style={styles.typeRow}>
                <Text style={styles.senderType} numberOfLines={1}>
                  {sender.type}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {messageTypes.slice(0, 4).map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.actionBtn}
                    onPress={() => {
                      if (type.id === 'email') handleOpenEmailCompose();
                      else if (type.id === 'whatsapp')
                        handleOpenWhatsappCompose();
                      else if (type.id === 'sms') handleOpenSmsCompose();
                      else if (type.id === 'call') setShowCallModal(true);
                      else {
                        setSelectedMessageType(type.id);
                        inputRef.current?.focus();
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.actionBtnIcon,
                        { backgroundColor: type.bg },
                      ]}
                    >
                      <Image
                        source={type.icon}
                        style={{
                          width: 15,
                          height: 15,
                          resizeMode: 'contain',
                          tintColor: type.color,
                        }}
                      />
                    </View>

                    {/* <Text style={styles.actionBtnLabel}>
                                            {type.label}
                                        </Text> */}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* <View style={styles.actionsRow}>
                {messageTypes.slice(0, 4).map((type) => (
                    <TouchableOpacity
                        key={type.id}
                        style={styles.actionBtn}
                        onPress={() => {
                            if (type.id === 'email') handleOpenEmailCompose();
                            else if (type.id === 'whatsapp') handleOpenWhatsappCompose();
                            else if (type.id === 'sms') handleOpenSmsCompose();
                            else if (type.id === 'call') setShowCallModal(true);
                            else {
                                setSelectedMessageType(type.id);
                                inputRef.current?.focus();
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.actionBtnIcon, { backgroundColor: type.bg }]}>

                            <Image
                                source={type.icon}
                                style={{
                                    width: 15,
                                    height: 15,
                                    resizeMode: 'contain',
                                    tintColor: type.color,
                                }}
                            />
                        </View>
                        <Text style={styles.actionBtnLabel}>{type.label}</Text>
                    </TouchableOpacity>
                ))}
            </View> */}
    </View>
  );

  const handleReactionSelect = async emoji => {
    if (!reactionTargetId) {
      return;
    }

    const firebaseKey = reactionTargetId;

    const success = await sendMessageReaction(firebaseKey, emoji);

    if (success) {
      setShowEmojiKeyboard(false);
      setReactionTargetId(null);
    }
  };

  // ============================================================
  // RENDER: INLINE MESSAGE ACTIONS
  // ============================================================
  const renderInlineMessageActions = (item, isMe) => (
    <View style={[styles.inlineActionsRow, isMe && styles.inlineActionsRowMe]}>
      <TouchableOpacity
        style={styles.inlineActionBtn}
        onPress={() => {
          setReactionTargetId(item.id);
          setShowEmojiKeyboard(true);
        }}
        activeOpacity={0.6}
      >
        <Image
          source={require('../../asset/happy-outline.png')} // Update the path as needed
          style={{
            width: 14,
            height: 14,
            resizeMode: 'contain',
            tintColor: COLORS.textSecondary,
          }}
        />
        <Text style={styles.inlineActionText}>Emoji</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.inlineActionBtn}
        onPress={() => handleTranslate(item)}
        activeOpacity={0.6}
      >
        <Image
          source={require('../../asset/language-outline.png')} // Update the path as needed
          style={{
            width: 14,
            height: 14,
            resizeMode: 'contain',
            tintColor: COLORS.textSecondary,
          }}
        />
        <Text style={styles.inlineActionText}>Translate</Text>
      </TouchableOpacity>

      {item.translatedText && (
        <TouchableOpacity
          style={styles.inlineActionBtn}
          onPress={() => handleRemoveTranslation(item.id)}
          activeOpacity={0.6}
        >
          <Image
            source={require('../../asset/close-circle.png')} // Update the path as needed
            style={{
              width: 14,
              height: 14,
              resizeMode: 'contain',
              tintColor: COLORS.danger,
            }}
          />
          <Text style={[styles.inlineActionText, { color: COLORS.danger }]}>
            Remove
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ============================================================
  // RENDER: MESSAGE BUBBLE
  // ============================================================
  const renderMessageBubble = ({ item, index }) => {
    const isMe = item.senderId === 'me';
    const typeInfo = getMessageTypeInfo(item.type);
    const showDateSep =
      index === 0 ||
      formatDate(messages[index - 1].dateTime) !== formatDate(item.dateTime);
    const hasTranslation =
      item.translatedText && item.translatedText.length > 0;

    if (item.type === 'email') {
      const emailSubject = item.emailSubject || 'No Subject';
      const emailBody = item.emailBody || 'No body';
      const emailTo = item.emailTo || 'No recipient';
      return (
        <View>
          {showDateSep && (
            <View style={styles.dateSep}>
              <View style={styles.dateSepLine} />
              <Text style={styles.dateSepText}>
                {formatDate(item.dateTime)}
              </Text>
              <View style={styles.dateSepLine} />
            </View>
          )}

          <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
            {!isMe && (
              <Image
                source={{
                  uri:
                    item.senderImage ||
                    sender.image?.uri ||
                    'https://leafnet.us/assets/img/user-demo.jpg',
                }}
                style={styles.msgAvatar}
              />
            )}

            <View style={[styles.msgContainer, isMe && styles.msgContainerMe]}>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: typeInfo.bg,
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                <Image
                  source={typeInfo.icon}
                  style={{
                    width: 10,
                    height: 10,
                    resizeMode: 'contain',
                    tintColor: typeInfo.color,
                  }}
                />
                <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                  {typeInfo.label}
                </Text>
              </View>

              <View
                style={[
                  styles.emailBubble,
                  isMe ? styles.emailBubbleMe : styles.emailBubbleOther,
                ]}
              >
                <View style={styles.emailRow}>
                  <Text style={styles.emailLabel}>To:</Text>
                  <Text style={styles.emailValue} numberOfLines={1}>
                    {emailTo || '-'}
                  </Text>
                </View>

                <View style={styles.emailRow}>
                  <Text style={styles.emailLabel}>Subject:</Text>
                  <Text style={styles.emailValue} numberOfLines={1}>
                    {emailSubject}
                  </Text>
                </View>

                <View style={styles.emailBodyPreview}>
                  <Text style={styles.emailBodyText} numberOfLines={3}>
                    {emailBody}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.seeMoreBtn}
                  onPress={() => {
                    setSelectedEmailMessage({
                      ...item,

                      emailFrom: item.emailFrom || '',
                      emailTo: item.emailTo || '',
                      emailSubject: item.emailSubject || '',
                      emailBody: item.emailBody || item.message || '',

                      contactCount: item.emailTo ? 1 : 0,
                    });

                    setShowEmailMessageModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeMoreText}>See More</Text>

                  <Image
                    source={require('../../asset/chevron-forward.png')}
                    style={{
                      width: 14,
                      height: 14,
                      resizeMode: 'contain',
                      tintColor: COLORS.primary,
                    }}
                  />
                </TouchableOpacity>

                {hasTranslation && (
                  <View style={styles.translationInline}>
                    <View style={styles.translationInlineHeader}>
                      <Image
                        source={require('../../asset/language.png')} // Update the path as needed
                        style={{
                          width: 14,
                          height: 14,
                          resizeMode: 'contain',
                          tintColor: COLORS.primary,
                        }}
                      />
                      <Text style={styles.translationInlineLabel}>
                        {TRANSLATIONS[item.translatedLang]}
                      </Text>
                    </View>
                    <Text style={styles.translationInlineText}>
                      {item.translatedText}
                    </Text>
                  </View>
                )}

                {item.reactions && item.reactions.length > 0 && (
                  <View style={styles.reactionsDisplay}>
                    {item.reactions.map((reaction, rIdx) => (
                      <View key={rIdx} style={styles.reactionBubble}>
                        <Text style={styles.reactionBubbleText}>
                          {reaction.emoji}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {renderInlineMessageActions(item, isMe)}

              <View style={[styles.metaRow, isMe && styles.metaRowMe]}>
                <Text style={styles.metaTime}>{formatTime(item.dateTime)}</Text>
                {isMe && (
                  <Image
                    source={
                      item.isRead
                        ? require('../../asset/checkmark-done.png')
                        : require('../../asset/checkmark.png')
                    }
                    style={{
                      width: 14,
                      height: 14,
                      resizeMode: 'contain',
                      tintColor: item.isRead
                        ? COLORS.info
                        : COLORS.textTertiary,
                    }}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View>
        {showDateSep && (
          <View style={styles.dateSep}>
            <View style={styles.dateSepLine} />
            <Text style={styles.dateSepText}>{formatDate(item.dateTime)}</Text>
            <View style={styles.dateSepLine} />
          </View>
        )}

        <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
          {!isMe && (
            <Image
              source={{
                uri:
                  item.senderImage ||
                  sender.image?.uri ||
                  'https://leafnet.us/assets/img/user-demo.jpg',
              }}
              style={styles.msgAvatar}
            />
          )}

          <View style={[styles.msgContainer, isMe && styles.msgContainerMe]}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: typeInfo.bg,
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                },
              ]}
            >
              <Image
                source={typeInfo.icon}
                style={{
                  width: 10,
                  height: 10,
                  resizeMode: 'contain',
                  tintColor: typeInfo.color,
                }}
              />
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                {typeInfo.label}
              </Text>
            </View>

            <View
              style={[
                styles.bubble,
                isMe ? styles.bubbleMe : styles.bubbleOther,
                {
                  borderLeftColor: typeInfo.color,
                  borderLeftWidth: isMe ? 0 : 3,
                  borderRightColor: typeInfo.color,
                  borderRightWidth: isMe ? 3 : 0,
                },
              ]}
            >
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                {item.message}
              </Text>

              {/* Firebase Reactions */}
              {item.reactions && Object.keys(item.reactions).length > 0 && (
                <View
                  style={[
                    styles.messageReactions,
                    isMe && styles.messageReactionsMe,
                  ]}
                >
                  {Object.entries(item.reactions).map(([userId, reaction]) => (
                    <View key={userId} style={styles.reactionItem}>
                      <Text style={styles.reactionEmoji}>{reaction}</Text>
                    </View>
                  ))}
                </View>
              )}

              {hasTranslation && (
                <View style={styles.translationInline}>
                  <View style={styles.translationInlineHeader}>
                    <Image
                      source={require('../../asset/language.png')} // Update the path as needed
                      style={{
                        width: 11,
                        height: 11,
                        resizeMode: 'contain',
                        tintColor: COLORS.primary,
                      }}
                    />
                    <Text style={styles.translationInlineLabel}>
                      {TRANSLATIONS[item.translatedLang]}
                    </Text>
                  </View>
                  <Text style={styles.translationInlineText}>
                    {item.translatedText}
                  </Text>
                </View>
              )}
            </View>

            {item.reactions && item.reactions.length > 0 && (
              <View
                style={[
                  styles.reactionsDisplay,
                  isMe && styles.reactionsDisplayMe,
                ]}
              >
                {item.reactions.map((reaction, rIdx) => (
                  <View key={rIdx} style={styles.reactionBubble}>
                    <Text style={styles.reactionBubbleText}>
                      {reaction.emoji}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {renderInlineMessageActions(item, isMe)}

            <View style={[styles.metaRow, isMe && styles.metaRowMe]}>
              <Text style={styles.metaTime}>{formatTime(item.dateTime)}</Text>
              {isMe && (
                <Image
                  source={
                    item.isRead
                      ? require('../../asset/checkmark-done.png')
                      : require('../../asset/checkmark.png')
                  }
                  style={{
                    width: 14,
                    height: 14,
                    resizeMode: 'contain',
                    tintColor: item.isRead ? COLORS.info : COLORS.textTertiary,
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ============================================================
  // RENDER: EMAIL DETAIL MODAL
  // ============================================================
  const renderEmailMessageModal = () => {
    if (!selectedEmailMessage) return null;
    const contactCount = selectedEmailMessage.contactCount || 1;

    return (
      <Modal
        visible={showEmailMessageModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowEmailMessageModal(false)}
      >
        <View style={styles.bottomSheetBackdrop}>
          <TouchableWithoutFeedback
            onPress={() => setShowEmailMessageModal(false)}
          >
            <Animated.View
              style={[
                styles.emailMessageSheetContent,
                { transform: [{ translateY: emailMessageSheetHeight }] },
              ]}
            >
              <View style={styles.sheetHandleWrap}>
                <View style={styles.sheetHandle} />
              </View>

              <View style={styles.emailMessageHeader}>
                <View style={styles.emailMessageHeaderDecor}>
                  <View style={styles.emailMessageDecorCircle1} />
                  <View style={styles.emailMessageDecorCircle2} />
                </View>
                <View style={styles.emailMessageHeaderTop}>
                  <View style={styles.emailMessageTitleWrap}>
                    <View style={styles.emailMessageTitleIcon}>
                      <Image
                        source={require('../../asset/email.png')} // Update the path as needed
                        style={{
                          width: 22,
                          height: 22,
                          resizeMode: 'contain',
                          tintColor: COLORS.textInverse,
                        }}
                      />
                    </View>
                    <View style={styles.emailMessageTitleTextWrap}>
                      <Text style={styles.emailMessageTitle}>
                        Email Details
                      </Text>
                      <Text style={styles.emailMessageSubtitle}>
                        {formatFullDate(selectedEmailMessage.dateTime)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.emailMessageCloseBtn}
                    onPress={() => setShowEmailMessageModal(false)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require('../../asset/close.png')} // Update the path as needed
                      style={{
                        width: 18,
                        height: 18,
                        resizeMode: 'contain',
                        tintColor: COLORS.textInverse,
                      }}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.emailMessageBody}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.emailMessageBodyContent}
              >
                <View style={styles.emailDetailCard}>
                  <View
                    style={[
                      styles.emailDetailCardIconWrap,
                      { backgroundColor: COLORS.primarySoft },
                    ]}
                  >
                    <Image
                      source={require('../../asset/person.png')} // Update the path as needed
                      style={{
                        width: 16,
                        height: 16,
                        resizeMode: 'contain',
                        tintColor: COLORS.primary,
                      }}
                    />
                  </View>
                  <View style={styles.emailDetailCardContent}>
                    <Text style={styles.emailDetailCardLabel}>To</Text>
                    <Text style={styles.emailDetailCardValue}>
                      {selectedEmailMessage.emailTo}
                    </Text>
                  </View>
                </View>

                <View style={styles.emailDetailCard}>
                  <View
                    style={[
                      styles.emailDetailCardIconWrap,
                      { backgroundColor: COLORS.primarySoft },
                    ]}
                  >
                    <Image
                      source={require('../../asset/person.png')} // Update the path as needed
                      style={{
                        width: 16,
                        height: 16,
                        resizeMode: 'contain',
                        tintColor: COLORS.primary,
                      }}
                    />
                  </View>
                  <View style={styles.emailDetailCardContent}>
                    <Text style={styles.emailDetailCardLabel}>From</Text>
                    <Text style={styles.emailDetailCardValue}>
                      {selectedEmailMessage.emailFrom}
                    </Text>
                  </View>
                </View>

                <View style={styles.emailDetailCard}>
                  <View
                    style={[
                      styles.emailDetailCardIconWrap,
                      { backgroundColor: COLORS.warningSoft },
                    ]}
                  >
                    <Image
                      source={require('../../asset/bookmark-outline.png')} // Update the path as needed
                      style={{
                        width: 16,
                        height: 16,
                        resizeMode: 'contain',
                        tintColor: COLORS.warning,
                      }}
                    />
                  </View>
                  <View style={styles.emailDetailCardContent}>
                    <Text style={styles.emailDetailCardLabel}>Subject</Text>
                    <Text style={styles.emailDetailCardValue}>
                      {selectedEmailMessage.emailSubject}
                    </Text>
                  </View>
                </View>

                <View style={styles.emailDetailDivider} />

                <View style={styles.emailDetailBodySection}>
                  <View style={styles.emailDetailBodyHeader}>
                    <Image
                      source={require('../../asset/bookmark-outline.png')} // Update the path as needed
                      style={{
                        width: 16,
                        height: 16,
                        resizeMode: 'contain',
                        tintColor: COLORS.textSecondary,
                      }}
                    />
                    <Text style={styles.emailDetailBodyHeaderText}>
                      Message
                    </Text>
                  </View>
                  <View style={styles.emailDetailBodyCard}>
                    <ScrollView
                      style={styles.emailDetailBodyScroll}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      <Text style={styles.emailDetailBodyText}>
                        {selectedEmailMessage.emailBody}
                      </Text>
                    </ScrollView>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // RENDER: MESSAGE TYPE SELECTOR
  // ============================================================
  const renderMessageTypeSelector = () => (
    <View style={styles.typeSelectorWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeSelectorContent}
      >
        {messageTypes.map(type => {
          const isActive = selectedMessageType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeChip,
                isActive && {
                  backgroundColor: type.color,
                  borderColor: type.color,
                },
              ]}
              onPress={() => {
                setSelectedMessageType(type.id);
                if (type.id === 'email') handleOpenEmailCompose();
                else if (type.id === 'whatsapp') handleOpenWhatsappCompose();
                else if (type.id === 'sms') handleOpenSmsCompose();
              }}
              activeOpacity={0.7}
            >
              <Image
                source={type.icon}
                style={{
                  width: 14,
                  height: 14,
                  resizeMode: 'contain',
                  tintColor: isActive ? COLORS.textInverse : type.color,
                }}
              />
              <Text
                style={[
                  styles.typeChipText,
                  isActive && { color: COLORS.textInverse },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ============================================================
  // RENDER: INPUT AREA
  // ============================================================
  const renderInputArea = () => (
    <View style={styles.inputAreaWrapper}>
      <View style={styles.inputArea}>
        <View style={styles.inputBox}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.textTertiary}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={500}
            returnKeyType="default"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={styles.inputIconBtn}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            activeOpacity={0.6}
          >
            <Image
              source={require('../../asset/happy-outline.png')} // Update the path as needed
              style={{
                width: 20,
                height: 20,
                resizeMode: 'contain',
                tintColor: COLORS.textSecondary,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.inputIconBtn}
            onPress={() => setShowAISuggestion(!showAISuggestion)}
            activeOpacity={0.6}
          >
            <Image
              source={require('../../asset/sparkles.png')} // Update the path as needed
              style={{
                width: 20,
                height: 20,
                resizeMode: 'contain',
                tintColor: COLORS.primary,
              }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            !inputMessage.trim() && styles.sendBtnDisabled,
          ]}
          onPress={handleSendSms}
          disabled={!inputMessage.trim()}
          activeOpacity={0.8}
        >
          {isSendingSms ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Image
                source={require('../../asset/send.png')} // Update the path as needed
                style={{
                  width: 18,
                  height: 18,
                  resizeMode: 'contain',
                  tintColor: COLORS.textInverse,
                }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {showEmojiPicker && (
        <EmojiPicker
          open={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelected={emojiObject => {
            const emoji = emojiObject.emoji;

            setInputMessage(prev => prev + emoji);
          }}
        />
      )}

      {showAISuggestion && (
        <View style={styles.aiWrap}>
          <View style={styles.aiHeader}>
            <Image
              source={require('../../asset/sparkles.png')} // Update the path as needed
              style={{
                width: 14,
                height: 14,
                resizeMode: 'contain',
                tintColor: COLORS.primary,
              }}
            />
            <Text style={styles.aiTitle}>AI Suggestions</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {aiSuggestions.map((s, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.aiChip}
                onPress={() => {
                  setInputMessage(s);
                  setShowAISuggestion(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.aiChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // ============================================================
  // RENDER: MESSAGE MODAL
  // ============================================================
  const renderMessageModal = () => {
    const totalMessages = messages.length;

    return (
      <Modal
        visible={showMessageModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.bottomSheetBackdrop}>
          <TouchableWithoutFeedback onPress={() => setShowMessageModal(false)}>
            <Animated.View
              style={[
                styles.bottomSheetContent,
                { transform: [{ translateY: messageSheetHeight }] },
              ]}
            >
              <View style={styles.sheetHandleWrap}>
                <View style={styles.sheetHandle} />
              </View>

              <View style={styles.messageSheetHeader}>
                <View style={styles.messageSheetHeaderDecor}>
                  <View style={styles.messageSheetDecorCircle1} />
                  <View style={styles.messageSheetDecorCircle2} />
                </View>
                <View style={styles.messageSheetHeaderTop}>
                  <View style={styles.messageSheetTitleWrap}>
                    <View style={styles.messageSheetTitleIcon}>
                      <Image
                        source={require('../../asset/chatbubbles.png')} // Update the path as needed
                        style={{
                          width: 20,
                          height: 20,
                          resizeMode: 'contain',
                          tintColor: COLORS.textInverse,
                        }}
                      />
                    </View>
                    <View>
                      <Text style={styles.messageSheetTitle}>
                        Conversation Overview
                      </Text>
                      <Text style={styles.messageSheetSubtitle}>
                        {sender.name} • {sender.type}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.messageSheetCloseBtn}
                    onPress={() => setShowMessageModal(false)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require('../../asset/close.png')} // Update the path as needed
                      style={{
                        width: 18,
                        height: 18,
                        resizeMode: 'contain',
                        tintColor: COLORS.textInverse,
                      }}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.messageSheetTotalCard}
                  onPress={() => {
                    setShowMessageModal(false);
                    setTimeout(() => setShowAnalyticsModal(true), 350);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.messageSheetTotalIconWrap}>
                    <Image
                      source={require('../../asset/analytics.png')} // Update the path as needed
                      style={{
                        width: 28,
                        height: 28,
                        resizeMode: 'contain',
                        tintColor: COLORS.primary,
                      }}
                    />
                  </View>
                  <View style={styles.messageSheetTotalInfo}>
                    <Text style={styles.messageSheetTotalNumber}>
                      {totalMessages}
                    </Text>
                    <Text style={styles.messageSheetTotalLabel}>
                      Total Messages
                    </Text>
                  </View>
                  <View style={styles.messageSheetTotalArrow}>
                    <Image
                      source={require('../../asset/arrow-forward-circle.png')} // Update the path as needed
                      style={{
                        width: 28,
                        height: 28,
                        resizeMode: 'contain',
                        tintColor: COLORS.primary,
                      }}
                    />
                  </View>
                </TouchableOpacity>

                <Text style={styles.messageSheetTapHint}>
                  Tap to view detailed analytics
                </Text>
              </View>

              <View style={styles.messageSheetSection}>
                <Text style={styles.messageSheetSectionTitle}>
                  QUICK ACTIONS
                </Text>
                <View style={styles.messageSheetActionsGrid}>
                  <TouchableOpacity
                    style={styles.messageSheetActionCard}
                    onPress={() => {
                      setShowMessageModal(false);
                      setTimeout(() => setShowFilterModal(true), 350);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.messageSheetActionIcon,
                        { backgroundColor: COLORS.primarySoft },
                      ]}
                    >
                      <Image
                        source={require('../../asset/filter.png')} // Update the path as needed
                        style={{
                          width: 22,
                          height: 22,
                          resizeMode: 'contain',
                          tintColor: COLORS.primary,
                        }}
                      />
                    </View>
                    <Text style={styles.messageSheetActionLabel}>Filter</Text>
                    <Text style={styles.messageSheetActionDesc}>
                      Refine messages
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.messageSheetActionCard}
                    onPress={() => setShowMessageModal(false)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.messageSheetActionIcon,
                        { backgroundColor: COLORS.successSoft },
                      ]}
                    >
                      <Image
                        source={require('../../asset/download.png')} // Update the path as needed
                        style={{
                          width: 22,
                          height: 22,
                          resizeMode: 'contain',
                          tintColor: COLORS.success,
                        }}
                      />
                    </View>
                    <Text style={styles.messageSheetActionLabel}>Export</Text>
                    <Text style={styles.messageSheetActionDesc}>
                      Save as file
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.messageSheetActionCard}
                    onPress={() => setShowMessageModal(false)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.messageSheetActionIcon,
                        { backgroundColor: COLORS.warningSoft },
                      ]}
                    >
                      <Image
                        source={require('../../asset/print.png')} // Update the path as needed
                        style={{
                          width: 22,
                          height: 22,
                          resizeMode: 'contain',
                          tintColor: COLORS.warning,
                        }}
                      />
                    </View>
                    <Text style={styles.messageSheetActionLabel}>Print</Text>
                    <Text style={styles.messageSheetActionDesc}>
                      Print chat
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  if (isLoadingContacts) {
    return (
      <View style={styles.fullScreenLoader}>
        <Loader></Loader>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        enabled={Platform.OS === 'ios' || Platform.OS === 'android'}
      >
        <View style={styles.container}>
          {renderHeader()}

          {selectedFilter !== 'all' && (
            <Animated.View
              style={[styles.filterIndicator, { opacity: fadeAnim }]}
            >
              <Image
                source={require('../../asset/filter.png')} // Update the path as needed
                style={{
                  width: 14,
                  height: 14,
                  resizeMode: 'contain',
                  tintColor: COLORS.primary,
                }}
              />
              <Text style={styles.filterIndicatorText}>
                {filterOptions.find(f => f.id === selectedFilter)?.label}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedFilter('all')}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../asset/close-circle.png')} // Update the path as needed
                  style={{
                    width: 16,
                    height: 16,
                    resizeMode: 'contain',
                    tintColor: COLORS.primary,
                  }}
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={styles.messagesContainer}>
            {isLoadingMessages ? (
              <View style={styles.messageLoaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />

                <Text style={styles.messageLoaderText}>
                  Loading messages...
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={getFilteredMessages()}
                renderItem={renderMessageBubble}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.messagesList}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                onContentSizeChange={() => {
                  // Only scroll to bottom while typing with keyboard open
                  // and never when a reaction is being focused.
                  if (isKeyboardVisible && !reactionFocusIdRef.current) {
                    flatListRef.current?.scrollToEnd({
                      animated: false,
                    });
                  }
                }}
                onScrollToIndexFailed={info => {
                  // Retry after FlatList finishes rendering the item
                  setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                      viewPosition: 0.5,
                    });
                  }, 300);
                }}
              />
            )}
          </View>

          {renderMessageTypeSelector()}
          {renderInputArea()}
        </View>
      </KeyboardAvoidingView>

      <EmojiPicker
        open={showEmojiKeyboard}
        onClose={() => {
          setShowEmojiKeyboard(false);
          setReactionTargetId(null);
        }}
        onEmojiSelected={emojiObject => {
          const emoji = emojiObject.emoji;

          console.log('Selected Emoji:', emoji);

          setShowEmojiKeyboard(false);

          handleReactionSelect(emoji);
        }}
      />

      {showMessageModal && renderMessageModal()}
      {showAnalyticsModal && renderAnalyticsModal()}
      {showTimeFilterModal && renderTimeFilterModal()}
      {showActivityChartFilterModal && renderActivityChartFilterModal()}
      {showActivityChartCustomDateModal && renderActivityChartCustomDateModal()}
      {showCustomDateModal && renderCustomDateModal()}
      {showEmailMessageModal && renderEmailMessageModal()}
      {showEmailComposeModal && renderEmailComposeModal()}
      {emailToModal && renderEmailToPickerModal()}
      {showWhatsappComposeModal && renderWhatsappComposeModal()}
      {whatsappTemplateModal && renderWhatsappTemplatePickerModal()}
      {whatsappNumberModal && renderWhatsappNumberPickerModal()}
      {showSmsComposeModal && renderSmsComposeModal()}
      {smsSenderModal && renderSmsSenderPickerModal()}
      {showContactModal && renderContactModal()}
      {showAddContactModal && renderAddContactModal()}
      {showReactionPicker && renderReactionPicker()}
      {showTranslateModal && renderTranslateModal()}

      {renderDropdownModal({
        visible: showTypeDropdown,
        onClose: () => setShowTypeDropdown(false),
        title: 'Select Type',
        options: typeOptions.map(item => item.type),
        selectedValue: contactForm.type,
        onSelect: selectedType => {
          const selectedItem = typeOptions.find(
            item => item.type === selectedType,
          );

          setContactForm({
            ...contactForm,
            type: selectedType,
            typeId: selectedItem?.id || null,
          });
        },
      })}
      {renderDropdownModal({
        visible: showStateDropdown,
        onClose: () => setShowStateDropdown(false),
        title: 'Select State',

        options: stateOptions.map(item => item.state_name),

        selectedValue: contactForm.state,

        onSelect: selectedState => {
          const selectedItem = stateOptions.find(
            item => item.state_name === selectedState,
          );

          setContactForm({
            ...contactForm,
            state: selectedState,
            stateId: selectedItem?.id || null,
            stateCode: selectedItem?.state_code || '',
          });

          setShowStateDropdown(false);
        },
      })}

      {renderDropdownModal({
        visible: showPhoneCountryDropdown,
        onClose: () => setShowPhoneCountryDropdown(false),
        title: 'Select Country Code',

        options: countryOptions.map(
          item => `${item.country_phone_code} (${item.country_code})`,
        ),

        selectedValue: contactForm.country_phone_code
          ? `${contactForm.country_phone_code} (${contactForm.country_code})`
          : '',

        onSelect: selectedValue => {
          const selectedItem = countryOptions.find(
            item =>
              `${item.country_phone_code} (${item.country_code})` ===
              selectedValue,
          );

          setContactForm({
            ...contactForm,
            country_phone_code: selectedItem?.country_phone_code || '',
            country: selectedItem?.name || '',
            countryId: selectedItem?.id || null,
            country_code: selectedItem?.country_code || '',
          });

          setShowPhoneCountryDropdown(false);
        },
      })}

      {renderDropdownModal({
        visible: showWhatsappCountryDropdown,
        onClose: () => setShowWhatsappCountryDropdown(false),
        title: 'Select Country Code',

        options: countryOptions.map(
          item => `${item.country_phone_code} (${item.country_code})`,
        ),

        selectedValue: contactForm.whatsappCountryCode
          ? `${contactForm.whatsappCountryCode} (${
              contactForm.whatsappCountryCodeCode || ''
            })`
          : '',

        onSelect: selectedValue => {
          const selectedItem = countryOptions.find(
            item =>
              `${item.country_phone_code} (${item.country_code})` ===
              selectedValue,
          );

          setContactForm({
            ...contactForm,
            country_phone_code: selectedItem?.country_phone_code || '',
            country: selectedItem?.name || '',
            countryId: selectedItem?.id || null,
            country_code: selectedItem?.country_code || '',
          });

          setShowWhatsappCountryDropdown(false);
        },
      })}

      {renderDropdownModal({
        visible: showCountryDropdown,
        onClose: () => setShowCountryDropdown(false),
        title: 'Select Country',
        options: countryOptions.map(item => item.name),
        selectedValue: contactForm.country,
        onSelect: selectedCountry => {
          const selectedItem = countryOptions.find(
            item => item.name === selectedCountry,
          );

          setContactForm({
            ...contactForm,
            country: selectedCountry,
            countryId: selectedItem?.id || null,
            country_phone_code: selectedItem?.country_phone_code || null,
            country_code: selectedItem?.country_code || null,
          });

          setShowCountryDropdown(false);
        },
      })}
    </SafeAreaView>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgSecondary },
  keyboardAvoidingContainer: { flex: 1 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecor: { ...StyleSheet.absoluteFillObject },
  decorCircle: { position: 'absolute', borderRadius: 999, opacity: 0.15 },
  decorCircle1: {
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    top: -80,
    right: -50,
  },
  decorCircle2: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.primaryLight,
    bottom: -50,
    left: -40,
  },
  decorCircle3: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primaryLight,
    top: 30,
    right: 60,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 1,
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
  },
  senderTextWrap: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  senderName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },

  contactCardBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  contactCardBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
  },
  contactCardBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textInverse,
    fontFamily: 'sans-serif',
  },

  dropdownBtn: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeDot: { width: 6, height: 6, borderRadius: RADIUS.full },
  senderType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },

  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '400',
    fontFamily: 'sans-serif',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    zIndex: 1,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnIcon: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnLabel: {
    fontSize: 10,
    color: COLORS.textInverse,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: 'sans-serif',
  },

  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  filterIndicatorText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },

  messagesContainer: { flex: 1 },
  messagesList: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  dateSep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.md,
  },
  dateSepLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dateSepText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.full,
    letterSpacing: 0.3,
    fontFamily: 'sans-serif',
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  msgRowMe: { justifyContent: 'flex-end' },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
  },
  msgContainer: { maxWidth: '78%' },
  msgContainerMe: { alignItems: 'flex-end' },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: 'sans-serif',
  },
  bubble: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  bubbleOther: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 21,
    fontFamily: 'sans-serif',
  },
  bubbleTextMe: { color: COLORS.textInverse },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
    paddingHorizontal: 4,
  },
  metaRowMe: { justifyContent: 'flex-end' },
  metaTime: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.2,
    fontFamily: 'sans-serif',
  },

  inlineActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  inlineActionsRowMe: { justifyContent: 'flex-end' },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgTertiary,
  },
  inlineActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'sans-serif',
  },

  reactionsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  reactionsDisplayMe: { justifyContent: 'flex-end' },
  reactionBubble: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  reactionBubbleText: { fontSize: 14 },

  translationInline: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  translationInlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  translationInlineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: 'sans-serif',
  },
  translationInlineText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },

  emailBubble: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 220,
  },
  emailBubbleMe: {
    borderTopRightRadius: 4,
    borderRightWidth: 3,
    borderRightColor: COLORS.warning,
  },
  emailBubbleOther: {
    borderTopLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  emailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  emailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 52,
    fontFamily: 'sans-serif',
  },
  emailValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  emailBodyPreview: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  emailBodyText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 17,
    fontFamily: 'sans-serif',
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.3,
    fontFamily: 'sans-serif',
  },

  typeSelectorWrap: {
    backgroundColor: COLORS.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  typeSelectorContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgPrimary,
    gap: 5,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
    fontFamily: 'sans-serif',
  },

  inputAreaWrapper: {
    backgroundColor: COLORS.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgPrimary,
    gap: SPACING.sm,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.sm,
    lineHeight: 20,
    fontFamily: 'sans-serif',
  },
  inputIconBtn: { paddingHorizontal: 5, paddingBottom: 8 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.textTertiary },

  emojiPicker: {
    backgroundColor: COLORS.bgPrimary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  emojiBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  emojiText: { fontSize: 26, fontFamily: 'sans-serif' },

  aiWrap: {
    backgroundColor: COLORS.primarySoft,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary + '20',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  aiTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: 'sans-serif',
  },
  aiChip: {
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  aiChipText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: SCREEN_HEIGHT * 0.85,
    overflow: 'hidden',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgPrimary,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
  },

  sideDrawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  sideDrawer: {
    width: SIDE_DRAWER_WIDTH,
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    borderTopRightRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },

  // SMS Compose Modal
  smsComposeSheetContent: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    height: SCREEN_HEIGHT * 0.85,
    overflow: 'hidden',
  },
  smsComposeHeader: {
    backgroundColor: COLORS.info,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  smsComposeHeaderDecor: { ...StyleSheet.absoluteFillObject },
  smsComposeDecorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -60,
  },
  smsComposeDecorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -50,
    left: -40,
  },
  smsComposeHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  smsComposeTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  smsComposeTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsComposeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  smsComposeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  smsComposeCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  smsComposeBody: { flex: 1 },
  smsComposeBodyContent: { padding: SPACING.xl, paddingBottom: SPACING.xxl },

  smsSenderSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smsSenderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  smsSenderName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontFamily: 'sans-serif',
  },
  smsSenderNumber: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: 'sans-serif',
  },

  smsCharCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },

  smsSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.info,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
    shadowColor: COLORS.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  smsSendBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },

  smsSenderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  smsSenderOptionActive: { backgroundColor: COLORS.infoSoft },
  smsSenderOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.infoSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsSenderOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  smsSenderOptionNumber: { fontSize: 11, color: COLORS.textSecondary },

  // WhatsApp Compose Modal
  whatsappComposeSheetContent: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    height: SCREEN_HEIGHT * 0.9,
    overflow: 'hidden',
  },
  whatsappComposeHeader: {
    backgroundColor: COLORS.whatsapp,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  whatsappComposeHeaderDecor: { ...StyleSheet.absoluteFillObject },
  whatsappComposeDecorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -60,
  },
  whatsappComposeDecorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -50,
    left: -40,
  },
  whatsappComposeHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  whatsappComposeTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  whatsappComposeTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappComposeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  whatsappComposeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  whatsappComposeCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  whatsappComposeBody: { flex: 1 },
  whatsappComposeBodyContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },

  whatsappTemplateSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  whatsappTemplateName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontFamily: 'sans-serif',
  },
  whatsappTemplateDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: 'sans-serif',
  },

  whatsappNumberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  whatsappSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.whatsapp,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
    shadowColor: COLORS.whatsapp,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappSendBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },

  whatsappTplOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  whatsappTplOptionActive: { backgroundColor: COLORS.primarySoft },
  whatsappTplOptionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  whatsappTplOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  whatsappTplOptionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'sans-serif',
  },

  // Email Compose Modal
  composeSheetContent: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    height: SCREEN_HEIGHT * 0.92,
    overflow: 'hidden',
  },
  composeHeader: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  composeHeaderDecor: { ...StyleSheet.absoluteFillObject },
  composeDecorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -60,
  },
  composeDecorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -50,
    left: -40,
  },
  composeHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  composeTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  composeTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  composeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  composeCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  composeBody: { flex: 1 },
  composeBodyContent: { padding: SPACING.xl, paddingBottom: SPACING.xxl },

  composeFieldRow: { marginBottom: SPACING.md },
  composeFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
    fontFamily: 'sans-serif',
  },
  composeToSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  composeToText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'sans-serif',
  },
  composeFromField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgTertiary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  composeFromText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },
  composeInput: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  composeBlock: { marginBottom: SPACING.md },
  composeBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  composeBlockLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: 'sans-serif',
  },
  composeSignatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  composeSignatureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.3,
    fontFamily: 'sans-serif',
  },
  composeTextarea: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '500',
    minHeight: 140,
    lineHeight: 21,
    fontFamily: 'sans-serif',
  },
  composeSignatureTextarea: {
    minHeight: 100,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  composeSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  composeSendBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },

  emailToOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  emailToOptionActive: { backgroundColor: COLORS.primarySoft },
  emailToAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primarySoft,
  },
  emailToName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  emailToAddress: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'sans-serif',
  },

  contactHeader: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  contactHeaderDecor: { ...StyleSheet.absoluteFillObject },
  contactDecorCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -70,
    right: -50,
  },
  contactDecorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -30,
  },
  contactHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  contactTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  contactTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  contactSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  contactCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  contactBody: { flex: 1 },
  contactBodyContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  addContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addContactCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContactCardTextWrap: { flex: 1 },
  addContactCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: -0.2,
    fontFamily: 'sans-serif',
  },
  addContactCardSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },

  contactItem: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contactItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primarySoft,
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  contactUserTag: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.2,
    fontFamily: 'sans-serif',
  },
  contactItemActions: { flexDirection: 'row', gap: 6 },
  contactIconBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactDetailsWrap: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
    gap: 6,
  },
  contactDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactDetailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },

  addContactSheetContent: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    height: SCREEN_HEIGHT * 0.92,
    overflow: 'hidden',
  },
  addContactHeader: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  addContactHeaderDecor: { ...StyleSheet.absoluteFillObject },
  addContactDecorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -60,
  },
  addContactDecorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight + '30',
    bottom: -50,
    left: -40,
  },
  addContactHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
    marginBottom: SPACING.md,
  },
  addContactTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  addContactTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  addContactSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  addContactCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContactHeaderChips: { flexDirection: 'row', gap: SPACING.sm, zIndex: 1 },
  addContactHeaderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  addContactHeaderChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: 0.3,
    fontFamily: 'sans-serif',
  },
  addContactBody: { flex: 1 },
  addContactBodyContent: { padding: SPACING.xl, paddingBottom: SPACING.xxl },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.primarySoft,
    fontFamily: 'sans-serif',
  },

  formGroup: { marginBottom: SPACING.md },
  formRow: { flexDirection: 'row', gap: SPACING.md },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },
  formInput: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  formDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formDropdownText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },

  phoneRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
  },
  countryCodeText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontFamily: 'sans-serif',
  },
  phoneInput: { flex: 1 },

  saveContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveContactBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },

  dropdownCard: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
    fontFamily: 'sans-serif',
  },
  dropdownBody: { maxHeight: SCREEN_HEIGHT * 0.55 },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  dropdownOptionActive: { backgroundColor: COLORS.primarySoft },
  dropdownOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: 'sans-serif',
  },
  dropdownOptionTextActive: { color: COLORS.primary, fontWeight: '800' },

  translateHeader: {
    backgroundColor: COLORS.info,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  translateHeaderDecor: { ...StyleSheet.absoluteFillObject },
  translateDecorCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -70,
    right: -50,
  },
  translateDecorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -30,
  },
  translateHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  translateTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  translateTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  translateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  translateSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  translateCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  translateBody: { flex: 1 },
  translateBodyContent: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  translateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    fontFamily: 'sans-serif',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  languageChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  languageChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'sans-serif',
  },
  languageChipTextActive: { color: COLORS.textInverse, fontWeight: '700' },
  translationResultCard: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginBottom: SPACING.lg,
  },
  translationResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  translationResultLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: 'sans-serif',
  },
  translationResultText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  translationEmptyCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    minHeight: 120,
  },
  translationEmptyText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  translationSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  translationSaveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textInverse,
    fontFamily: 'sans-serif',
  },

  messageSheetHeader: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  messageSheetHeaderDecor: { ...StyleSheet.absoluteFillObject },
  messageSheetDecorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -60,
  },
  messageSheetDecorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight + '30',
    bottom: -50,
    left: -40,
  },
  messageSheetHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    zIndex: 1,
  },
  messageSheetTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  messageSheetTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  messageSheetSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  messageSheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSheetTotalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.lg,
    zIndex: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  messageSheetTotalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSheetTotalInfo: { flex: 1 },
  messageSheetTotalNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
    lineHeight: 38,
    fontFamily: 'sans-serif',
  },
  messageSheetTotalLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  messageSheetTotalArrow: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSheetTapHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
    zIndex: 1,
    fontFamily: 'sans-serif',
  },
  messageSheetSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  messageSheetSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: SPACING.md,
    fontFamily: 'sans-serif',
  },
  messageSheetActionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  messageSheetActionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  messageSheetActionIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSheetActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'sans-serif',
  },
  messageSheetActionDesc: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },

  analyticsSheetContent: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    height: SCREEN_HEIGHT * 0.92,
    overflow: 'hidden',
    flex: 1,
  },
  analyticsHeader: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 10,
  },
  analyticsHeaderDecor: { ...StyleSheet.absoluteFillObject },
  analyticsDecorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -90,
    right: -70,
  },
  analyticsDecorCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight + '30',
    bottom: -60,
    left: -50,
  },
  analyticsHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    zIndex: 1,
  },
  analyticsTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  analyticsTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  analyticsSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  analyticsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  timeFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
    zIndex: 1,
  },
  timeFilterBtnText: {
    fontSize: 13,
    color: COLORS.textInverse,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },

  analyticsScrollView: { flex: 1, backgroundColor: COLORS.bgSecondary },
  analyticsScrollContent: { padding: SPACING.lg, paddingBottom: 60 },

  analyticsHeroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  analyticsHeroDecor: { ...StyleSheet.absoluteFillObject },
  analyticsHeroCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -50,
    right: -30,
  },
  analyticsHeroCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -30,
    left: -20,
  },
  analyticsHeroContent: { alignItems: 'center', zIndex: 1 },
  analyticsHeroIcon: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  analyticsHeroNumber: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: -2,
    lineHeight: 30,
    fontFamily: 'sans-serif',
  },
  analyticsHeroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
    fontFamily: 'sans-serif',
  },
  analyticsHeroSubLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },

  analyticsStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  analyticsStatCard: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    padding: 5,
    borderLeftWidth: 4,
  },
  analyticsStatIcon: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  analyticsStatNumber: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  analyticsStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  analyticsStatBadge: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  analyticsStatBadgeText: { fontSize: 11, fontWeight: '700' },

  analyticsSection: { marginBottom: SPACING.lg },
  analyticsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
    fontFamily: 'sans-serif',
  },

  mostUsedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderLeftWidth: 4,
  },
  mostUsedIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mostUsedInfo: { flex: 1 },
  mostUsedLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  mostUsedName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  mostUsedDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  mostUsedBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chartCard: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },

  pieChartRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  pieChartWrapper: { alignItems: 'center', justifyContent: 'center' },
  pieChartOuter: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pieLeftHalf: { position: 'absolute', left: 0, top: 0 },
  pieRightHalf: { position: 'absolute', right: 0, top: 0 },
  pieOverlaySent: { position: 'absolute', top: 0 },
  pieOverlayReceived: { position: 'absolute', top: 0 },
  pieLabelLeft: { position: 'absolute', top: '45%', zIndex: 10 },
  pieLabelRight: { position: 'absolute', top: '45%', zIndex: 10 },
  pieLabelText: {
    fontSize: 13,
    color: COLORS.textInverse,
    fontWeight: '800',
    fontFamily: 'sans-serif',
  },
  pieChartCenter: {
    position: 'absolute',
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChartCenterLabel: {
    fontSize: 9,
    color: COLORS.textTertiary,
    fontWeight: '700',
    fontFamily: 'sans-serif',
    letterSpacing: 0.5,
  },
  pieChartCenterValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
    fontFamily: 'sans-serif',
  },

  pieChartLegend: { flex: 1, gap: SPACING.md },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
  },
  pieLegendSent: {
    backgroundColor: COLORS.sentSoft,
    borderLeftColor: COLORS.sent,
  },
  pieLegendReceived: {
    backgroundColor: COLORS.receivedSoft,
    borderLeftColor: COLORS.received,
  },
  pieLegendDot: { width: 16, height: 16, borderRadius: RADIUS.full },
  pieLegendTextWrap: { flex: 1 },
  pieLegendLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  pieLegendValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  pieLegendPercentage: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },

  mediumBars: { gap: SPACING.md },
  mediumBarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  mediumBarLabelWrap: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mediumBarIcon: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediumBarLabel: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  mediumBarTrack: {
    flex: 1,
    height: 26,
    backgroundColor: COLORS.bgTertiary,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  mediumBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    minWidth: 36,
  },
  mediumBarFillText: {
    fontSize: 11,
    color: COLORS.textInverse,
    fontWeight: '700',
    fontFamily: 'sans-serif',
  },
  mediumBarPercentage: {
    fontSize: 12,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
    fontFamily: 'sans-serif',
  },

  tableCard: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgTertiary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: 'sans-serif',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  tableRowAlt: { backgroundColor: COLORS.bgSecondary },
  tableCell: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  tableCellIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  tableShareBar: {
    width: 40,
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  tableShareBarFill: { height: '100%', borderRadius: RADIUS.full },
  tableFooter: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primarySoft,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  tableFooterCell: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'sans-serif',
  },

  activitySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  activityFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  activityFilterBtnText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    fontFamily: 'sans-serif',
  },

  lineChartContainer: { flexDirection: 'row', height: 210 },
  lineChartYAxis: {
    width: 28,
    justifyContent: 'space-between',
    paddingBottom: 28,
    paddingTop: 2,
  },
  lineChartYLabel: {
    fontSize: 9,
    color: COLORS.textTertiary,
    fontWeight: '600',
    textAlign: 'right',
    paddingRight: 4,
    fontFamily: 'sans-serif',
  },
  lineChartContent: { flex: 1, position: 'relative' },
  lineChartGrid: { position: 'relative' },
  lineChartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  lineChartSegment: {
    position: 'absolute',
    height: 2.5,
    backgroundColor: COLORS.success,
    borderRadius: 2,
    zIndex: 2,
  },
  lineChartDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.bgPrimary,
    zIndex: 3,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  lineChartXAxis: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineChartXLabel: {
    position: 'absolute',
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },

  activityFilterCard: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  activityFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  activityFilterIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityFilterTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  activityFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  activityFilterOptionActive: { backgroundColor: COLORS.primarySoft },
  activityFilterOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: 'sans-serif',
  },
  activityFilterOptionTextActive: { color: COLORS.primary, fontWeight: '700' },

  customDateCard: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  customDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  customDateIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    fontFamily: 'sans-serif',
  },
  customDateSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  customDateBody: { marginBottom: SPACING.lg },
  customDateActions: { flexDirection: 'row', gap: SPACING.md },
  customDateCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSecondary,
    alignItems: 'center',
  },
  customDateCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: 'sans-serif',
  },
  customDateApplyBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  customDateApplyText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textInverse,
    fontFamily: 'sans-serif',
  },

  emailMessageSheetContent: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    height: SCREEN_HEIGHT * 0.88,
    overflow: 'hidden',
  },
  emailMessageHeader: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  emailMessageHeaderDecor: { ...StyleSheet.absoluteFillObject },
  emailMessageDecorCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -70,
    right: -50,
  },
  emailMessageDecorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -30,
  },
  emailMessageHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  emailMessageTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  emailMessageTitleIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailMessageTitleTextWrap: { flex: 1 },
  emailMessageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: -0.5,
    fontFamily: 'sans-serif',
  },
  emailMessageSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  emailMessageCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  emailMessageBody: { flex: 1, backgroundColor: COLORS.bgSecondary },
  emailMessageBodyContent: { padding: SPACING.xl, paddingBottom: SPACING.xxl },

  emailDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emailDetailCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  emailDetailCardContent: { flex: 1 },
  emailDetailCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  emailDetailCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 20,
    fontFamily: 'sans-serif',
  },
  emailDetailCardCountBadge: {
    backgroundColor: COLORS.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailDetailCardCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textInverse,
    fontFamily: 'sans-serif',
  },
  emailDetailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  emailDetailBodySection: { marginBottom: SPACING.lg },
  emailDetailBodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  emailDetailBodyHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: 'sans-serif',
  },
  emailDetailBodyCard: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emailDetailBodyScroll: { maxHeight: 260 },
  emailDetailBodyText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    fontFamily: 'sans-serif',
  },
  emailDetailFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  emailDetailFooterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emailDetailFooterBtnPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emailDetailFooterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'sans-serif',
  },

  reactionBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  reactionCard: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 380,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  reactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: 0.3,
    fontFamily: 'sans-serif',
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  reactionEmojiBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: { fontSize: 26, fontFamily: 'sans-serif' },
  typeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },

  typeRow: {
    flexShrink: 1,
    maxWidth: '35%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  senderType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },

  actionsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },

  actionBtn: {
    paddingVertical: 5,
    paddingHorizontal: 4,
  },

  actionBtnIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionBtnLabel: {
    fontSize: 8,
    color: COLORS.textInverse,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  messageReactions: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 4,
    alignItems: 'center',
  },

  messageReactionsMe: {
    justifyContent: 'flex-end',
    marginRight: 4,
  },

  reactionItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reactionEmoji: {
    fontSize: 15,
  },

  messageLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },

  messageLoaderText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },

  fullScreenLoader: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default UserChatPage;
