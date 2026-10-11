
import axios from 'axios';

import {
  createCredentialConfig,
  TelnyxConnectionState,
  TelnyxCallState,
} from '@telnyx/react-voice-commons-sdk';

import { telnyxClient } from './telnyxClient';

const CALL_API_URL =
  'https://leafcom.us/backend/api/chat-application/telnyx/prepareCall';

let currentCall = null;
let callStateSubscription = null;
let isStartingCall = false;

const waitForConnection = (timeoutMs = 20000) => {
  if (
    telnyxClient.currentConnectionState ===
    TelnyxConnectionState.CONNECTED
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let subscription;
    let timeout;

    const cleanup = () => {
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };

    timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Telnyx connection timed out.'));
    }, timeoutMs);

    subscription = telnyxClient.connectionState$.subscribe(state => {
      if (state === TelnyxConnectionState.CONNECTED) {
        cleanup();
        resolve();
      }
    });
  });
};

export const makeTelnyxCall = async ({
  receiverId,
  receiverName,
  receiverType = 'Support',
  toNumber,
  authToken,
  onCallState,
}) => {
  if (isStartingCall || currentCall) {
    throw new Error('A call is already in progress.');
  }

  if (!authToken) {
    throw new Error('Authentication token is missing.');
  }

  if (!receiverId || !toNumber) {
    throw new Error('Receiver ID or phone number is missing.');
  }

  isStartingCall = true;

  try {
    // 1. Request call credentials from your backend.
    const response = await axios.post(
      CALL_API_URL,
      {
        to_number: toNumber,
        call_from: 'users',
        receiver_id: receiverId,
        receiver_name: receiverName,
        receiver_type: receiverType,
        practice_id: null,
        call_as: 'self',
        office_id: null,
        page_url: 'https://leafcom.us/messages',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 30000,
      },
    );

    if (!response.data?.success || !response.data?.data) {
        
      throw new Error(
        response.data?.message || 'Unable to prepare the call.',
      );
    }

    const callData = response.data.data;

    if (
      !callData.sip_username ||
      !callData.sip_password ||
      !callData.to_number
    ) {
      throw new Error('Required Telnyx SIP details are missing.');
    }

    // 2. Connect using the SIP credentials returned by the API.
    if (
      telnyxClient.currentConnectionState !==
      TelnyxConnectionState.CONNECTED
    ) {
      const config = createCredentialConfig(
        callData.sip_username,
        callData.sip_password,
        { debug: __DEV__ },
      );

      // Start observing before initiating login.
      const connectionPromise = waitForConnection();

      try {
        await telnyxClient.login(config);
        await connectionPromise;
      } catch (error) {
        throw error;
      }
    }

    // 3. Start the outgoing call.
    const call = await telnyxClient.newCall(callData.to_number);

    currentCall = call;

    // 4. Report call-state changes and clear finished calls.
    callStateSubscription = call.callState$?.subscribe(event => {
      const state =
        typeof event === 'string'
          ? event
          : event?.state ?? event?.callState;

      onCallState?.(state);

      if (
        state === TelnyxCallState.ENDED ||
        state === TelnyxCallState.FAILED
      ) {
        callStateSubscription?.unsubscribe();
        callStateSubscription = null;
        currentCall = null;
      }
    });

    return {
      call,
      callData: {
        fromNumber: callData.from_number,
        toNumber: callData.to_number,
      },
    };
  } finally {
    isStartingCall = false;
  }
};

export const endTelnyxCall = async () => {
  if (!currentCall) {
    return;
  }

  const call = currentCall;

  try {
    await call.hangup();
  } finally {
    callStateSubscription?.unsubscribe();
    callStateSubscription = null;
    currentCall = null;
  }
};

export const getCurrentTelnyxCall = () => currentCall;
